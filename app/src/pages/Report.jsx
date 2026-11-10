import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { reportTotals } from "@daman/core/report.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useAppState } from "../state/AppState.jsx";
import { useReport } from "../lib/useReport.js";
import { o3ciExport, reportCsv } from "../lib/exports.js";
import ProductDrawer from "../components/ProductDrawer.jsx";
import { ActualBar, Button, buttonClass, DemoTag, downloadFile, fmt, Num, PageHeader, StatusBadge } from "../components/ui.jsx";

export default function Report() {
  const { t } = useLanguage();
  const { settings, updateSettings, ledger, installations } = useAppState();
  const rows = useReport();
  const [open, setOpen] = useState(null);
  const years = useMemo(() => [...new Set([settings.year, 2026, ...ledger.map((e) => Number(String(e.date).slice(0, 4))).filter(Boolean)])].sort((a, b) => b - a), [ledger, settings.year]);
  const totals = reportTotals(rows.map((x) => x.r));

  const th = "whitespace-nowrap px-3 py-2.5 text-start text-xs font-medium text-text-2";
  const thNum = `${th} text-end`;
  const td = "whitespace-nowrap px-3 py-3 text-sm";

  return (
    <>
      <PageHeader
        title={t("report.title")}
        subtitle={t("report.subtitle")}
        actions={
          <>
            <Button variant="secondary" onClick={() => downloadFile(`daman-report-${settings.year}.csv`, reportCsv(rows, settings.year), "text/csv;charset=utf-8")}>{t("report.exportCsv")}</Button>
            <Button variant="secondary" title={t("report.exportNote")} onClick={() => downloadFile(`daman-o3ci-fields-${settings.year}.json`, o3ciExport({ installations, rows, year: settings.year, gridFactor: settings.gridFactor }), "application/json")}>{t("report.exportO3ci")}</Button>
            <Link to="/products" className={buttonClass("primary")}>{t("report.addProduct")}</Link>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[140px_1fr]">
        {/* Periods */}
        <aside className="rounded-card border border-line bg-card p-2">
          <p className="px-2 py-2 text-xs font-medium text-text-2">{t("report.periods")}</p>
          <ul className="flex gap-1 lg:flex-col">
            {years.map((y) => (
              <li key={y}>
                <button type="button" onClick={() => updateSettings({ year: y })} className={`h-9 w-full rounded-control px-3 text-start font-mono text-sm ${settings.year === y ? "bg-nile text-white" : "text-text hover:bg-sand"}`}>{y}</button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Report table */}
        <section className="min-w-0 rounded-card border border-line bg-card">
          {rows.length === 0 ? (
            <p className="p-8 text-sm text-text-2">{t("report.empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-line bg-cream">
                  <tr>
                    <th className={th}>{t("report.cols.cn")} · {t("report.cols.product")}</th>
                    <th className={`${th} hidden 2xl:table-cell`}>{t("report.cols.installation")}</th>
                    <th className={thNum}>{t("report.cols.exported")}</th>
                    <th className={th}>{t("report.cols.actual")}</th>
                    <th className={thNum}>{t("report.cols.direct")}</th>
                    <th className={thNum}>{t("report.cols.indirect")}</th>
                    <th className={thNum}>{t("report.cols.specific")}</th>
                    <th className={th}>{t("report.cols.status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((row) => {
                    const { product, installation, r } = row;
                    return (
                      <tr key={product.id} tabIndex={0} aria-label={`${t("common.view")} ${r.good?.codeDisplay ?? product.cn}`} className="cursor-pointer transition-colors hover:bg-cream focus:bg-cream focus:outline-none" onClick={() => setOpen(row)} onKeyDown={(e) => e.key === "Enter" && setOpen(row)}>
                        <td className={`${td} max-w-60`}>
                          <span className="flex items-center gap-2"><Num className="text-nile">{r.good?.codeDisplay ?? product.cn}</Num>{product.demo && <DemoTag />}</span>
                          <span dir="ltr" className="mt-0.5 block truncate text-start text-xs text-text-2" title={r.good?.description}>{r.good?.description ?? "—"}</span>
                        </td>
                        <td className={`${td} hidden max-w-40 truncate text-text-2 2xl:table-cell`}>{installation?.name ?? "—"}</td>
                        <td className={`${td} text-end`}><Num>{fmt(product.tonnesExported)} t</Num></td>
                        <td className={td}>{r.ok ? <ActualBar share={r.actualShare} /> : "—"}</td>
                        <td className={`${td} text-end`}><Num>{r.ok ? fmt(r.direct, 1) : "—"}</Num></td>
                        <td className={`${td} text-end`}><Num className={r.ok && !r.countsIndirect ? "text-muted" : ""}>{r.ok ? (r.countsIndirect ? fmt(r.indirect, 1) : t("report.na")) : "—"}</Num></td>
                        <td className={`${td} text-end`}><Num className="font-medium text-text">{r.ok ? fmt(r.specific, 4) : "—"}</Num></td>
                        <td className={td}>{r.ok ? <StatusBadge status={r.status} /> : <span className="text-xs text-review">{r.reason}</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t border-line bg-cream">
                  <tr>
                    <td className={`${td} font-medium`} colSpan={2}>{t("report.total")}</td>
                    <td className="hidden 2xl:table-cell" />
                    <td className={td}><ActualBar share={totals.actualShare} /></td>
                    <td className={`${td} text-end`} colSpan={2}><Num className="font-medium">{fmt(totals.total, 1)} t</Num></td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          <p className="border-t border-line px-4 py-3 text-xs text-muted">{t("report.exportNote")} {t("prototype")}</p>
        </section>
      </div>

      <ProductDrawer row={open} onClose={() => setOpen(null)} />
    </>
  );
}
