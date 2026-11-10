import { Link } from "react-router-dom";
import { benchmarkOptions, CBAM_DATA, defaultFor, defaultValueCost, distinctBenchmarks } from "@daman/core/cbamCost.js";
import { computeCO2e } from "@daman/core/emissionFactors.js";
import { reportTotals } from "@daman/core/report.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useAppState } from "../state/AppState.jsx";
import { usePipeline } from "../state/Pipeline.jsx";
import { useReport } from "../lib/useReport.js";
import { WEBSITE_URL } from "../components/Layout.jsx";
import { buttonClass, fmt, Num, PageHeader, Panel, StatusBadge } from "../components/ui.jsx";

const LATEST_PRICE = CBAM_DATA.prices2026.Q3.eur;
const MONTHS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const ENERGY_COLOR = { Diesel: "bg-gold", "Natural Gas": "bg-nile", Electricity: "bg-on-nile-2", "Heavy Fuel Oil": "bg-gold-700" };

function Kpi({ label, value, unit, tone = "text-text", to }) {
  const body = (
    <div className="h-full rounded-card border border-line bg-card p-4 transition-colors hover:bg-cream">
      <p className="text-xs font-medium text-text-2">{label}</p>
      <p className={`mt-2 font-mono text-3xl tabular-nums ${tone}`} dir="ltr">{value}</p>
      {unit && <p className="mt-1 text-xs text-muted">{unit}</p>}
    </div>
  );
  return to ? <Link to={to} className="block">{body}</Link> : body;
}

export default function Overview() {
  const { t, energyLabel } = useLanguage();
  const { ledger, settings } = useAppState();
  const { state: pipeline } = usePipeline();
  const rows = useReport();
  const year = settings.year;
  const totals = reportTotals(rows.map((x) => x.r));
  const approved = ledger.filter((e) => ["verified", "verified_anomaly"].includes(e.status) && String(e.date).startsWith(String(year)));
  const anomalies = approved.filter((e) => e.status === "verified_anomaly").length;
  const co2 = (e) => computeCO2e(e) ?? 0;

  const byMonth = MONTHS.map((m) => approved.filter((e) => String(e.date).slice(5, 7) === m).reduce((s, e) => s + co2(e), 0));
  const maxMonth = Math.max(1, ...byMonth);
  const byEnergy = Object.entries(approved.reduce((acc, e) => ({ ...acc, [e.energy_type]: (acc[e.energy_type] ?? 0) + co2(e) }), {})).sort((a, b) => b[1] - a[1]);
  const energyTotal = byEnergy.reduce((s, [, v]) => s + v, 0) || 1;

  // Buyer cost on default values for this year's exports (only products with one clear benchmark).
  const costs = rows
    .filter(({ r }) => r.ok)
    .map(({ product, r }) => {
      const b = distinctBenchmarks(benchmarkOptions(r.good, year, defaultFor(r.good).route));
      if (b.length !== 1) return null;
      const c = defaultValueCost({ good: r.good, year, tonnes: Number(product.tonnesExported) || 0, price: LATEST_PRICE, benchmark: b[0] });
      return c.ok ? { product, r, c } : null;
    })
    .filter(Boolean);
  const costTotal = costs.reduce((s, x) => s + x.c.cost, 0);

  return (
    <>
      <PageHeader title={t("overview.title")} subtitle={t("overview.subtitle", { year })} actions={<Link to="/receipts" className={buttonClass("primary")}>{t("overview.startReceipt")}</Link>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={t("overview.kpis.total")} value={fmt(totals.total, 0)} unit={t("overview.kpiUnits.t")} to="/report" />
        <Kpi label={t("overview.kpis.actual")} value={`${Math.round(totals.actualShare * 100)}%`} tone={totals.actualShare >= 0.8 ? "text-verified" : "text-text"} to="/report" />
        <Kpi label={t("overview.kpis.review")} value={pipeline.phase === "review" ? "1" : "0"} tone={pipeline.phase === "review" ? "text-review" : "text-text"} unit={t("overview.kpiUnits.items")} to="/receipts" />
        <Kpi label={t("overview.kpis.anomalies")} value={String(anomalies)} tone={anomalies ? "text-anomaly" : "text-text"} unit={t("overview.kpiUnits.items")} to="/anomalies" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Panel title={t("overview.byMonth")}>
          <div className="flex h-56 items-end gap-2 border-b border-line" dir="ltr">
            {byMonth.map((v, i) => (
              // min-w-0 + absolute label keep every column the same width so bars line up with their month.
              <div key={MONTHS[i]} className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end" title={`${MONTHS[i]}: ${fmt(v, 0)} t`}>
                <span className="w-full rounded-t-tag bg-nile transition-[height] duration-700 ease-daman group-hover:bg-gold" style={{ height: `${v ? Math.max(3, (v / maxMonth) * 100) : 1}%` }} />
                <span className="pointer-events-none absolute -top-5 whitespace-nowrap font-mono text-[10px] text-text-2 opacity-0 transition-opacity group-hover:opacity-100">{fmt(v, 0)}</span>
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-2 font-mono text-[10px] text-muted" dir="ltr">{MONTHS.map((m) => <span key={m} className="flex-1 text-center">{m}</span>)}</div>
        </Panel>
        <Panel title={t("overview.byEnergy")}>
          {byEnergy.length === 0 ? <p className="text-sm text-muted">{t("overview.empty")}</p> : (
            <ul className="space-y-3">
              {byEnergy.map(([type, v]) => (
                <li key={type}>
                  <div className="flex justify-between text-sm"><span>{energyLabel(type)}</span><Num className="text-text-2">{fmt(v, 0)} t</Num></div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sand"><div className={`h-full rounded-full ${ENERGY_COLOR[type] ?? "bg-muted"}`} style={{ width: `${(v / energyTotal) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Panel title={t("overview.cost")} actions={<a href={`${WEBSITE_URL}/tools`} className="text-xs text-nile underline underline-offset-2">{t("overview.costLink")}</a>}>
          <p className="text-sm text-text-2">{t("overview.costBody")}</p>
          <p className="mt-3 font-mono text-3xl tabular-nums text-anomaly" dir="ltr">€{fmt(costTotal, 0)}</p>
          <ul className="mt-3 divide-y divide-line text-sm">
            {costs.map(({ product, r, c }) => (
              <li key={product.id} className="flex items-center justify-between gap-3 py-2">
                <Num className="text-nile">{r.good.codeDisplay}</Num>
                <Num className="text-text-2">{fmt(product.tonnesExported)} t · €{fmt(c.costPerTonne, 2)}/t</Num>
                <Num>€{fmt(c.cost, 0)}</Num>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Q3 2026 price €{LATEST_PRICE} · IR (EU) 2025/2621, 2025/2620 · {t("prototype")}</p>
        </Panel>
        <Panel title={t("overview.recent")}>
          {approved.length === 0 ? <p className="text-sm text-muted">{t("overview.empty")}</p> : (
            <ul className="divide-y divide-line text-sm">
              {[...approved].sort((a, b) => String(b.reviewedAt).localeCompare(String(a.reviewedAt))).slice(0, 6).map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                  <Num className="text-nile">{e.id}</Num>
                  <span className="flex-1 truncate text-text-2">{energyLabel(e.energy_type)}</span>
                  <Num>{fmt(co2(e), 1)} t</Num>
                  <StatusBadge status={e.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
