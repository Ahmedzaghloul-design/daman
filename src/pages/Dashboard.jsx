import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useAppState } from "../state/AppState.jsx";
import { extractArabicText } from "../services/ocrApi.js";
import { auditReceipt } from "../services/geminiApi.js";
import { checkMassBalance } from "../../shared/massBalance.js";
import { computeCO2e, EMISSION_FACTORS } from "../../shared/emissionFactors.js";
import LedgerTable, { ledgerToCsv } from "../components/LedgerTable.jsx";
import ReceiptPreview from "../components/ReceiptPreview.jsx";
import ReviewPanel from "../components/ReviewPanel.jsx";
import AnomalyBanner from "../components/AnomalyBanner.jsx";
import { Button, fmt, LanguageToggle, Logo, Num, Panel, SectionHeader } from "../components/ui.jsx";

const SECTIONS = ["upload", "ledger", "anomalies", "settings"];
const SECTORS = ["cement", "steel", "fertilizers", "aluminium"];

// ---------------------------------------------------------------------------
// Pipeline state machine:
//   idle -> ocr ("Extracting Arabic Script (OCR)...")
//        -> auditing ("Auditing via Gemini...")
//        -> review ("Awaiting HITL Verification")
//        -> idle (after approve / reject)
//   any step can go to "error".
// ---------------------------------------------------------------------------
const PHASES = ["idle", "ocr", "auditing", "review"];

const initialPipeline = {
  phase: "idle",
  file: null,
  previewUrl: null,
  productionTonnes: null,
  rawText: "",
  audit: null, // server response: { receipt, reviewReasons, massBalance, model, confidenceThreshold }
  receipt: null, // reviewer-editable copy of audit.receipt
  edited: false, // reviewer changed a value the mass balance depends on
  error: null,
};

function pipelineReducer(state, action) {
  switch (action.type) {
    case "START":
      return { ...initialPipeline, phase: "ocr", file: action.file, previewUrl: action.previewUrl, productionTonnes: action.productionTonnes };
    case "OCR_DONE":
      return { ...state, phase: "auditing", rawText: action.rawText };
    case "AUDIT_DONE":
      return { ...state, phase: "review", audit: action.audit, receipt: { ...action.audit.receipt } };
    case "EDIT":
      return {
        ...state,
        receipt: { ...state.receipt, [action.field]: action.value },
        edited: state.edited || ["volume", "unit", "energy_type"].includes(action.field),
      };
    case "FAIL":
      return { ...state, phase: "error", error: action.error };
    case "RESET":
      return initialPipeline;
    default:
      return state;
  }
}

export default function Dashboard() {
  const { t } = useLanguage();
  const { ledger, addEntry, settings, updateSettings, apiHealth } = useAppState();
  const [section, setSection] = useState("upload");
  const [pipeline, dispatch] = useReducer(pipelineReducer, initialPipeline);
  const [notice, setNotice] = useState(null);
  const runId = useRef(0);

  // Release object URLs for uploaded images when they are no longer shown.
  useEffect(() => {
    const url = pipeline.previewUrl;
    return () => url && URL.revokeObjectURL(url);
  }, [pipeline.previewUrl]);

  async function processFile(file) {
    const id = ++runId.current; // ignore results from a superseded run
    setNotice(null);
    const isImage = file.type?.startsWith("image/") && file.size > 0;
    dispatch({
      type: "START",
      file,
      previewUrl: isImage ? URL.createObjectURL(file) : null,
      productionTonnes: Number(settings.productionTonnes),
    });

    try {
      // HANDOFF 1: image -> OCR model -> raw unstructured Arabic string.
      const rawText = await extractArabicText(file);
      if (id !== runId.current) return;
      dispatch({ type: "OCR_DONE", rawText });

      // HANDOFF 2: raw Arabic string (unchanged) -> server -> Gemini.
      // Gemini returns strict JSON; the server validates it and runs the
      // mass-balance check against declared production for the period.
      const audit = await auditReceipt(rawText, {
        productionTonnes: Number(settings.productionTonnes),
        sector: settings.sector,
        benchmarks: settings.benchmarks,
      });
      if (id !== runId.current) return;

      // HANDOFF 3: structured record -> HITL review. Nothing is written to
      // the ledger until a named reviewer approves it.
      dispatch({ type: "AUDIT_DONE", audit });
    } catch (err) {
      if (id !== runId.current) return;
      dispatch({ type: "FAIL", error: err.message });
    }
  }

  function runSample() {
    // Zero-byte file: the OCR mock maps it to sample receipt #1 (diesel),
    // and the preview falls back to the rendered mock receipt.
    processFile(new File([], "sample-receipt-0471.jpg", { type: "image/jpeg" }));
  }

  // Live re-evaluation while the reviewer edits fields.
  const review = useMemo(() => {
    if (pipeline.phase !== "review" || !pipeline.receipt) return null;
    const { receipt, audit, edited } = pipeline;
    const deterministic = checkMassBalance({
      receipt,
      productionTonnes: pipeline.productionTonnes,
      benchmarks: settings.benchmarks,
    });
    const llm = audit.massBalance?.llm;
    // Gemini's opinion was formed on the original extraction. Once the
    // reviewer corrects volume/unit/energy type, only the arithmetic counts.
    const anomaly = Boolean(deterministic.outOfRange || (!edited && llm?.anomaly_detected));

    // Reasons tied to the source document stay; field-level ones are recomputed.
    const reasons = new Set(audit.reviewReasons.filter((r) => ["lowConfidence", "modelFlag", "illegibleDigits"].includes(r)));
    if (!(Number(receipt.volume) > 0) || !receipt.factory_name?.trim() || !receipt.energy_type || !receipt.unit) reasons.add("missingField");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(receipt.date ?? "")) reasons.add("invalidDate");
    if (anomaly) reasons.add("anomaly");

    return { deterministic, llm, anomaly, reasons: [...reasons], co2e: computeCO2e(receipt) };
  }, [pipeline, settings.benchmarks]);

  function approve({ justification }) {
    const { receipt, audit, file, rawText, edited } = pipeline;
    const id = addEntry({
      ...receipt,
      volume: Number(receipt.volume),
      co2e_t: review.co2e,
      status: review.anomaly ? "verified_anomaly" : "verified",
      reviewer: settings.reviewerName.trim(),
      reviewedAt: new Date().toISOString(),
      justification,
      sourceFile: file?.name ?? "",
      rawText,
      model: audit.model,
      editedByReviewer: edited,
      massBalance: { anomaly: review.anomaly, deterministic: review.deterministic, llm: review.llm },
    });
    dispatch({ type: "RESET" });
    setNotice({ kind: "success", text: t("review.committed", { id }) });
  }

  function reject() {
    runId.current++;
    dispatch({ type: "RESET" });
    setNotice({ kind: "neutral", text: t("review.rejected") });
  }

  const pendingAnomaly = Boolean(review?.anomaly);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
      <Sidebar section={section} onSelect={setSection} apiHealth={apiHealth} pendingAnomaly={pendingAnomaly} />

      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
          {section === "upload" && (
            <UploadSection
              pipeline={pipeline}
              review={review}
              notice={notice}
              settings={settings}
              updateSettings={updateSettings}
              onFile={processFile}
              onSample={runSample}
              onEdit={(field, value) => dispatch({ type: "EDIT", field, value })}
              onApprove={approve}
              onReject={reject}
              onReset={() => {
                runId.current++;
                dispatch({ type: "RESET" });
              }}
            />
          )}
          {section === "ledger" && <LedgerSection ledger={ledger} />}
          {section === "anomalies" && <AnomaliesSection ledger={ledger} pendingAnomaly={pendingAnomaly} />}
          {section === "settings" && <SettingsSection settings={settings} updateSettings={updateSettings} apiHealth={apiHealth} />}
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------
function Sidebar({ section, onSelect, apiHealth, pendingAnomaly }) {
  const { t } = useLanguage();
  const { settings } = useAppState();

  let api = { color: "bg-slate-500", label: "…" };
  if (apiHealth.ok === false) api = { color: "bg-red-700", label: t("dash.api.offline") };
  else if (apiHealth.ok && apiHealth.mock) api = { color: "bg-amber-600", label: t("dash.api.mock") };
  else if (apiHealth.ok && !apiHealth.keyConfigured) api = { color: "bg-red-700", label: t("dash.api.nokey") };
  else if (apiHealth.ok) api = { color: "bg-emerald-700", label: t("dash.api.connected") };

  return (
    <aside className="flex shrink-0 flex-col bg-slate-900 text-slate-300 md:min-h-screen md:w-64">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-4 py-4">
        <Link to="/" aria-label={t("dash.backToSite")}>
          <Logo inverse />
        </Link>
        <LanguageToggle inverse />
      </div>

      <div className="hidden border-b border-slate-800 px-4 py-3 md:block">
        <p className="text-[11px] uppercase tracking-wider text-slate-500">{t("dash.installation")}</p>
        <p className="mt-0.5 truncate text-sm text-white">{settings.factoryName}</p>
        <p className="font-mono text-xs text-slate-500">{t(`sector.${settings.sector}`)}</p>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-2 py-2 md:flex-col md:py-4">
        <p className="hidden px-2 pb-2 text-[11px] uppercase tracking-wider text-slate-500 md:block">{t("dash.workspace")}</p>
        {SECTIONS.map((s) => {
          const active = section === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onSelect(s)}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center justify-between gap-3 rounded-sm px-3 py-2 text-start text-sm ${active ? "bg-slate-800 text-white" : "hover:bg-slate-800 hover:text-white"}`}
            >
              <span className="flex items-center gap-3">
                <span aria-hidden="true" className={`h-4 w-0.5 ${active ? "bg-white" : "bg-transparent"}`} />
                {t(`dash.nav.${s}`)}
              </span>
              {s === "anomalies" && pendingAnomaly && <span className="h-2 w-2 rounded-sm bg-red-700" aria-hidden="true" />}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto hidden border-t border-slate-800 px-4 py-3 md:block">
        <p className="flex items-center gap-2 text-xs">
          <span className={`h-2 w-2 rounded-sm ${api.color}`} aria-hidden="true" />
          {api.label}
        </p>
        {apiHealth.model && <p className="mt-1 font-mono text-[11px] text-slate-500">{apiHealth.model}</p>}
        <Link to="/" className="mt-3 block text-xs text-slate-500 hover:text-white">
          {t("dash.backToSite")}
        </Link>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Upload Manifests
// ---------------------------------------------------------------------------
function StatusStepper({ phase }) {
  const { t } = useLanguage();
  const current = phase === "error" ? -1 : PHASES.indexOf(phase);

  return (
    <ol className="grid grid-cols-2 gap-px border border-slate-300 bg-slate-300 lg:grid-cols-4">
      {PHASES.map((p, i) => {
        const active = i === current;
        const done = current > i;
        const color = active ? (p === "review" ? "text-amber-600" : "text-slate-900") : done ? "text-emerald-700" : "text-slate-400";
        return (
          <li key={p} className={`bg-white px-4 py-3 ${active ? "border-b-2 border-slate-900" : ""}`} aria-current={active ? "step" : undefined}>
            <p className="font-mono text-xs text-slate-500">
              STEP {String(i).padStart(2, "0")} {done && <span className="text-emerald-700">· DONE</span>}
            </p>
            <p className={`mt-0.5 text-sm font-medium ${color}`}>
              {t(`state.${p}`)}
              {active && (p === "ocr" || p === "auditing") && <span className="ms-1 animate-pulse font-mono">▍</span>}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function UploadSection({ pipeline, review, notice, settings, updateSettings, onFile, onSample, onEdit, onApprove, onReject, onReset }) {
  const { t } = useLanguage();
  const { phase } = pipeline;
  const busy = phase === "ocr" || phase === "auditing";

  return (
    <>
      <SectionHeader
        title={t("upload.title")}
        subtitle={t("upload.subtitle")}
        actions={
          (phase === "review" || phase === "error") && (
            <Button variant="secondary" onClick={onReset}>
              {t("upload.newRecord")}
            </Button>
          )
        }
      />

      <StatusStepper phase={phase} />

      {notice && (
        <p role="status" className={`rounded-sm border bg-white px-4 py-3 text-sm ${notice.kind === "success" ? "border-emerald-700 text-emerald-700" : "border-slate-300 text-slate-700"}`}>
          {notice.text}
        </p>
      )}

      {phase === "error" && (
        <p role="alert" className="rounded-sm border border-red-700 bg-white px-4 py-3 text-sm text-red-700">
          <span className="font-semibold">{t("state.error")}:</span> {pipeline.error}
        </p>
      )}

      {(phase === "idle" || phase === "error") && (
        <UploadZone settings={settings} updateSettings={updateSettings} onFile={onFile} onSample={onSample} />
      )}

      {busy && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ReceiptPreview file={pipeline.file} previewUrl={pipeline.previewUrl} rawText={pipeline.rawText} />
          <Panel title={t("review.extracted")}>
            <div className="space-y-3 p-4" aria-busy="true">
              <p className="font-mono text-sm text-slate-600">{t(`state.${phase}`)}</p>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-9 animate-pulse rounded-sm bg-gray-100" />
              ))}
            </div>
          </Panel>
        </div>
      )}

      {phase === "review" && review && (
        <>
          {review.anomaly && <AnomalyBanner deterministic={review.deterministic} llm={review.llm} llmStale={pipeline.edited} />}
          <div className="grid gap-6 lg:grid-cols-2">
            <ReceiptPreview file={pipeline.file} previewUrl={pipeline.previewUrl} rawText={pipeline.rawText} />
            <ReviewPanel
              receipt={pipeline.receipt}
              reasons={review.reasons}
              anomaly={review.anomaly}
              co2e={review.co2e}
              model={pipeline.audit.model}
              threshold={pipeline.audit.confidenceThreshold ?? 0.85}
              reviewerName={settings.reviewerName}
              onReviewerChange={(v) => updateSettings({ reviewerName: v })}
              onEdit={onEdit}
              onApprove={onApprove}
              onReject={onReject}
            />
          </div>
        </>
      )}
    </>
  );
}

function UploadZone({ settings, updateSettings, onFile, onSample }) {
  const { t } = useLanguage();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const productionOk = Number(settings.productionTonnes) > 0;

  const handleFiles = (files) => {
    const file = files?.[0];
    if (file && productionOk) onFile(file);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Panel title={t("dash.installation")} className="lg:col-span-1">
        <div className="space-y-4 p-4">
          <div>
            <p className="text-xs text-slate-500">{t("settings.factoryName")}</p>
            <p className="text-sm font-medium text-slate-900">{settings.factoryName}</p>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            {t("upload.production")}
            <input
              type="number"
              min="1"
              step="any"
              dir="ltr"
              value={settings.productionTonnes}
              onChange={(e) => updateSettings({ productionTonnes: e.target.value })}
              className={`mt-1 block w-full rounded-sm border bg-white px-3 py-2 font-mono text-sm tabular-nums focus:border-slate-900 focus:outline-none ${productionOk ? "border-slate-300" : "border-red-700"}`}
            />
          </label>
        </div>
      </Panel>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center rounded-sm border-2 border-dashed bg-white px-6 py-14 text-center lg:col-span-2 ${dragging ? "border-slate-900 bg-gray-100" : "border-slate-300"}`}
      >
        <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-sm border border-slate-300 font-mono text-xl text-slate-500">
          ↑
        </span>
        <p className="mt-4 font-medium text-slate-900">{t("upload.dropTitle")}</p>
        <p className="mt-1 text-sm text-slate-500">{t("upload.dropHint")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button disabled={!productionOk} onClick={() => inputRef.current?.click()}>
            {t("upload.select")}
          </Button>
          <Button variant="secondary" disabled={!productionOk} onClick={onSample}>
            {t("upload.sample")}
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compliance Ledgers
// ---------------------------------------------------------------------------
function LedgerSection({ ledger }) {
  const { t } = useLanguage();

  const exportCsv = () => {
    const blob = new Blob([ledgerToCsv(ledger)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daman-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <SectionHeader
        title={t("ledger.title")}
        subtitle={t("ledger.subtitle")}
        actions={
          <Button variant="secondary" onClick={exportCsv} disabled={!ledger.length}>
            {t("ledger.export")}
          </Button>
        }
      />
      <Panel>
        <LedgerTable entries={ledger} />
      </Panel>
    </>
  );
}

// ---------------------------------------------------------------------------
// Mass-Balance Anomalies
// ---------------------------------------------------------------------------
function AnomaliesSection({ ledger, pendingAnomaly }) {
  const { t, energyLabel } = useLanguage();
  const rows = ledger.filter((e) => e.status === "verified_anomaly");
  const th = "whitespace-nowrap border-b border-slate-300 px-3 py-2 text-start text-xs font-semibold uppercase tracking-wider text-slate-600";
  const td = "border-b border-slate-200 px-3 py-2 text-sm align-top";

  return (
    <>
      <SectionHeader title={t("anomalies.title")} subtitle={t("anomalies.subtitle")} />
      {pendingAnomaly && (
        <p role="status" className="rounded-sm border border-amber-600 bg-white px-4 py-3 text-sm text-amber-600">
          {t("anomalies.pending")}
        </p>
      )}
      <Panel>
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-slate-600">{t("anomalies.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className={th}>{t("ledger.col.id")}</th>
                  <th className={th}>{t("ledger.col.date")}</th>
                  <th className={th}>{t("ledger.col.energy")}</th>
                  <th className={`${th} text-end`}>{t("anomaly.intensity")}</th>
                  <th className={`${th} text-end`}>{t("anomaly.expected")}</th>
                  <th className={`${th} text-end`}>{t("anomaly.deviation")}</th>
                  <th className={th}>{t("anomalies.col.justification")}</th>
                  <th className={th}>{t("ledger.col.reviewer")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => {
                  const d = e.massBalance?.deterministic ?? {};
                  return (
                    <tr key={e.id}>
                      <td className={td}><Num>{e.id}</Num></td>
                      <td className={td}><Num>{e.date}</Num></td>
                      <td className={td}>{energyLabel(e.energy_type)}</td>
                      <td className={`${td} text-end`}>
                        <Num className="text-red-700">{d.evaluated ? `${fmt(d.intensity, 2)} ${d.intensityUnit}` : "—"}</Num>
                      </td>
                      <td className={`${td} text-end`}>
                        <Num>{d.evaluated ? `${fmt(d.expectedMin)}–${fmt(d.expectedMax)}` : "—"}</Num>
                      </td>
                      <td className={`${td} text-end`}>
                        <Num className="text-red-700">{d.evaluated ? `${d.deviationPct > 0 ? "+" : ""}${fmt(d.deviationPct, 1)}%` : "—"}</Num>
                      </td>
                      <td className={`${td} max-w-sm text-slate-700`}>{e.justification || "—"}</td>
                      <td className={`${td} whitespace-nowrap text-slate-700`}>{e.reviewer}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
function SettingsSection({ settings, updateSettings, apiHealth }) {
  const { t, energyLabel } = useLanguage();
  const { resetLedger } = useAppState();
  const input = "mt-1 block w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none";

  const setBenchmark = (type, key, value) =>
    updateSettings({
      benchmarks: { ...settings.benchmarks, [type]: { ...settings.benchmarks[type], [key]: Number(value) } },
    });

  return (
    <>
      <SectionHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={t("dash.installation")}>
          <div className="grid gap-4 p-4">
            <label className="text-sm font-medium text-slate-700">
              {t("settings.factoryName")}
              <input className={input} value={settings.factoryName} onChange={(e) => updateSettings({ factoryName: e.target.value })} />
            </label>
            <label className="text-sm font-medium text-slate-700">
              {t("settings.sector")}
              <select className={input} value={settings.sector} onChange={(e) => updateSettings({ sector: e.target.value })}>
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {t(`sector.${s}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              {t("settings.reviewer")}
              <input className={input} value={settings.reviewerName} onChange={(e) => updateSettings({ reviewerName: e.target.value })} />
            </label>
            <label className="text-sm font-medium text-slate-700">
              {t("settings.production")}
              <input
                type="number"
                min="1"
                dir="ltr"
                className={`${input} font-mono`}
                value={settings.productionTonnes}
                onChange={(e) => updateSettings({ productionTonnes: e.target.value })}
              />
            </label>
            <div className="border-t border-slate-300 pt-4">
              <p className="text-xs text-slate-500">{t("settings.model")}</p>
              <Num className="text-sm text-slate-900">{apiHealth.model ?? "—"}</Num>
            </div>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title={t("settings.benchmarks")}>
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr className="text-xs uppercase tracking-wider text-slate-600">
                  <th className="px-4 py-2 text-start font-semibold">{t("field.energy_type")}</th>
                  <th className="px-4 py-2 text-start font-semibold">{t("field.unit")}</th>
                  <th className="px-4 py-2 text-start font-semibold">{t("settings.min")}</th>
                  <th className="px-4 py-2 text-start font-semibold">{t("settings.max")}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(settings.benchmarks).map(([type, b]) => (
                  <tr key={type} className="border-t border-slate-200">
                    <td className="px-4 py-2 text-sm">{energyLabel(type)}</td>
                    <td className="px-4 py-2"><Num className="text-sm text-slate-600">{b.unit}/t</Num></td>
                    {["min", "max"].map((k) => (
                      <td key={k} className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          dir="ltr"
                          aria-label={`${type} ${k}`}
                          value={b[k]}
                          onChange={(e) => setBenchmark(type, k, e.target.value)}
                          className="w-24 rounded-sm border border-slate-300 px-2 py-1 font-mono text-sm tabular-nums focus:border-slate-900 focus:outline-none"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-slate-300 px-4 py-2 text-xs text-amber-600">{t("settings.benchmarksNote")}</p>
          </Panel>

          <Panel title={t("settings.factors")}>
            <table className="min-w-full">
              <tbody>
                {Object.entries(EMISSION_FACTORS).map(([type, f]) => (
                  <tr key={type} className="border-b border-slate-200">
                    <td className="px-4 py-2 text-sm">{energyLabel(type)}</td>
                    <td className="px-4 py-2 text-end">
                      <Num className="text-sm">{f.kgCO2ePerUnit} kgCO2e/{f.unit}</Num>
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-500">{f.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-2 text-xs text-amber-600">{t("settings.factorsNote")}</p>
          </Panel>

          <Button
            variant="danger"
            onClick={() => {
              if (window.confirm(t("settings.resetConfirm"))) resetLedger();
            }}
          >
            {t("settings.reset")}
          </Button>
        </div>
      </div>
    </>
  );
}
