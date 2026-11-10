// Pieces of the receipt workbench: progress, source document, anomaly banner.
import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { PHASES } from "../state/Pipeline.jsx";
import { ArabicWithNumbers, fmt, Num } from "./ui.jsx";

export function StatusStepper({ phase, startedAt }) {
  const { t } = useLanguage();
  const current = phase === "error" ? -1 : PHASES.indexOf(phase);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (phase !== "auditing") return;
    const id = setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [phase, startedAt]);
  return (
    <div>
      <ol className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line lg:grid-cols-4">
        {PHASES.map((p, i) => {
          const active = i === current;
          const done = current > i;
          return (
            <li key={p} aria-current={active ? "step" : undefined} className={`bg-card px-4 py-3 ${active ? "shadow-[inset_0_-2px_0_var(--color-nile)]" : ""}`}>
              <p className="tabular-nums text-[11px] text-muted">0{i + 1}{done ? " ✓" : ""}</p>
              <p className={`mt-0.5 text-sm font-medium ${active ? (p === "review" ? "text-review" : "text-nile") : done ? "text-verified" : "text-muted"}`}>
                {t(`receipts.states.${p}`)}
                {active && (p === "ocr" || p === "auditing") && <span className="ms-1 animate-pulse">…</span>}
              </p>
            </li>
          );
        })}
      </ol>
      {phase === "auditing" && (
        <p className="mt-2 text-xs text-muted">
          {t("receipts.slow")} <Num>{elapsed}s</Num>
        </p>
      )}
    </div>
  );
}

export function ReceiptPreview({ file, previewUrl, rawText }) {
  const { t } = useLanguage();
  const lines = rawText ? rawText.split(" - ") : [];
  return (
    <section className="rounded-card border border-line bg-card">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold">{t("review.source")}</h2>
        {file?.name && <Num className="max-w-48 truncate text-xs text-muted">{file.name}</Num>}
      </header>
      <div className="flex justify-center bg-sand/60 p-6">
        {previewUrl ? (
          <img src={previewUrl} alt={t("review.source")} className="max-h-[440px] w-auto rounded-tag border border-line bg-white object-contain" />
        ) : (
          <div dir="rtl" lang="ar" className="relative w-full max-w-sm -rotate-1 rounded-tag bg-paper px-6 py-5 font-receipt text-nile-deep shadow-float">
            <div className="flex items-start justify-between border-b-2 border-nile-deep/70 pb-2">
              <div><p className="text-xl font-bold">إيصال استلام</p><p className="text-sm">وقود / طاقة</p></div>
              <p className="text-sm">رقم ٠٠٤٧١</p>
            </div>
            <div className="mt-3 space-y-1">
              {(lines.length ? lines : ["…"]).map((line, i) => <p key={i} className="border-b border-nile-deep/20 py-1.5 text-xl leading-relaxed">{line}</p>)}
              <p className="py-1.5 text-xl">التوقيع: ________</p>
            </div>
          </div>
        )}
      </div>
      {rawText && (
        <div className="border-t border-line p-4">
          <p className="text-xs font-medium text-text-2">{t("review.raw")}</p>
          <p dir="rtl" lang="ar" className="mt-2 rounded-control bg-cream p-3 tabular-nums text-sm leading-relaxed">
            <ArabicWithNumbers text={rawText} unreadableLabel={t("review.unreadable")} />
          </p>
        </div>
      )}
    </section>
  );
}

export function AnomalyBanner({ deterministic, llm, stale }) {
  const { t } = useLanguage();
  const d = deterministic ?? {};
  return (
    <div role="alert" className="overflow-hidden rounded-card border border-anomaly/40 bg-card">
      <div className="flex items-center gap-3 bg-anomaly px-4 py-2 text-[#04161b]">
        <span className="text-sm font-semibold">{t("anomaly.title")}</span>
        {llm?.severity && llm.severity !== "NONE" && <span className="ms-auto tabular-nums text-xs">{t("anomaly.severity")}: {llm.severity}</span>}
      </div>
      <div className="p-4">
        <p className="text-sm text-anomaly">{t("anomaly.body")}</p>
        {d.evaluated ? (
          <dl className="mt-3 grid grid-cols-1 gap-px overflow-hidden rounded-control border border-line bg-line sm:grid-cols-3">
            {[
              [t("anomaly.intensity"), `${fmt(d.intensity, 2)} ${d.intensityUnit}`, "text-anomaly"],
              [t("anomaly.expected"), `${fmt(d.expectedMin)}–${fmt(d.expectedMax)} ${d.intensityUnit}`, "text-text"],
              [t("anomaly.deviation"), `${d.deviationPct > 0 ? "+" : ""}${fmt(d.deviationPct, 1)}%`, "text-anomaly"],
            ].map(([k, v, c]) => (
              <div key={k} className="bg-card px-3 py-2">
                <dt className="text-xs text-muted">{k}</dt>
                <dd><Num className={`text-lg font-semibold ${c}`}>{v}</Num></dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-2 text-xs text-muted">{t("anomaly.notEvaluated")}</p>
        )}
        {llm?.reasoning && (
          <div className="mt-3">
            <p className="text-xs font-medium text-text-2">{t("anomaly.reasoning")}</p>
            <p dir="ltr" className={`mt-1 text-start text-sm leading-relaxed ${stale ? "text-muted line-through" : "text-text"}`}>{llm.reasoning}</p>
          </div>
        )}
      </div>
    </div>
  );
}
