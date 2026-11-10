import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PRESENTATION_CHAT from "@daman/core/data/presentation-chat.json";
import { PresentationContext } from "./contexts.js";
import { useAppState } from "./AppState.jsx";
import { usePipeline } from "./Pipeline.jsx";
import { useAuth } from "./Auth.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

// Presentation mode for judges: a guided tour through the demo plant.
// Recorded answers by default (no Gemini requests, works without internet for
// AI); a switch sends the same steps to Gemini live. The presenter clicks Next.
//
// Recorded receipts: packages/core/data/recorded-audits.json
//   [0] diesel 15,000 L (readable, unusual for the production)
//   [2] unclear handwriting (12؟00: a digit cannot be read)
export const STEPS = [
  { id: "welcome", route: "/overview" },
  { id: "unclear", route: "/receipts", run: "unclear" },
  { id: "reject", route: "/receipts" },
  { id: "unusual", route: "/receipts", run: "unusual" },
  { id: "approve", route: "/receipts", run: "prefill" },
  { id: "ledger", route: "/ledger" },
  { id: "report", route: "/report" },
  { id: "cost", route: "/overview" },
  { id: "chat", route: "/overview", run: "chat" },
  { id: "verifier", route: "/verify" },
  { id: "end", route: "/overview" },
];

export function PresentationProvider({ children }) {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const auth = useAuth();
  const app = useAppState();
  const pipeline = usePipeline();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [live, setLive] = useState(false);
  const chatRef = useRef(null);
  const done = useRef(new Set()); // actions already run in this presentation

  const runAction = useCallback(
    (name) => {
      if (name === "unclear") return live ? pipeline.runSampleLive(2) : pipeline.runRecorded(2);
      if (name === "unusual") return live ? pipeline.runSampleLive(0) : pipeline.runRecorded(0);
      if (name === "prefill") {
        const inst = app.installations[0];
        const prod = app.products.find((p) => p.installationId === inst?.id);
        return pipeline.prefillReview(
          { justification: lang === "ar" ? "إعادة تشغيل الفرن بعد الصيانة؛ تم التأكد من سجل الوقود." : "Kiln restart after maintenance; checked against the fuel log.", attest: true },
          { installationId: inst?.id ?? "", productId: prod?.id ?? "" },
        );
      }
      if (name === "chat") {
        chatRef.current?.clear();
        const q = PRESENTATION_CHAT.question[lang];
        if (live) return chatRef.current?.ask(q);
        const note = PRESENTATION_CHAT.source === "recorded" ? null : lang === "ar" ? "إجابة مُعدّة من ملاحظات ضمان المُتحقَّق منها (وضع العرض)." : "Prepared from Daman's verified notes (presentation mode).";
        return chatRef.current?.show(q, { ...PRESENTATION_CHAT.answer[lang], presentationNote: note });
      }
    },
    [live, pipeline, app.installations, app.products, lang],
  );

  const goTo = useCallback(
    (i) => {
      const s = STEPS[Math.max(0, Math.min(STEPS.length - 1, i))];
      setStep(STEPS.indexOf(s));
      if (s.id !== "chat") chatRef.current?.close();
      navigate(s.route);
      // Each action runs once per presentation, so going Back doesn't redo it.
      if (s.run && !done.current.has(s.id)) {
        done.current.add(s.id);
        setTimeout(() => runAction(s.run), 350);
      }
    },
    [navigate, runAction],
  );

  const start = useCallback(() => {
    auth.selectWorkspace(null); // demo on this device; cloud data is never touched
    app.freshDemo();
    pipeline.reset();
    chatRef.current?.clear();
    done.current = new Set();
    setLive(false);
    setActive(true);
    setStep(0);
    navigate(STEPS[0].route);
  }, [auth, app, pipeline, navigate]);

  const exit = useCallback(() => {
    setActive(false);
    chatRef.current?.close();
  }, []);

  // Arrow keys move the tour, Escape leaves it (not while typing).
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") goTo(step + (document.dir === "rtl" ? -1 : 1));
      else if (e.key === "ArrowLeft" || e.key === "PageUp") goTo(step + (document.dir === "rtl" ? 1 : -1));
      else if (e.key === "Escape" && !document.querySelector('[role="dialog"]')) exit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, step, goTo, exit]);

  const value = useMemo(
    () => ({ active, step, steps: STEPS, live, setLive, start, exit, next: () => goTo(step + 1), back: () => goTo(step - 1), rerun: () => STEPS[step].run && runAction(STEPS[step].run), chatRef }),
    [active, step, live, start, exit, goTo, runAction],
  );
  return <PresentationContext.Provider value={value}>{children}</PresentationContext.Provider>;
}

export function usePresentation() {
  const ctx = useContext(PresentationContext);
  if (!ctx) throw new Error("usePresentation must be used inside PresentationProvider");
  return ctx;
}
