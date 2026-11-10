import { markup } from "@daman/core/cbamCost.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useAppState } from "../state/AppState.jsx";
import { Drawer, fmt, Num, StatusBadge } from "./ui.jsx";

export default function ProductDrawer({ row, onClose }) {
  const { t, energyLabel } = useLanguage();
  const { ledger, settings } = useAppState();
  if (!row) return null;
  const { product, installation, r } = row;
  const year = settings.year;
  const m = r.ok ? markup(r.good.sector, year) : null;
  const dvTotal = r.ok && typeof r.dv.total === "number" ? r.dv.total : null;
  const dvMarked = dvTotal !== null && m !== null ? dvTotal * (1 + m) : null;
  const entries = ledger.filter((e) => r.entryIds?.includes(e.id));

  const part = (label, value, note, tone = "text-text") => (
    <div className="flex items-start justify-between gap-4 border-b border-line py-3">
      <div>
        <p className="text-sm font-medium text-text">{label}</p>
        <p className="text-xs text-muted">{note}</p>
      </div>
      <Num className={`text-sm ${tone}`}>{value}</Num>
    </div>
  );

  return (
    <Drawer open title={t("drawer.title")} onClose={onClose}>
      <div className="space-y-6">
        <div>
          <Num className="text-sm text-nile">{r.good?.codeDisplay ?? product.cn}</Num>
          <p dir="ltr" className="mt-1 text-start text-sm text-text">{r.good?.description}</p>
          <p className="mt-1 text-xs text-text-2">{installation?.name}</p>
          <div className="mt-3"><StatusBadge status={r.status} /></div>
        </div>

        {r.ok && (
          <>
            {r.warnings.map((w) => (
              <p key={w} className="rounded-control border border-review/30 bg-review-soft px-3 py-2 text-sm text-review">{t(`warnings.${w}`)}</p>
            ))}

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-text-2">{t("drawer.composition")}</h3>
              <div className="mt-2">
                {part(t("drawer.fuel"), `${fmt(r.directActual ? r.fuelT : r.direct, 1)} t`, r.directActual ? t("drawer.fromReceipts", { n: r.receipts.fuel }) : t("drawer.fromDefault"))}
                {r.directActual && part(t("drawer.process"), r.processT === null ? "—" : `${fmt(r.processT, 1)} t`, r.processT === null ? t("drawer.notEntered") : t("drawer.entered"), r.processT === null ? "text-review" : "text-text")}
                {part(t("drawer.electricity"), r.countsIndirect ? `${fmt(r.indirect, 1)} t` : "—", !r.countsIndirect ? t("drawer.notCounted") : r.indirectActual ? `${fmt(r.mwh, 0)} MWh × ${settings.gridFactor} · ${t("drawer.fromReceipts", { n: r.receipts.electricity })}` : t("drawer.fromDefault"))}
              </div>
            </div>

            <div className="rounded-card bg-nile-deep p-5 text-on-nile">
              <p className="text-sm text-on-nile-2">{t("drawer.specific")}</p>
              <p className="mt-1 font-mono text-3xl tabular-nums" dir="ltr">{fmt(r.specific, 4)} <span className="text-base text-on-nile-2">tCO2e/t</span></p>
              <p className="mt-1 text-xs text-on-nile-2"><Num>{fmt(r.total, 1)} t</Num> ÷ <Num>{fmt(product.tonnesProduced)} t</Num></p>
            </div>

            {dvTotal !== null && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-text-2">{t("drawer.compare")}</h3>
                <div className="mt-2">
                  {part(t("drawer.default", { table: r.dv.table === "Egypt" ? t("drawer.tables.egypt") : t("drawer.tables.other") }), `${fmt(dvTotal, 3)} t/t`, "IR (EU) 2025/2621")}
                  {dvMarked !== null && part(t("drawer.defaultMarkup", { markup: `${Math.round(m * 100)}%`, year }), `${fmt(dvMarked, 3)} t/t`, "")}
                </div>
                {dvMarked !== null && r.status !== "default" && (
                  <p className={`mt-3 text-sm ${r.specific < dvMarked ? "text-verified" : "text-anomaly"}`}>
                    {r.specific < dvMarked
                      ? t("drawer.lower", { pct: `${fmt((1 - r.specific / dvMarked) * 100, 1)}%` })
                      : t("drawer.higher", { pct: `${fmt((r.specific / dvMarked - 1) * 100, 1)}%` })}
                  </p>
                )}
              </div>
            )}

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-text-2">{t("drawer.receipts")}</h3>
              {entries.length === 0 ? (
                <p className="mt-2 text-sm text-muted">{t("drawer.noReceipts", { year })}</p>
              ) : (
                <ul className="mt-2 divide-y divide-line">
                  {entries.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <Num className="text-nile">{e.id}</Num>
                      <span className="text-text-2">{energyLabel ? energyLabel(e.energy_type) : e.energy_type}</span>
                      <Num>{fmt(e.volume)} {e.unit}</Num>
                      <StatusBadge status={e.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="text-xs text-muted">{t("prototype")}</p>
          </>
        )}
      </div>
    </Drawer>
  );
}
