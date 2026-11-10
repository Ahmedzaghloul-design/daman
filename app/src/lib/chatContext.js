import { useCallback } from "react";
import { reportTotals } from "@daman/core/report.js";
import { useAppState } from "../state/AppState.jsx";
import { useReport } from "./useReport.js";

const r2 = (n) => (Number.isFinite(n) ? Math.round(n * 100) / 100 : null);

/**
 * The factory data "Ask Daman" may see in workspace mode: a short summary of
 * the report on screen. No receipt photos, no people's names, no raw text.
 */
export function useChatContext() {
  const rows = useReport();
  const { ledger, settings, workspace, installations } = useAppState();
  return useCallback(() => {
    const year = String(settings.year);
    const entries = ledger.filter((e) => (e.date || "").startsWith(year));
    const totals = reportTotals(rows.map((x) => x.r));
    return {
      workspace: workspace?.name ?? "Demo installation (sample data)",
      reportingYear: settings.year,
      installations: installations.map((i) => ({ id: i.id, name: i.name, city: i.city })),
      totals: { products: totals.products, embeddedTCO2e: r2(totals.total), actualDataShare: r2(totals.actualShare), exportedEmbeddedTCO2e: r2(totals.exportedEmbedded) },
      approvedEntries: entries.length,
      anomaliesApproved: entries.filter((e) => e.status === "verified_anomaly").length,
      // Capped so the summary stays under the API's 8,000-character limit.
      products: rows.slice(0, 15).map(({ product, r }) => ({
        cn: product.cn,
        name: r.good?.description ?? null,
        tonnesProduced: Number(product.tonnesProduced) || null,
        tonnesExported: Number(product.tonnesExported) || null,
        status: r.ok ? r.status : r.reason,
        warnings: r.warnings ?? [],
        totalTCO2e: r2(r.total),
        tCO2ePerTonne: r2(r.specific),
        euDefaultTCO2ePerTonne: r2(r.dv?.total),
        actualDataShare: r.actualShare == null ? null : r2(r.actualShare),
        approvedReceipts: r.receipts ?? null,
      })),
      note: "Emission factors in this version are illustrative.",
    };
  }, [rows, ledger, settings.year, workspace, installations]);
}
