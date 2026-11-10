import { useState } from "react";
import { CBAM_DATA, findGood } from "@daman/core/cbamCost.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useAppState } from "../state/AppState.jsx";
import { Button, DemoTag, Drawer, Field, fmt, inputClass, Num, PageHeader, Code } from "../components/ui.jsx";

export default function Products() {
  const { t } = useLanguage();
  const { products, installations, settings, saveProduct, deleteProduct } = useAppState();
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState("");
  const year = settings.year;
  const matches = q.trim()
    ? CBAM_DATA.goods.filter((g) => g.code.includes(q.replace(/\D/g, "") || "§") || g.description.toLowerCase().includes(q.toLowerCase())).slice(0, 8)
    : [];
  const good = editing ? findGood(editing.cn) : null;

  return (
    <>
      <PageHeader
        title={t("products.title")}
        subtitle={t("products.subtitle")}
        actions={<Button disabled={!installations.length} onClick={() => setEditing({ cn: "", installationId: installations[0]?.id ?? "", tonnesProduced: "", tonnesExported: "", processEmissions: null })}>{t("products.add")}</Button>}
      />
      {products.length === 0 ? (
        <p className="rounded-card border border-line bg-card p-8 text-sm text-text-2">{t("products.empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-line bg-card">
          <table className="min-w-full text-sm">
            <thead className="border-b border-line bg-cream text-xs text-text-2">
              <tr>
                <th className="px-3 py-2.5 text-start font-medium">{t("report.cols.cn")}</th>
                <th className="px-3 py-2.5 text-start font-medium">{t("report.cols.product")}</th>
                <th className="px-3 py-2.5 text-start font-medium">{t("products.fields.installation")}</th>
                <th className="px-3 py-2.5 text-end font-medium">{t("products.fields.produced", { year })}</th>
                <th className="px-3 py-2.5 text-end font-medium">{t("products.fields.exported", { year })}</th>
                <th className="px-3 py-2.5 text-end font-medium">{t("products.fields.process", { year })}</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => {
                const g = findGood(p.cn);
                return (
                  <tr key={p.id} className="hover:bg-cream">
                    <td className="px-3 py-3"><Code>{g?.codeDisplay ?? p.cn}</Code></td>
                    <td className="max-w-72 px-3 py-3"><span dir="ltr" className="block truncate text-start">{g?.description}</span>{p.demo && <DemoTag />}</td>
                    <td className="px-3 py-3 text-text-2">{installations.find((i) => i.id === p.installationId)?.name ?? "—"}</td>
                    <td className="px-3 py-3 text-end"><Num>{fmt(p.tonnesProduced)}</Num></td>
                    <td className="px-3 py-3 text-end"><Num>{fmt(p.tonnesExported)}</Num></td>
                    <td className="px-3 py-3 text-end"><Num className={p.processEmissions == null ? "text-review" : ""}>{p.processEmissions == null ? "—" : fmt(p.processEmissions)}</Num></td>
                    <td className="px-3 py-3 text-end"><Button variant="secondary" onClick={() => setEditing({ ...p })}>{t("common.edit")}</Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Drawer
        open={!!editing}
        title={editing?.id ? (good?.codeDisplay ?? editing.cn) : t("products.add")}
        onClose={() => { setEditing(null); setQ(""); }}
        footer={
          <>
            {editing?.id && <Button variant="danger" className="me-auto" onClick={() => { deleteProduct(editing.id); setEditing(null); }}>{t("common.delete")}</Button>}
            <Button variant="secondary" onClick={() => setEditing(null)}>{t("common.cancel")}</Button>
            <Button
              disabled={!editing?.cn || !editing?.installationId || !(Number(editing?.tonnesProduced) > 0)}
              onClick={() => {
                const proc = editing.processEmissions;
                saveProduct({ ...editing, tonnesProduced: Number(editing.tonnesProduced), tonnesExported: Number(editing.tonnesExported) || 0, processEmissions: proc === "" || proc == null ? null : Number(proc) });
                setEditing(null);
                setQ("");
              }}
            >
              {t("common.save")}
            </Button>
          </>
        }
      >
        {editing && (
          <div className="grid gap-4">
            <Field label={t("products.fields.cn")}>
              <input className={inputClass} placeholder={t("products.search")} value={q} onChange={(e) => setQ(e.target.value)} />
            </Field>
            {matches.length > 0 && (
              <ul className="-mt-2 overflow-hidden rounded-control border border-line" role="listbox">
                {matches.map((g) => (
                  <li key={g.code}>
                    <button type="button" role="option" aria-selected={editing.cn === g.code} onClick={() => { setEditing({ ...editing, cn: g.code }); setQ(""); }} className="flex w-full gap-3 px-3 py-2 text-start text-sm hover:bg-sand">
                      <Code className="shrink-0">{g.codeDisplay}</Code>
                      <span dir="ltr" className="truncate text-start text-text-2">{g.description}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {good && (
              <p className="rounded-control bg-sand p-3 text-sm"><Code>{good.codeDisplay}</Code> <span dir="ltr">{good.description}</span></p>
            )}
            <Field label={t("products.fields.installation")}>
              <select className={inputClass} value={editing.installationId} onChange={(e) => setEditing({ ...editing, installationId: e.target.value })}>
                {installations.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("products.fields.produced", { year })}>
                <input type="number" min="0" dir="ltr" className={`${inputClass} tabular-nums`} value={editing.tonnesProduced} onChange={(e) => setEditing({ ...editing, tonnesProduced: e.target.value })} />
              </Field>
              <Field label={t("products.fields.exported", { year })}>
                <input type="number" min="0" dir="ltr" className={`${inputClass} tabular-nums`} value={editing.tonnesExported} onChange={(e) => setEditing({ ...editing, tonnesExported: e.target.value })} />
              </Field>
            </div>
            <Field label={t("products.fields.process", { year })} hint={t("products.fields.processHint")}>
              <input type="number" min="0" dir="ltr" className={`${inputClass} tabular-nums`} value={editing.processEmissions ?? ""} onChange={(e) => setEditing({ ...editing, processEmissions: e.target.value })} />
            </Field>
          </div>
        )}
      </Drawer>
    </>
  );
}
