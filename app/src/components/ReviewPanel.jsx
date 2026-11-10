import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useAppState } from "../state/AppState.jsx";
import { Button, Field, fmt, inputClass, Num } from "./ui.jsx";

const ENERGY = ["Diesel", "Electricity", "Natural Gas", "Heavy Fuel Oil", "Coal", "Petcoke"];
const UNITS = ["L", "kWh", "m3", "t"];

/** The extracted record, editable, plus assignment and sign-off. */
export default function ReviewPanel({ receipt, reasons, anomaly, co2e, model, threshold, installationId, productId, onAssign, onEdit, onApprove, onReject, sendMode = false, busy = false }) {
  const { t, energyLabel } = useLanguage();
  const { installations, products, settings, updateSettings, inCloud } = useAppState();
  const [attested, setAttested] = useState(false);
  const [justification, setJustification] = useState("");
  const conf = receipt.confidence_score ?? 0;
  const low = conf < threshold;
  const volumeOk = Number(receipt.volume) > 0;
  const assigned = installationId && productId;
  const justOk = !anomaly || justification.trim().length >= 10;
  // An uploader only sends it on: the reviewer does the attestation and assignment.
  const canApprove = sendMode ? volumeOk : !busy && attested && settings.reviewerName.trim() && volumeOk && assigned && justOk;
  const allReasons = assigned ? reasons : [...reasons, "unassigned"];
  const flag = (f) => (f === "volume" ? !volumeOk : f === "date" ? reasons.includes("invalidDate") : !String(receipt[f] ?? "").trim());
  const field = (f) => `${inputClass} ${flag(f) ? "border-review" : ""}`;

  return (
    <section className="rounded-card border border-line bg-card">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold">{t("review.extracted")}</h2>
        <Num className="text-xs text-muted">{t("review.model")}: {model}</Num>
      </header>
      <div className="space-y-5 p-4">
        <div>
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-medium text-text-2">{t("review.confidence")}</span>
            <span className="text-muted">{t("review.threshold")} <Num>{fmt(threshold, 2)}</Num></span>
          </div>
          <div className="mt-2 flex items-center gap-3" dir="ltr">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand"><div className={`h-full rounded-full ${low ? "bg-review" : "bg-verified"}`} style={{ width: `${Math.round(conf * 100)}%` }} /></div>
            <Num className={`font-semibold ${low ? "text-review" : "text-verified"}`}>{fmt(conf, 2)}</Num>
          </div>
        </div>

        <div className={`rounded-control border p-3 ${allReasons.length ? "border-review/40 bg-review-soft" : "border-verified/30 bg-verified-soft"}`}>
          <p className={`text-sm font-semibold ${allReasons.length ? "text-review" : "text-verified"}`}>{allReasons.length ? t("review.flagged") : t("review.clear")}</p>
          {allReasons.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-sm text-text">
              {allReasons.map((r) => <li key={r} className={r === "anomaly" ? "text-anomaly" : ""}>— {t(`review.reasons.${r}`)}</li>)}
            </ul>
          )}
        </div>

        <div>
          <p className="text-xs font-medium text-text-2">{t("review.assign")}</p>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select aria-label={t("review.installation")} className={`${inputClass} ${!installationId ? "border-review" : ""}`} value={installationId} onChange={(e) => onAssign("installationId", e.target.value)}>
              <option value="">{t("review.installation")}: {t("review.choose")}</option>
              {installations.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <select aria-label={t("review.product")} className={`${inputClass} ${!productId ? "border-review" : ""}`} value={productId} onChange={(e) => onAssign("productId", e.target.value)} disabled={!installationId}>
              <option value="">{t("review.product")}: {t("review.choose")}</option>
              {products.filter((p) => p.installationId === installationId).map((p) => <option key={p.id} value={p.id}>{p.cn.replace(/(\d{4})(\d{2})(\d{2})(\d*)/, "$1 $2 $3 $4").trim()}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("review.fields.factory_name")} className="sm:col-span-2">
            <input dir="ltr" className={field("factory_name")} value={receipt.factory_name ?? ""} onChange={(e) => onEdit("factory_name", e.target.value)} />
          </Field>
          <Field label={t("review.fields.energy_type")}>
            <select className={field("energy_type")} value={receipt.energy_type ?? ""} onChange={(e) => onEdit("energy_type", e.target.value)}>
              {!ENERGY.includes(receipt.energy_type) && <option value={receipt.energy_type}>{receipt.energy_type || "—"}</option>}
              {ENERGY.map((o) => <option key={o} value={o}>{energyLabel(o)}</option>)}
            </select>
          </Field>
          <Field label={t("review.fields.date")}>
            <input type="date" dir="ltr" className={`${field("date")} tabular-nums`} value={/^\d{4}-\d{2}-\d{2}$/.test(receipt.date ?? "") ? receipt.date : ""} onChange={(e) => onEdit("date", e.target.value)} />
          </Field>
          <Field label={t("review.fields.volume")}>
            <input type="number" min="0" step="any" dir="ltr" className={`${field("volume")} tabular-nums`} value={receipt.volume ?? ""} onChange={(e) => onEdit("volume", e.target.value === "" ? null : Number(e.target.value))} />
          </Field>
          <Field label={t("review.fields.unit")}>
            <select className={`${field("unit")} tabular-nums`} value={receipt.unit ?? ""} onChange={(e) => onEdit("unit", e.target.value)}>
              {!UNITS.includes(receipt.unit) && <option value={receipt.unit}>{receipt.unit || "—"}</option>}
              {UNITS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
        </div>

        <div className="flex items-baseline justify-between border-t border-line pt-4">
          <span className="text-xs font-medium text-text-2">{t("review.co2e")}</span>
          {co2e === null ? <span className="text-xs text-review">{t("review.co2eNa")}</span> : <Num className="text-xl font-semibold">{fmt(co2e, 3)} tCO2e</Num>}
        </div>

        <div className="space-y-3 border-t border-line pt-4">
          <Field label={t("review.reviewer")}>
            {inCloud ? (
              <input className={`${inputClass} text-text-2`} value={settings.reviewerName} readOnly dir="ltr" />
            ) : (
              <input className={`${inputClass} ${!settings.reviewerName.trim() ? "border-review" : ""}`} value={settings.reviewerName} onChange={(e) => updateSettings({ reviewerName: e.target.value })} />
            )}
          </Field>
          {anomaly && !sendMode && (
            <Field label={t("review.justification")}>
              <textarea rows={3} className={`${inputClass} h-auto py-2 ${!justOk ? "border-review" : ""}`} value={justification} onChange={(e) => setJustification(e.target.value)} />
            </Field>
          )}
          {!sendMode && (
            <label className="flex items-start gap-2 text-sm text-text">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-nile" checked={attested} onChange={(e) => setAttested(e.target.checked)} />
              {t("review.attest")}
            </label>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="success" disabled={!canApprove} onClick={() => onApprove({ justification: justification.trim() })}>{t(sendMode ? "review.send" : "review.approve")}</Button>
            <Button variant="danger" onClick={onReject}>{t("review.reject")}</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
