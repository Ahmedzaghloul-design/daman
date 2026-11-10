import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useAppState } from "../state/AppState.jsx";
import { fmt, Num, PageHeader, Panel, Code } from "../components/ui.jsx";

export default function Anomalies() {
  const { t, energyLabel } = useLanguage();
  const { ledger } = useAppState();
  const rows = ledger.filter((e) => e.status === "verified_anomaly");

  return (
    <>
      <PageHeader title={t("anomalies.title")} subtitle={t("anomalies.subtitle")} />
      {rows.length === 0 ? (
        <p className="rounded-card border border-line bg-card p-8 text-sm text-text-2">{t("anomalies.empty")}</p>
      ) : (
        <div className="space-y-4">
          <Panel title={t("anomalies.chart")}>
            <ul className="space-y-5">
              {rows.map((e) => {
                const d = e.massBalance?.deterministic;
                if (!d?.evaluated) return null;
                const scale = Math.max(d.intensity, d.expectedMax) * 1.15;
                const pos = (v) => `${(v / scale) * 100}%`;
                return (
                  <li key={e.id}>
                    <div className="flex justify-between text-sm"><Code>{e.id}</Code><Num className="text-anomaly">{fmt(d.intensity, 2)} {d.intensityUnit} · {d.deviationPct > 0 ? "+" : ""}{fmt(d.deviationPct, 1)}%</Num></div>
                    <div className="relative mt-2 h-3 rounded-full bg-sand" dir="ltr">
                      <span className="absolute inset-y-0 rounded-full bg-verified/30" style={{ left: pos(d.expectedMin), width: `calc(${pos(d.expectedMax)} - ${pos(d.expectedMin)})` }} />
                      <span className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-anomaly" style={{ left: pos(d.intensity) }} />
                    </div>
                    <div className="mt-1 flex justify-between tabular-nums text-[10px] text-muted" dir="ltr"><span>0</span><span>{fmt(d.expectedMin)}–{fmt(d.expectedMax)} {d.intensityUnit}</span></div>
                  </li>
                );
              })}
            </ul>
          </Panel>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {rows.map((e) => (
              <article key={e.id} className="rounded-card border border-line bg-card p-4 text-sm">
                <div className="flex justify-between"><Code>{e.id}</Code><Num className="text-muted">{e.date}</Num></div>
                <p className="mt-1 text-text-2">{energyLabel(e.energy_type)} · <Num>{fmt(e.volume)} {e.unit}</Num></p>
                <p className="mt-3 text-text">{e.justification || "—"}</p>
                <p className="mt-2 text-xs text-muted">{e.reviewer}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
