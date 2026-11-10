import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useAppState } from "../state/AppState.jsx";
import { Button, DemoTag, Drawer, Field, inputClass, Num, PageHeader } from "../components/ui.jsx";

const EMPTY = { name: "", operator: "", activity: "", city: "", address: "", country: "EG", unlocode: "", lat: "", lon: "", contact: "", email: "", electricitySource: "grid" };
const FIELDS = ["name", "operator", "activity", "city", "address", "country", "unlocode", "lat", "lon", "contact", "email"];
const LTR = new Set(["country", "unlocode", "lat", "lon", "email"]);

export default function Installations() {
  const { t } = useLanguage();
  const { installations, products, saveInstallation, deleteInstallation } = useAppState();
  const [editing, setEditing] = useState(null);

  return (
    <>
      <PageHeader title={t("installations.title")} subtitle={t("installations.subtitle")} actions={<Button onClick={() => setEditing({ ...EMPTY })}>{t("installations.add")}</Button>} />
      {installations.length === 0 ? (
        <p className="rounded-card border border-line bg-card p-8 text-sm text-text-2">{t("installations.empty")}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {installations.map((i) => (
            <article key={i.id} className="rounded-card border border-line bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Num className="text-xs text-muted">{i.id}</Num> {i.demo && <DemoTag />}
                  <h2 className="mt-1 font-semibold text-text">{i.name}</h2>
                  <p className="text-sm text-text-2">{i.operator}</p>
                </div>
                <Button variant="secondary" onClick={() => setEditing({ ...i })}>{t("common.edit")}</Button>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted">{t("installations.fields.activity")}</dt><dd className="text-text">{i.activity || "—"}</dd>
                <dt className="text-muted">{t("installations.fields.city")}</dt><dd className="text-text">{i.city || "—"}, <Num>{i.country}</Num></dd>
                <dt className="text-muted">{t("installations.fields.lat")} / {t("installations.fields.lon")}</dt><dd><Num>{i.lat || "—"}, {i.lon || "—"}</Num></dd>
                <dt className="text-muted">{t("installations.fields.unlocode")}</dt><dd><Num>{i.unlocode || "—"}</Num></dd>
              </dl>
              <p className="mt-4 text-xs text-text-2">{t("installations.products", { n: products.filter((p) => p.installationId === i.id).length })}</p>
            </article>
          ))}
        </div>
      )}

      <Drawer
        open={!!editing}
        title={editing?.id ? editing.name : t("installations.add")}
        onClose={() => setEditing(null)}
        footer={
          <>
            {editing?.id && <Button variant="danger" className="me-auto" onClick={() => { deleteInstallation(editing.id); setEditing(null); }}>{t("common.delete")}</Button>}
            <Button variant="secondary" onClick={() => setEditing(null)}>{t("common.cancel")}</Button>
            <Button disabled={!editing?.name?.trim()} onClick={() => { saveInstallation(editing); setEditing(null); }}>{t("common.save")}</Button>
          </>
        }
      >
        {editing && (
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <Field key={f} label={t(`installations.fields.${f}`)} className={["name", "operator", "address"].includes(f) ? "sm:col-span-2" : ""}>
                <input dir={LTR.has(f) ? "ltr" : undefined} className={`${inputClass} ${LTR.has(f) ? "font-mono" : ""}`} value={editing[f] ?? ""} onChange={(e) => setEditing({ ...editing, [f]: e.target.value })} />
              </Field>
            ))}
            <Field label={t("installations.fields.electricitySource")} className="sm:col-span-2">
              <select className={inputClass} value={editing.electricitySource ?? "grid"} onChange={(e) => setEditing({ ...editing, electricitySource: e.target.value })}>
                {Object.entries(t("installations.electricitySources")).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
          </div>
        )}
      </Drawer>
    </>
  );
}
