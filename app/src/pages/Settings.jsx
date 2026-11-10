import { EMISSION_FACTORS } from "@daman/core/emissionFactors.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useAppState } from "../state/AppState.jsx";
import { Button, Field, inputClass, Num, PageHeader, Panel } from "../components/ui.jsx";

export default function Settings() {
  const { t, energyLabel } = useLanguage();
  const { settings, updateSettings, apiHealth, clearDemo, resetDemo } = useAppState();
  const setBench = (type, k, v) => updateSettings({ benchmarks: { ...settings.benchmarks, [type]: { ...settings.benchmarks[type], [k]: Number(v) } } });

  return (
    <>
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t("settings.title")}>
          <div className="grid gap-4">
            <Field label={t("settings.reviewer")}><input className={inputClass} value={settings.reviewerName} onChange={(e) => updateSettings({ reviewerName: e.target.value })} /></Field>
            <Field label={t("settings.year")}>
              <select className={`${inputClass} font-mono`} value={settings.year} onChange={(e) => updateSettings({ year: Number(e.target.value) })}>
                {[2026, 2027, 2028].map((y) => <option key={y}>{y}</option>)}
              </select>
            </Field>
            <Field label={t("settings.gridFactor")} hint={t("settings.gridHint")}>
              <input type="number" min="0" step="0.01" dir="ltr" className={`${inputClass} font-mono`} value={settings.gridFactor} onChange={(e) => updateSettings({ gridFactor: Number(e.target.value) })} />
            </Field>
            <div className="border-t border-line pt-4 text-sm">
              <p className="text-xs text-muted">{t("settings.model")}</p>
              <Num>{apiHealth.model ?? "—"}</Num>
            </div>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title={t("settings.benchmarks")}>
            <table className="w-full text-sm">
              <thead className="text-xs text-text-2"><tr><th className="py-1 text-start font-medium" /><th className="py-1 text-start font-medium">{t("settings.min")}</th><th className="py-1 text-start font-medium">{t("settings.max")}</th></tr></thead>
              <tbody>
                {Object.entries(settings.benchmarks).map(([type, b]) => (
                  <tr key={type} className="border-t border-line">
                    <td className="py-2">{energyLabel(type)} <Num className="text-xs text-muted">{b.unit}/t</Num></td>
                    {["min", "max"].map((k) => (
                      <td key={k} className="py-2"><input type="number" min="0" step="any" dir="ltr" aria-label={`${type} ${k}`} className={`${inputClass} h-8 w-24 font-mono`} value={b[k]} onChange={(e) => setBench(type, k, e.target.value)} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-review">{t("settings.benchmarksHint")}</p>
          </Panel>
          <Panel title={t("settings.factors")}>
            <ul className="divide-y divide-line text-sm">
              {Object.entries(EMISSION_FACTORS).map(([type, f]) => (
                <li key={type} className="flex items-center justify-between gap-3 py-2">
                  <span>{energyLabel(type)}</span>
                  <Num>{f.kgCO2ePerUnit} kgCO2e/{f.unit}</Num>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-review">{t("settings.factorsHint")}</p>
          </Panel>
          <Panel title={t("settings.demo")}>
            <div className="flex flex-wrap gap-2">
              <Button variant="danger" onClick={() => window.confirm(t("settings.clearConfirm")) && clearDemo()}>{t("settings.clearDemo")}</Button>
              <Button variant="secondary" onClick={() => window.confirm(t("settings.resetConfirm")) && resetDemo()}>{t("settings.resetDemo")}</Button>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
