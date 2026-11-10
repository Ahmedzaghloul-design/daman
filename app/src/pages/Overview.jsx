import { Link } from "react-router-dom";
import { benchmarkOptions, CBAM_DATA, defaultFor, defaultValueCost, distinctBenchmarks, markup } from "@daman/core/cbamCost.js";
import { computeCO2e } from "@daman/core/emissionFactors.js";
import { reportTotals } from "@daman/core/report.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useAppState } from "../state/AppState.jsx";
import { usePipeline } from "../state/Pipeline.jsx";
import { useReport } from "../lib/useReport.js";
import { AreaChart, Donut, GroupedBars, Ring } from "../components/charts.jsx";
import { buttonClass, Code, fmt, IconChip, Num, PageHeader, Panel, StatusBadge } from "../components/ui.jsx";

const LATEST_PRICE = CBAM_DATA.prices2026.Q3.eur;
const MONTHS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const ICON = {
  receipt: "M5 2h10v16l-2.5-1.5L10 18l-2.5-1.5L5 18zM8 6h4M8 9h4M8 12h2",
  box: "M3 6l7-3 7 3v8l-7 3-7-3zM3 6l7 3 7-3M10 9v8",
  alert: "M10 3l8 14H2zM10 8v4M10 14.5v.5",
  euro: "M14 5a6 6 0 1 0 0 10M4 9h8M4 12h8",
};
const ENERGY_COLOR = { "Natural Gas": "var(--color-nile)", Electricity: "#7c8cff", Diesel: "var(--color-gold)", "Heavy Fuel Oil": "#c77d4a", Coal: "#8a8f98", Petcoke: "#a07a5a" };

export default function Overview() {
  const { t, energyLabel } = useLanguage();
  const { ledger, settings, products } = useAppState();
  const { state: pipeline } = usePipeline();
  const rows = useReport();
  const year = settings.year;
  const totals = reportTotals(rows.map((x) => x.r));
  const approved = ledger.filter((e) => ["verified", "verified_anomaly"].includes(e.status) && String(e.date).startsWith(String(year)));
  const anomalies = approved.filter((e) => e.status === "verified_anomaly");
  const elecT = (e) => ((Number(e.volume) || 0) / 1000) * Number(settings.gridFactor);
  const co2 = (e) => (e.energy_type === "Electricity" ? elecT(e) : computeCO2e(e) ?? 0);

  const direct = MONTHS.map((m) => approved.filter((e) => String(e.date).slice(5, 7) === m && e.energy_type !== "Electricity").reduce((s, e) => s + co2(e), 0));
  const indirect = MONTHS.map((m) => approved.filter((e) => String(e.date).slice(5, 7) === m && e.energy_type === "Electricity").reduce((s, e) => s + co2(e), 0));
  const monthly = direct.map((v, i) => v + indirect[i]);
  const lastMonth = monthly.reduce((last, v, i) => (v > 0 ? i : last), 0);
  const shown = Math.max(6, lastMonth + 1);

  // Your data vs the marked-up EU default, over products with complete estimates only.
  const est = rows.filter(({ r }) => r.ok && r.status === "estimated");
  const actualT = est.reduce((s, { r }) => s + r.total, 0);
  const defaultT = est.reduce((s, { product, r }) => s + (typeof r.dv.total === "number" ? r.dv.total * (1 + (markup(r.good.sector, year) ?? 0)) * Number(product.tonnesProduced) : 0), 0);
  const vsDefault = defaultT > 0 ? actualT / defaultT - 1 : null;

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

  const energy = Object.entries(approved.reduce((acc, e) => ({ ...acc, [e.energy_type]: (acc[e.energy_type] ?? 0) + co2(e) }), {})).sort((a, b) => b[1] - a[1]);

  // Stat column, as in the reference dashboard: icon chip, big number, label.
  const stat = (iconD, tone, label, value, sub, to) => (
    <Link to={to} className="flex flex-col items-center justify-center gap-2 rounded-xl px-3 py-5 text-center transition-colors hover:bg-sand/50">
      <IconChip d={iconD} tone={tone} size={48} />
      <span className="mt-1 block text-[26px] font-bold leading-none tabular-nums text-text" dir="ltr">{value}</span>
      <span className="block text-sm text-text-2">{label}</span>
      {sub && <span className="-mt-1 block text-[11px] text-muted">{sub}</span>}
    </Link>
  );

  return (
    <>
      <PageHeader title={t("overview.title")} subtitle={t("overview.subtitle", { year })} actions={<Link to="/receipts" className={buttonClass("primary")}>{t("overview.startReceipt")}</Link>} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Hero KPI with area chart */}
        <Panel className="overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-text-2">{t("overview.kpis.total")}</p>
              <p className="mt-1 text-[34px] font-bold leading-none tracking-[-0.02em] tabular-nums text-text" dir="ltr">{fmt(totals.total, 0)}</p>
              <p className="mt-1 text-xs text-muted">{t("overview.kpiUnits.t")} · {year}</p>
            </div>
            {vsDefault !== null && (
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${vsDefault < 0 ? "bg-verified-soft text-verified" : "bg-anomaly-soft text-anomaly"}`} dir="ltr" title={t("overview.vsDefault")}>
                {vsDefault < 0 ? "" : "+"}{fmt(vsDefault * 100, 1)}%
              </span>
            )}
          </div>
          {vsDefault !== null && <p className="mt-2 text-[11px] text-muted">{t("overview.vsDefault")}</p>}
          <div className="-mx-4 -mb-4 mt-3">
            <AreaChart values={monthly.slice(0, shown)} labels={MONTHS.slice(0, shown)} unit="t" height={110} />
          </div>
        </Panel>

        {/* Stat strip with icon chips */}
        <Panel className="xl:col-span-2">
          <div className="grid h-full grid-cols-2 items-center gap-1 md:grid-cols-4 md:divide-x md:divide-line rtl:md:divide-x-reverse">
            {stat(ICON.receipt, "nile", t("overview.kpis.receipts"), String(approved.length), null, "/ledger")}
            {stat(ICON.box, "gold", t("overview.kpis.products"), String(products.length), null, "/products")}
            {stat(ICON.alert, "anomaly", t("overview.kpis.anomalies"), String(anomalies.length), null, "/anomalies")}
            {stat(ICON.euro, "review", t("overview.kpis.buyerCost"), `€${fmt(costTotal / 1000, 0)}k`, t("overview.kpis.onDefaults"), "/calculator")}
          </div>
        </Panel>

        {/* Actual-data ring */}
        <Panel title={t("overview.kpis.actual")}>
          <div className="flex items-center gap-5">
            <Ring value={totals.actualShare} color="var(--color-verified)" size={104} />
            <div className="text-sm">
              <p className="text-text-2">{t("overview.actualBody")}</p>
              <Link to="/report" className="mt-2 inline-block text-nile hover:underline">{t("nav.report")} →</Link>
            </div>
          </div>
        </Panel>

        {/* Direct vs indirect by month */}
        <Panel title={t("overview.byMonth")} className="xl:col-span-2">
          <GroupedBars
            labels={MONTHS.slice(0, shown)}
            unit="t"
            height={190}
            series={[
              { label: t("overview.direct"), color: "var(--color-nile)", values: direct.slice(0, shown) },
              { label: t("overview.indirect"), color: "#7c8cff", values: indirect.slice(0, shown) },
            ]}
          />
        </Panel>

        {/* Buyer cost on defaults */}
        <Panel title={t("overview.cost")} actions={<Link to="/calculator" className="text-xs text-nile hover:underline">{t("overview.costLink")}</Link>}>
          <p className="text-[30px] font-bold tabular-nums text-gold" dir="ltr">€{fmt(costTotal, 0)}</p>
          <p className="mt-1 text-xs text-text-2">{t("overview.costBody")}</p>
          <ul className="mt-3 divide-y divide-line text-sm">
            {costs.map(({ product, r, c }) => (
              <li key={product.id} className="flex items-center justify-between gap-3 py-2">
                <Code>{r.good.codeDisplay}</Code>
                <Num className="text-text-2">€{fmt(c.costPerTonne, 2)}/t</Num>
                <Num>€{fmt(c.cost, 0)}</Num>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-muted">Q3 2026 · €{LATEST_PRICE} · {t("prototype")}</p>
        </Panel>

        {/* Energy mix */}
        <Panel title={t("overview.byEnergy")}>
          {energy.length === 0 ? <p className="text-sm text-muted">{t("overview.empty")}</p> : (
            <Donut
              items={energy.map(([type, v]) => ({ label: energyLabel(type), value: v, color: ENERGY_COLOR[type] ?? "#86a0a5" }))}
              center={<><span className="text-base font-bold tabular-nums" dir="ltr">{fmt(energy.reduce((s, [, v]) => s + v, 0), 0)}</span><span className="text-[10px] text-muted">tCO2e</span></>}
            />
          )}
        </Panel>

        {/* Recent approvals */}
        <Panel title={t("overview.recent")} padded={false}>
          {approved.length === 0 ? <p className="p-4 text-sm text-muted">{t("overview.empty")}</p> : (
            <ul className="divide-y divide-line text-sm">
              {[...approved].sort((a, b) => String(b.reviewedAt).localeCompare(String(a.reviewedAt))).slice(0, 5).map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                  <Code className="shrink-0">{e.id.slice(-4)}</Code>
                  <span className="min-w-0 flex-1 truncate text-text-2">{energyLabel(e.energy_type)}</span>
                  <Num>{fmt(co2(e), 1)} t</Num>
                  <StatusBadge status={e.status} />
                </li>
              ))}
            </ul>
          )}
          {pipeline.phase === "review" && <Link to="/receipts" className="block border-t border-line px-4 py-2.5 text-sm text-review">{t("overview.pending")}</Link>}
        </Panel>
      </div>
    </>
  );
}
