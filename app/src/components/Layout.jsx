import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useAppState } from "../state/AppState.jsx";
import { usePipeline } from "../state/Pipeline.jsx";
import { Mark } from "./ui.jsx";

export const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL || "http://localhost:5173";

// 16px line icons, stroke 1.5, drawn in code.
const ICONS = {
  overview: "M3 13h4v5H3zM8 8h4v10H8zM13 4h4v14h-4z",
  report: "M4 3h12v14H4zM7 7h6M7 10h6M7 13h4",
  receipts: "M5 2h10v16l-2.5-1.5L10 18l-2.5-1.5L5 18zM8 6h4M8 9h4M8 12h2",
  ledger: "M3 4h14M3 8h14M3 12h14M3 16h9",
  anomalies: "M10 3l8 14H2zM10 8v4M10 14.5v.5",
  installations: "M2 18V9l5-3v3l5-3v3l5-3v12zM6 13h1M10 13h1M14 13h1",
  products: "M3 6l7-3 7 3v8l-7 3-7-3zM3 6l7 3 7-3M10 9v8",
  settings: "M10 7a3 3 0 1 0 0 6a3 3 0 0 0 0-6M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4",
};
function Icon({ name }) {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

const GROUPS = [
  { label: "nav.workspace", items: ["overview", "report", "receipts", "ledger", "anomalies"] },
  { label: "nav.registry", items: ["installations", "products"] },
];

// A faint line drawing of landmarks for the sidebar foot (Egypt -> Europe).
function SidebarSkyline() {
  return (
    <svg viewBox="0 0 240 40" className="w-full text-on-nile-2/25" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <path d="M4 38 L22 18 L40 38 M30 38 L42 24 L54 38 M66 38 V12 M70 38 V12 M63 12 H73 L71 8 H65 Z M68 8 V2 M92 38 V24 H120 V38 M92 24 v-3 h4 v3 h4 v-3 h4 v3 h4 v-3 h4 v3 M140 38 Q147 26 148 14 L150 4 L152 14 Q153 26 160 38 M144 30 H156 M176 38 V22 M184 38 V22 M192 38 V22 M200 38 V22 M172 22 H204 V18 H172 Z M220 38 V12 H230 V38 M218 12 L225 2 L232 12 M0 38 H240" />
    </svg>
  );
}

function ApiStatus() {
  const { t } = useLanguage();
  const { apiHealth } = useAppState();
  let s = { dot: "bg-on-nile-2/50", label: "…" };
  if (apiHealth.ok === false) s = { dot: "bg-anomaly", label: t("api.offline") };
  else if (apiHealth.ok && apiHealth.mock) s = { dot: "bg-gold", label: t("api.mock") };
  else if (apiHealth.ok && !apiHealth.keyConfigured) s = { dot: "bg-anomaly", label: t("api.nokey") };
  else if (apiHealth.ok) s = { dot: "bg-verified", label: t("api.connected") };
  return (
    <div className="text-xs text-on-nile-2">
      <p className="flex items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />{s.label}</p>
      {apiHealth.model && <p dir="ltr" className="mt-1 text-start font-mono text-[11px] opacity-70">{apiHealth.model}</p>}
    </div>
  );
}

export default function Layout() {
  const { t, toggle } = useLanguage();
  const { installations, settings } = useAppState();
  const { state: pipeline } = usePipeline();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const busy = pipeline.phase === "ocr" || pipeline.phase === "auditing" || pipeline.phase === "review";

  const nav = (
    <nav className="flex flex-col gap-6 px-3" aria-label="Main">
      {GROUPS.map((g) => (
        <div key={g.label}>
          <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wide text-on-nile-2/70">{t(g.label)}</p>
          <ul className="flex flex-col gap-0.5">
            {g.items.map((key) => (
              <li key={key}>
                <NavLink
                  to={`/${key}`}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex h-9 items-center gap-3 rounded-control px-2 text-sm transition-colors ${isActive ? "bg-nile-raised text-on-nile shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" : "text-on-nile-2 hover:bg-white/5 hover:text-on-nile"}`
                  }
                >
                  <Icon name={key} />
                  <span className="flex-1">{t(`nav.${key}`)}</span>
                  {key === "receipts" && busy && <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div>
        <NavLink
          to="/settings"
          onClick={() => setOpen(false)}
          className={({ isActive }) => `flex h-9 items-center gap-3 rounded-control px-2 text-sm ${isActive ? "bg-nile-raised text-on-nile" : "text-on-nile-2 hover:bg-white/5 hover:text-on-nile"}`}
        >
          <Icon name="settings" />
          {t("nav.settings")}
        </NavLink>
      </div>
    </nav>
  );

  const sidebar = (
    <div className="flex h-full flex-col bg-nile-deep">
      <div className="flex items-center justify-between px-5 py-5">
        <a href={WEBSITE_URL} className="flex items-center gap-2.5" aria-label={t("common.backToSite")}>
          <Mark size={30} theme="dark" />
          <span className="font-semibold text-on-nile">Daman</span>
          <span className="font-arabic text-sm font-semibold text-gold">ضمان</span>
        </a>
      </div>
      <div className="mx-3 mb-6 rounded-control border border-on-nile/10 px-3 py-2.5">
        <p className="text-[11px] uppercase tracking-wide text-on-nile-2/70">{t("nav.installation")}</p>
        <p className="truncate text-sm text-on-nile">{installations[0]?.name ?? "—"}{installations.length > 1 ? ` +${installations.length - 1}` : ""}</p>
        <p className="mt-1.5 text-[11px] uppercase tracking-wide text-on-nile-2/70">{t("nav.period")}</p>
        <p className="font-mono text-sm text-on-nile">{settings.year}</p>
      </div>
      <div className="flex-1 overflow-y-auto">{nav}</div>
      <div className="space-y-4 px-5 pb-5 pt-6">
        <SidebarSkyline />
        <ApiStatus />
        <div className="flex items-center justify-between">
          <button type="button" onClick={toggle} className="rounded-control px-2 py-1 text-xs text-on-nile-2 hover:bg-white/5 hover:text-on-nile">{t("langSwitch")}</button>
          <a href={WEBSITE_URL} className="text-xs text-on-nile-2 hover:text-on-nile">{t("common.backToSite")}</a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">{sidebar}</aside>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-on-nile/10 bg-nile-deep px-4 py-3 lg:hidden">
        <span className="flex items-center gap-2"><Mark size={26} theme="dark" /><span className="font-semibold text-on-nile">Daman</span></span>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="rounded-control px-3 py-1.5 text-sm text-on-nile hover:bg-white/5">
          {open ? t("common.close") : t("nav.workspace")}
        </button>
      </div>
      {open && <div className="fixed inset-0 top-[53px] z-30 lg:hidden">{sidebar}</div>}
      <main key={pathname} className="min-w-0 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-[1400px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
