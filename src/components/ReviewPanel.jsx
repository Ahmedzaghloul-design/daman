import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { Button, fmt, Num, Panel } from "./ui.jsx";

const ENERGY_OPTIONS = ["Diesel", "Electricity", "Natural Gas", "Heavy Fuel Oil", "Coal", "Petcoke"];
const UNIT_OPTIONS = ["L", "kWh", "m3", "t"];

/**
 * Right side of the split-screen review: the structured record Gemini
 * returned, editable by the reviewer, plus the sign-off controls.
 */
export default function ReviewPanel({
  receipt,
  reasons,
  anomaly,
  co2e,
  model,
  threshold,
  reviewerName,
  onReviewerChange,
  onEdit,
  onApprove,
  onReject,
}) {
  const { t, energyLabel } = useLanguage();
  const [attested, setAttested] = useState(false);
  const [justification, setJustification] = useState("");

  const confidence = receipt.confidence_score ?? 0;
  const lowConfidence = confidence < threshold;
  const flagged = reasons.length > 0;
  const volumeValid = Number(receipt.volume) > 0;
  const justificationOk = !anomaly || justification.trim().length >= 10;
  const canApprove = attested && reviewerName.trim() && volumeValid && justificationOk;

  const fieldFlag = (field) => {
    if (field === "volume" && !volumeValid) return true;
    if (field === "date" && reasons.includes("invalidDate")) return true;
    if (!String(receipt[field] ?? "").trim()) return true;
    return false;
  };

  const input = (flag) =>
    `mt-1 block w-full rounded-sm border bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900 ${flag ? "border-amber-600" : "border-slate-300"}`;

  return (
    <Panel
      title={t("review.extracted")}
      actions={
        <span className="font-mono text-xs text-slate-500">
          {t("review.model")}: {model}
        </span>
      }
    >
      <div className="space-y-5 p-4">
        {/* Confidence readout */}
        <div>
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">{t("review.confidence")}</p>
            <p className="text-xs text-slate-500">
              {t("review.threshold")} <Num>{fmt(threshold, 2)}</Num>
            </p>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 rounded-sm bg-gray-200" dir="ltr">
              <div
                className={`h-2 rounded-sm ${lowConfidence ? "bg-amber-600" : "bg-emerald-700"}`}
                style={{ width: `${Math.round(confidence * 100)}%` }}
              />
            </div>
            <Num className={`text-lg font-semibold ${lowConfidence ? "text-amber-600" : "text-emerald-700"}`}>
              {fmt(confidence, 2)}
            </Num>
          </div>
        </div>

        {/* Review flags */}
        <div className={`rounded-sm border p-3 ${flagged ? "border-amber-600" : "border-emerald-700"}`}>
          <p className={`text-sm font-semibold ${flagged ? "text-amber-600" : "text-emerald-700"}`}>
            {flagged ? t("review.flagged") : t("review.clear")}
          </p>
          {flagged && (
            <ul className="mt-1 space-y-0.5 text-sm text-slate-700">
              {reasons.map((r) => (
                <li key={r} className={r === "anomaly" ? "text-red-700" : ""}>
                  — {t(`reason.${r}`)}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Editable extracted fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            {t("field.factory_name")}
            <input
              className={input(fieldFlag("factory_name"))}
              value={receipt.factory_name ?? ""}
              onChange={(e) => onEdit("factory_name", e.target.value)}
              dir="ltr"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            {t("field.energy_type")}
            <select
              className={input(fieldFlag("energy_type"))}
              value={receipt.energy_type ?? ""}
              onChange={(e) => onEdit("energy_type", e.target.value)}
            >
              {!ENERGY_OPTIONS.includes(receipt.energy_type) && <option value={receipt.energy_type}>{receipt.energy_type || "—"}</option>}
              {ENERGY_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {energyLabel(o)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            {t("field.date")}
            <input
              type="date"
              className={`${input(fieldFlag("date"))} font-mono`}
              value={/^\d{4}-\d{2}-\d{2}$/.test(receipt.date ?? "") ? receipt.date : ""}
              onChange={(e) => onEdit("date", e.target.value)}
              dir="ltr"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            {t("field.volume")}
            <input
              type="number"
              min="0"
              step="any"
              className={`${input(fieldFlag("volume"))} font-mono tabular-nums`}
              value={receipt.volume ?? ""}
              onChange={(e) => onEdit("volume", e.target.value === "" ? null : Number(e.target.value))}
              dir="ltr"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            {t("field.unit")}
            <select
              className={`${input(fieldFlag("unit"))} font-mono`}
              value={receipt.unit ?? ""}
              onChange={(e) => onEdit("unit", e.target.value)}
            >
              {!UNIT_OPTIONS.includes(receipt.unit) && <option value={receipt.unit}>{receipt.unit || "—"}</option>}
              {UNIT_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Calculated emissions */}
        <div className="flex items-baseline justify-between border-t border-slate-300 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">{t("review.co2e")}</p>
          {co2e === null ? (
            <p className="text-xs text-amber-600">{t("review.co2eNa")}</p>
          ) : (
            <Num className="text-xl font-semibold text-slate-900">{fmt(co2e, 3)} tCO2e</Num>
          )}
        </div>

        {/* Sign-off */}
        <div className="space-y-3 border-t border-slate-300 pt-4">
          <label className="block text-sm font-medium text-slate-700">
            {t("review.reviewer")}
            <input className={input(!reviewerName.trim())} value={reviewerName} onChange={(e) => onReviewerChange(e.target.value)} />
          </label>
          {anomaly && (
            <label className="block text-sm font-medium text-red-700">
              {t("review.justification")}
              <textarea
                rows={3}
                className={input(!justificationOk)}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
              />
            </label>
          )}
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded-sm border-slate-300 accent-slate-900"
              checked={attested}
              onChange={(e) => setAttested(e.target.checked)}
            />
            {t("review.attest")}
          </label>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button variant="success" disabled={!canApprove} onClick={() => onApprove({ justification: justification.trim() })}>
              {t("review.approve")}
            </Button>
            <Button variant="danger" onClick={onReject}>
              {t("review.reject")}
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  );
}
