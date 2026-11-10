import { useMemo, useState } from "react";
import { computeCO2e } from "@daman/core/emissionFactors.js";
import { findGood } from "@daman/core/cbamCost.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useAppState } from "../state/AppState.jsx";
import { toCsv } from "../lib/exports.js";
import { ArabicWithNumbers, Button, DemoTag, downloadFile, Drawer, fmt, inputClass, Num, PageHeader, StatusBadge, Code } from "../components/ui.jsx";

export default function Ledger() {
  const { t, energyLabel } = useLanguage();
  const { ledger, products, installations } = useAppState();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [energy, setEnergy] = useState("");
  const [inst, setInst] = useState("");
  const [open, setOpen] = useState(null);
  const productLabel = (id) => {
    const p = products.find((x) => x.id === id);
    return p ? findGood(p.cn)?.codeDisplay ?? p.cn : "—";
  };
  const energies = [...new Set(ledger.map((e) => e.energy_type))];

  const rows = useMemo(
    () =>
      ledger
        .filter((e) => (!status || e.status === status) && (!energy || e.energy_type === energy) && (!inst || e.installationId === inst))
        .filter((e) => !q || [e.id, e.date, e.energy_type, e.reviewer, e.rawText].join(" ").toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => String(b.date).localeCompare(String(a.date))),
    [ledger, q, status, energy, inst],
  );

  const exportCsv = () =>
    downloadFile(
      "daman-ledger.csv",
      toCsv(["id", "date", "installation_id", "product_id", "energy_type", "volume", "unit", "tco2e", "confidence", "status", "reviewer", "reviewed_at", "justification"],
        rows.map((e) => [e.id, e.date, e.installationId, e.productId, e.energy_type, e.volume, e.unit, computeCO2e(e), e.confidence_score, e.status, e.reviewer, e.reviewedAt, e.justification])),
      "text/csv;charset=utf-8",
    );

  const th = "whitespace-nowrap px-3 py-2.5 text-start text-xs font-medium text-text-2";
  const select = `${inputClass} h-9 w-auto`;
  return (
    <>
      <PageHeader title={t("ledger.title")} subtitle={t("ledger.subtitle")} actions={<Button variant="secondary" onClick={exportCsv}>{t("common.exportCsv")}</Button>} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input className={`${inputClass} h-9 max-w-xs`} placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={select} value={status} onChange={(e) => setStatus(e.target.value)} aria-label={t("ledger.filters.status")}>
          <option value="">{t("ledger.filters.status")}: {t("common.all")}</option>
          {["verified", "verified_anomaly"].map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
        </select>
        <select className={select} value={energy} onChange={(e) => setEnergy(e.target.value)} aria-label={t("ledger.filters.energy")}>
          <option value="">{t("ledger.filters.energy")}: {t("common.all")}</option>
          {energies.map((x) => <option key={x} value={x}>{energyLabel(x)}</option>)}
        </select>
        <select className={select} value={inst} onChange={(e) => setInst(e.target.value)} aria-label={t("ledger.filters.installation")}>
          <option value="">{t("ledger.filters.installation")}: {t("common.all")}</option>
          {installations.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
        <span className="ms-auto text-xs text-muted">{t("ledger.count", { n: rows.length })}</span>
      </div>
      <div className="overflow-x-auto rounded-card border border-line bg-card">
        {rows.length === 0 ? <p className="p-8 text-sm text-text-2">{t("ledger.empty")}</p> : (
          <table className="min-w-full text-sm">
            <thead className="border-b border-line bg-cream">
              <tr>
                {["id", "date", "product", "energy"].map((c) => <th key={c} className={th}>{t(`ledger.cols.${c}`)}</th>)}
                <th className={`${th} text-end`}>{t("ledger.cols.qty")}</th>
                <th className={`${th} text-end`}>{t("ledger.cols.co2e")}</th>
                <th className={`${th} text-end`}>{t("ledger.cols.conf")}</th>
                <th className={th}>{t("ledger.cols.status")}</th>
                <th className={th}>{t("ledger.cols.reviewer")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((e) => (
                <tr key={e.id} className="cursor-pointer hover:bg-cream" onClick={() => setOpen(e)}>
                  <td className="whitespace-nowrap px-3 py-2.5"><Code>{e.id}</Code> {e.demo && <DemoTag />}</td>
                  <td className="px-3 py-2.5"><Num>{e.date}</Num></td>
                  <td className="px-3 py-2.5"><Num className="text-text-2">{productLabel(e.productId)}</Num></td>
                  <td className="px-3 py-2.5 text-text-2">{energyLabel(e.energy_type)}</td>
                  <td className="px-3 py-2.5 text-end"><Num>{fmt(e.volume)} {e.unit}</Num></td>
                  <td className="px-3 py-2.5 text-end"><Num className="font-medium">{fmt(computeCO2e(e), 3)}</Num></td>
                  <td className="px-3 py-2.5 text-end"><Num className={e.confidence_score < 0.85 ? "text-review" : "text-text-2"}>{fmt(e.confidence_score, 2)}</Num></td>
                  <td className="px-3 py-2.5"><StatusBadge status={e.status} /></td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-text-2">{e.reviewer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Drawer open={!!open} title={open ? `${t("ledger.detail")} · ${open.id}` : ""} onClose={() => setOpen(null)}>
        {open && (
          <div className="space-y-5 text-sm">
            <StatusBadge status={open.status} />
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              <dt className="text-muted">{t("ledger.cols.date")}</dt><dd><Num>{open.date}</Num></dd>
              <dt className="text-muted">{t("ledger.cols.product")}</dt><dd><Num>{productLabel(open.productId)}</Num></dd>
              <dt className="text-muted">{t("ledger.cols.energy")}</dt><dd>{energyLabel(open.energy_type)}</dd>
              <dt className="text-muted">{t("ledger.cols.qty")}</dt><dd><Num>{fmt(open.volume)} {open.unit}</Num></dd>
              <dt className="text-muted">{t("ledger.cols.co2e")}</dt><dd><Num>{fmt(computeCO2e(open), 3)}</Num></dd>
              <dt className="text-muted">{t("ledger.cols.conf")}</dt><dd><Num>{fmt(open.confidence_score, 2)}</Num></dd>
            </dl>
            {open.rawText && (
              <div>
                <p className="text-xs font-medium text-text-2">{t("ledger.source")}</p>
                <p dir="rtl" lang="ar" className="mt-1 rounded-control bg-cream p-3 tabular-nums"><ArabicWithNumbers text={open.rawText} /></p>
              </div>
            )}
            {open.justification && (
              <div>
                <p className="text-xs font-medium text-text-2">{t("ledger.justification")}</p>
                <p className="mt-1 text-text">{open.justification}</p>
              </div>
            )}
            <p className="text-xs text-muted">{t("ledger.approvedBy", { name: open.reviewer, date: String(open.reviewedAt).slice(0, 10) })}</p>
          </div>
        )}
      </Drawer>
    </>
  );
}
