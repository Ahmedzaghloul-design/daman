import { useMemo, useRef, useState } from "react";
import { checkMassBalance } from "@daman/core/massBalance.js";
import { computeCO2e } from "@daman/core/emissionFactors.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useAppState } from "../state/AppState.jsx";
import { usePipeline } from "../state/Pipeline.jsx";
import { AnomalyBanner, ReceiptPreview, StatusStepper } from "../components/ReceiptParts.jsx";
import ReviewPanel from "../components/ReviewPanel.jsx";
import { Button, Field, inputClass, Mark, PageHeader } from "../components/ui.jsx";

export default function Receipts() {
  const { t } = useLanguage();
  const { settings, updateSettings, addEntry } = useAppState();
  const { state: p, dispatch, notice, setNotice, processFile, runSample, reset } = usePipeline();
  const busy = p.phase === "ocr" || p.phase === "auditing";

  // Live re-check while the reviewer edits (same rules as the server).
  const review = useMemo(() => {
    if (p.phase !== "review" || !p.receipt) return null;
    const det = checkMassBalance({ receipt: p.receipt, productionTonnes: p.productionTonnes, benchmarks: settings.benchmarks });
    const llm = p.audit.massBalance?.llm;
    // Gemini judged the original extraction; after edits only the arithmetic counts.
    const anomaly = Boolean(det.outOfRange || (!p.edited && llm?.anomaly_detected));
    const reasons = new Set(p.audit.reviewReasons.filter((r) => ["lowConfidence", "modelFlag", "illegibleDigits"].includes(r)));
    if (!(Number(p.receipt.volume) > 0) || !p.receipt.factory_name?.trim() || !p.receipt.energy_type || !p.receipt.unit) reasons.add("missingField");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.receipt.date ?? "")) reasons.add("invalidDate");
    if (anomaly) reasons.add("anomaly");
    return { det, llm, anomaly, reasons: [...reasons], co2e: computeCO2e(p.receipt) };
  }, [p, settings.benchmarks]);

  function approve({ justification }) {
    const id = addEntry({
      ...p.receipt,
      volume: Number(p.receipt.volume),
      co2e_t: review.co2e,
      status: review.anomaly ? "verified_anomaly" : "verified",
      installationId: p.installationId,
      productId: p.productId,
      reviewer: settings.reviewerName.trim(),
      reviewedAt: new Date().toISOString(),
      justification,
      sourceFile: p.file?.name ?? "",
      rawText: p.rawText,
      model: p.audit.model,
      editedByReviewer: p.edited,
      massBalance: { anomaly: review.anomaly, deterministic: review.det, llm: review.llm },
    });
    reset();
    setNotice({ kind: "ok", text: t("receipts.committed", { id }) });
  }

  return (
    <>
      <PageHeader
        title={t("receipts.title")}
        subtitle={t("receipts.subtitle")}
        actions={(p.phase === "review" || p.phase === "error") && <Button variant="secondary" onClick={reset}>{t("receipts.newRecord")}</Button>}
      />
      <div className="space-y-5">
        <StatusStepper phase={p.phase} startedAt={p.startedAt} />

        {notice && (
          <p role="status" className={`fade-up flex items-center gap-3 rounded-card border px-4 py-3 text-sm ${notice.kind === "ok" ? "border-verified/30 bg-verified-soft text-verified" : "border-line bg-card text-text"}`}>
            {notice.kind === "ok" && <span className="seal-press"><Mark size={26} /></span>}
            {notice.text}
          </p>
        )}
        {p.phase === "error" && <p role="alert" className="rounded-card border border-anomaly/40 bg-anomaly-soft px-4 py-3 text-sm text-anomaly">{t("receipts.states.error")}: {p.error}</p>}

        {(p.phase === "idle" || p.phase === "error") && <UploadZone onFile={processFile} onSample={runSample} settings={settings} updateSettings={updateSettings} />}

        {busy && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ReceiptPreview file={p.file} previewUrl={p.previewUrl} rawText={p.rawText} />
            <section className="space-y-3 rounded-card border border-line bg-card p-4" aria-busy="true">
              {[...Array(6)].map((_, i) => <div key={i} className="h-9 animate-pulse rounded-control bg-sand" />)}
            </section>
          </div>
        )}

        {p.phase === "review" && review && (
          <>
            {review.anomaly && <AnomalyBanner deterministic={review.det} llm={review.llm} stale={p.edited} />}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <ReceiptPreview file={p.file} previewUrl={p.previewUrl} rawText={p.rawText} />
              <ReviewPanel
                receipt={p.receipt}
                reasons={review.reasons}
                anomaly={review.anomaly}
                co2e={review.co2e}
                model={p.audit.model}
                threshold={p.audit.confidenceThreshold ?? 0.85}
                installationId={p.installationId}
                productId={p.productId}
                onAssign={(field, value) => dispatch({ type: "ASSIGN", field, value })}
                onEdit={(field, value) => dispatch({ type: "EDIT", field, value })}
                onApprove={approve}
                onReject={() => {
                  reset();
                  setNotice({ kind: "info", text: t("receipts.rejected") });
                }}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}

function UploadZone({ onFile, onSample, settings, updateSettings }) {
  const { t } = useLanguage();
  const [drag, setDrag] = useState(false);
  const ref = useRef(null);
  const camRef = useRef(null); // opens the phone's rear camera directly
  const ok = Number(settings.productionTonnes) > 0;
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_2fr]">
      <section className="rounded-card border border-line bg-card p-4">
        <Field label={t("receipts.production")}>
          <input type="number" min="1" dir="ltr" className={`${inputClass} tabular-nums ${ok ? "" : "border-anomaly"}`} value={settings.productionTonnes} onChange={(e) => updateSettings({ productionTonnes: e.target.value })} />
        </Field>
      </section>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f && ok) onFile(f); }}
        className={`flex flex-col items-center justify-center rounded-card border-2 border-dashed px-6 py-14 text-center transition-colors ${drag ? "border-nile bg-sand" : "border-line bg-card"}`}
      >
        <Mark size={44} />
        <p className="mt-4 font-medium">{t("receipts.drop")}</p>
        <p className="mt-1 text-sm text-muted">{t("receipts.hint")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button disabled={!ok} onClick={() => camRef.current?.click()} className="sm:hidden">{t("receipts.camera")}</Button>
          <Button disabled={!ok} variant="secondary" className="sm:hidden" onClick={() => ref.current?.click()}>{t("receipts.select")}</Button>
          <Button disabled={!ok} className="hidden sm:inline-flex" onClick={() => ref.current?.click()}>{t("receipts.select")}</Button>
          <Button variant="secondary" disabled={!ok} onClick={onSample}>{t("receipts.sample")}</Button>
        </div>
        <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
        <input ref={ref} type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/heic,application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
      </div>
    </div>
  );
}
