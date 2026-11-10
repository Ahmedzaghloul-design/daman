import { useContext, useEffect, useReducer, useRef, useState } from "react";
import { PipelineContext } from "./contexts.js";
import { extractArabicText } from "../services/ocrApi.js";
import { auditReceipt, auditReceiptImage, getApiHealth } from "../services/geminiApi.js";
import { useAppState } from "./AppState.jsx";

// Receipt state machine, kept above the routes so navigating away does not
// lose a receipt that is being checked:
//   idle -> ocr -> auditing -> review -> idle (approve / reject); any -> error
export const PHASES = ["idle", "ocr", "auditing", "review"];
// Error key the page translates (Gemini unpaid tier + real data).
export const REAL_DATA_BLOCKED = "real_data_blocked";

const initial = {
  phase: "idle",
  file: null,
  previewUrl: null,
  productionTonnes: null,
  rawText: "",
  audit: null,
  receipt: null,
  edited: false,
  installationId: "",
  productId: "",
  startedAt: null,
  error: null,
};

function reducer(s, a) {
  switch (a.type) {
    case "START":
      return { ...initial, phase: "ocr", file: a.file, previewUrl: a.previewUrl, productionTonnes: a.productionTonnes, installationId: a.installationId ?? "", productId: a.productId ?? "", startedAt: Date.now() };
    case "OCR_DONE":
      return { ...s, phase: "auditing", rawText: a.rawText, startedAt: Date.now() };
    case "AUDIT_DONE":
      return { ...s, phase: "review", audit: a.audit, receipt: { ...a.audit.receipt } };
    case "EDIT":
      return { ...s, receipt: { ...s.receipt, [a.field]: a.value }, edited: s.edited || ["volume", "unit", "energy_type"].includes(a.field) };
    case "ASSIGN":
      return { ...s, [a.field]: a.value, ...(a.field === "installationId" ? { productId: "" } : {}) };
    case "FAIL":
      return { ...s, phase: "error", error: a.error };
    case "RESET":
      return initial;
    default:
      return s;
  }
}


export function PipelineProvider({ children }) {
  const { settings, installations, products } = useAppState();
  const [state, dispatch] = useReducer(reducer, initial);
  const [notice, setNotice] = useState(null);
  const runId = useRef(0);
  // realDataAllowed: the server confirmed Gemini billing (paid tier) is on.
  const [health, setHealth] = useState(null);
  useEffect(() => {
    getApiHealth().then(setHealth);
  }, []);

  useEffect(() => {
    const url = state.previewUrl;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [state.previewUrl]);

  async function processFile(file, { testData = false } = {}) {
    const id = ++runId.current;
    setNotice(null);
    const isImage = file.type?.startsWith("image/") && file.size > 0;
    // Pre-select when there is only one installation / product.
    const inst = installations.length === 1 ? installations[0].id : "";
    const prods = products.filter((p) => p.installationId === inst);
    dispatch({
      type: "START",
      file,
      previewUrl: isImage ? URL.createObjectURL(file) : null,
      productionTonnes: Number(settings.productionTonnes),
      installationId: inst,
      productId: prods.length === 1 ? prods[0].id : "",
    });
    const ctx = { productionTonnes: Number(settings.productionTonnes), sector: "cement", benchmarks: settings.benchmarks };
    try {
      // Real photo: Gemini reads the image, then the same checks run on the server.
      if (isImage || file.type === "application/pdf") {
        if (!health?.realDataAllowed && !testData) throw new Error(REAL_DATA_BLOCKED);
        const audit = await auditReceiptImage(file, { ...ctx, testData });
        if (id !== runId.current) return;
        dispatch({ type: "OCR_DONE", rawText: audit.rawText });
        dispatch({ type: "AUDIT_DONE", audit });
        return;
      }
      // Built-in sample: mock OCR text -> raw Arabic text.
      // HANDOFF 1: image -> OCR (mock CNN-BiLSTM-CTC) -> raw Arabic text.
      const rawText = await extractArabicText(file);
      if (id !== runId.current) return;
      dispatch({ type: "OCR_DONE", rawText });
      // HANDOFF 2: raw text -> API -> Gemini structuring + checks.
      const audit = await auditReceipt(rawText, ctx);
      if (id !== runId.current) return;
      // HANDOFF 3: structured record -> human review. Nothing reaches the ledger yet.
      dispatch({ type: "AUDIT_DONE", audit });
    } catch (err) {
      if (id !== runId.current) return;
      dispatch({ type: "FAIL", error: err.message === REAL_DATA_BLOCKED || err.code === "real_data_blocked" ? REAL_DATA_BLOCKED : err.message });
    }
  }

  const value = {
    health,
    state,
    dispatch,
    notice,
    setNotice,
    processFile,
    runSample: () => processFile(new File([], "sample-receipt-0471.jpg", { type: "image/jpeg" })),
    reset: () => {
      runId.current++;
      dispatch({ type: "RESET" });
    },
  };
  return <PipelineContext.Provider value={value}>{children}</PipelineContext.Provider>;
}

export function usePipeline() {
  const ctx = useContext(PipelineContext);
  if (!ctx) throw new Error("usePipeline must be used inside PipelineProvider");
  return ctx;
}
