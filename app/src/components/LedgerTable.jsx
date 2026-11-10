import { useLanguage } from "../i18n/LanguageContext.jsx";
import { fmt, Num } from "./ui.jsx";

const STATUS_STYLE = {
  verified: "border-emerald-700 text-emerald-700",
  verified_anomaly: "border-red-700 text-red-700",
  pending: "border-amber-600 text-amber-600",
};

export function StatusBadge({ status }) {
  const { t } = useLanguage();
  return (
    <span className={`inline-block whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status] ?? "border-slate-300 text-slate-600"}`}>
      {t(`status.${status}`)}
    </span>
  );
}

/**
 * Strict monospace compliance ledger. Every digit, ID and date renders in
 * font-mono with tabular figures so columns line up for audit review.
 */
export default function LedgerTable({ entries }) {
  const { t, energyLabel } = useLanguage();
  const totalCO2e = entries.reduce((sum, e) => sum + (Number(e.co2e_t) || 0), 0);

  const th = "whitespace-nowrap border-b border-slate-300 px-3 py-2 text-start text-xs font-semibold uppercase tracking-wider text-slate-600";
  const thNum = `${th} text-end`;
  const td = "whitespace-nowrap border-b border-slate-200 px-3 py-2 text-sm";
  const tdNum = `${td} text-end`;

  if (!entries.length) {
    return <p className="p-6 text-sm text-slate-600">{t("ledger.empty")}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className={th}>{t("ledger.col.id")}</th>
            <th className={th}>{t("ledger.col.date")}</th>
            <th className={th}>{t("ledger.col.factory")}</th>
            <th className={th}>{t("ledger.col.energy")}</th>
            <th className={thNum}>{t("ledger.col.volume")}</th>
            <th className={th}>{t("ledger.col.unit")}</th>
            <th className={thNum}>{t("ledger.col.co2e")}</th>
            <th className={thNum}>{t("ledger.col.confidence")}</th>
            <th className={th}>{t("ledger.col.status")}</th>
            <th className={th}>{t("ledger.col.reviewer")}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="hover:bg-gray-50">
              <td className={td}>
                <Num className="text-slate-900">{e.id}</Num>
                {e.demo && (
                  <span className="ms-2 rounded-sm border border-slate-300 px-1 text-[10px] uppercase text-slate-500">
                    {t("ledger.demo")}
                  </span>
                )}
              </td>
              <td className={td}>
                <Num>{e.date || "—"}</Num>
              </td>
              <td className={`${td} text-slate-700`}>{e.factory_name}</td>
              <td className={`${td} text-slate-700`}>{energyLabel(e.energy_type)}</td>
              <td className={tdNum}>
                <Num>{fmt(e.volume)}</Num>
              </td>
              <td className={td}>
                <Num className="text-slate-600">{e.unit}</Num>
              </td>
              <td className={tdNum}>
                <Num className="font-medium text-slate-900">{fmt(e.co2e_t, 3)}</Num>
              </td>
              <td className={tdNum}>
                <Num className={e.confidence_score < 0.85 ? "text-amber-600" : "text-slate-600"}>
                  {fmt(e.confidence_score, 2)}
                </Num>
              </td>
              <td className={td}>
                <StatusBadge status={e.status} />
              </td>
              <td className={`${td} text-slate-700`}>{e.reviewer}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50">
          <tr>
            <td className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600" colSpan={6}>
              {t("ledger.total")} · {t("ledger.entries")} <Num>{entries.length}</Num>
            </td>
            <td className="px-3 py-2 text-end">
              <Num className="text-sm font-semibold text-slate-900">{fmt(totalCO2e, 3)}</Num>
            </td>
            <td colSpan={3} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/** CSV export with English headers and raw numbers (no locale formatting). */
export function ledgerToCsv(entries) {
  const cols = [
    "id", "date", "factory_name", "energy_type", "volume", "unit", "co2e_t",
    "confidence_score", "status", "reviewer", "reviewedAt", "justification", "sourceFile",
  ];
  const escape = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = entries.map((e) => cols.map((c) => escape(e[c])).join(","));
  // BOM so Excel opens UTF-8 (Arabic text in justifications) correctly.
  return "﻿" + [cols.join(","), ...rows].join("\n");
}
