import { useState } from "react";
import { Link, Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useAppState } from "../state/AppState.jsx";
import { usePipeline } from "../state/Pipeline.jsx";
import { Mark } from "./ui.jsx";

export const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL || "http://localhost:5173";

// 20px line icons, stroke 1.5, drawn in code.
const ICONS = {
  overview: "M3 3h6v6H3zM11 3h6v4h-6zM11 9h6v8h-6zM3 11h6v6H3z",
  report: "M4 3h12v14H4zM7 7h6M7 10h6M7 13h4",
  receipts: "M5 2h10v16l-2.5-1.5L10 18l-2.5-1.5L5 18zM8 6h4M8 9h4M8 12h2",
  ledger: "M3 4h14M3 8h14M3 12h14M3 16h9",
  anomalies: "M10 3l8 14H2zM10 8v4M10 14.5v.5",
  calculator: "M5 2h10v16H5zM7 5h6v3H7zM7 11h1M10 11h1M13 11h0M7 14h1M10 14h1M13 14h0",
  installations: "M2 18V9l5-3v3l5-3v3l5-3v12zM6 13h1M10 13h1M14 13h1",
  products: "M3 6l7-3 7 3v8l-7 3-7-3zM3 6l7 3 7-3M10 9v8",
  settings: "M10 7a3 3 0 1 0 0 6a3 3 0 0 0 0-6M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4",
  more: "M4 10h.01M10 10h.01M16 10h.01",
  camera: "M3 6h3l2-2h4l2 2h3v10H3zM10 8a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7",
  verify: "M10 2l7 3v5c0 4-3 7-7 8c-4-1-7-4-7-8V5zM7 10l2 2l4-4",
  account: "M10 3a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7M3 18c1-3.5 3.8-5 7-5s6 1.5 7 5",
};
export function Icon({ name, size = 18 }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={name === "more" ? 3 : 1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

const GROUPS = [
  { label: "nav.workspace", items: ["overview", "report", "receipts", "ledger", "anomalies", "verify"] },
  { label: "nav.tools", items: ["calculator"] },
  { label: "nav.registry", items: ["installations", "products"] },
];
// Uploaders (floor staff) only send receipts; they never see the ledger or costs.
const UPLOADER_PAGES = ["receipts", "calculator", "account"];
const visible = (role, key) => (role === "uploader" ? UPLOADER_PAGES.includes(key) : role === "verifier" ? key !== "receipts" : true);

// Faint landmark line drawing (Egypt -> Europe) for the sidebar foot.
function SidebarSkyline() {
  return (
    <svg viewBox="0 0 240 40" className="w-full text-on-nile-2/20" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <path d="M4 38 L22 18 L40 38 M30 38 L42 24 L54 38 M66 38 V12 M70 38 V12 M63 12 H73 L71 8 H65 Z M68 8 V2 M92 38 V24 H120 V38 M92 24 v-3 h4 v3 h4 v-3 h4 v3 h4 v-3 h4 v3 M140 38 Q147 26 148 14 L150 4 L152 14 Q153 26 160 38 M144 30 H156 M176 38 V22 M184 38 V22 M192 38 V22 M200 38 V22 M172 22 H204 V18 H172 Z M220 38 V12 H230 V38 M218 12 L225 2 L232 12 M0 38 H240" />
    </svg>
  );
}

function ApiStatus() {
  const { t } = useLanguage();
  const { apiHealth } = useAppState();
  let s = { dot: "bg-muted", label: "…" };
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

function NavItem({ to, label, icon, badge, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex h-10 items-center gap-3 rounded-xl px-2.5 text-sm font-medium transition-colors ${isActive ? "bg-nile/15 text-nile" : "text-on-nile-2 hover:bg-white/5 hover:text-on-nile"}`
      }
    >
      <Icon name={icon} />
      <span className="flex-1">{label}</span>
      {badge && <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />}
    </NavLink>
  );
}

function Sidebar({ onNavigate }) {
  const { t, toggle } = useLanguage();
  const { installations, settings, role, workspace } = useAppState();
  const { state: pipeline } = usePipeline();
  const busy = ["ocr", "auditing", "review"].includes(pipeline.phase);
  return (
    <div className="flex h-full flex-col border-e border-line bg-nile-deep">
      <a href={WEBSITE_URL} className="flex items-center gap-2.5 px-5 py-5" aria-label={t("common.backToSite")}>
        <Mark size={32} />
        <span className="text-lg font-bold text-on-nile">Daman</span>
        <span className="font-arabic text-sm font-semibold text-gold">ضمان</span>
      </a>
      <div className="mx-3 mb-5 rounded-xl bg-white/[0.03] px-3 py-3">
        <Link to="/account" onClick={onNavigate} className="mb-2 flex items-center justify-between gap-2 border-b border-white/5 pb-2">
          <span className="min-w-0 truncate text-sm font-semibold text-on-nile">{workspace?.name ?? t("account.demoMode")}</span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${workspace ? "bg-nile/15 text-nile" : "bg-white/5 text-on-nile-2"}`}>{t(`roles.${role}`)}</span>
        </Link>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{t("nav.installation")}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-on-nile">{installations[0]?.name ?? "—"}{installations.length > 1 ? ` +${installations.length - 1}` : ""}</p>
        <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-muted">{t("nav.period")}</p>
        <p className="text-sm font-semibold tabular-nums text-on-nile">{settings.year}</p>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3" aria-label="Main">
        {GROUPS.map((g) => ({ ...g, items: g.items.filter((k) => visible(role, k)) })).filter((g) => g.items.length).map((g) => (
          <div key={g.label}>
            <p className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">{t(g.label)}</p>
            {g.items.map((key) => <NavItem key={key} to={`/${key}`} icon={key} label={t(`nav.${key}`)} badge={key === "receipts" && busy} onClick={onNavigate} />)}
          </div>
        ))}
        <div>
          {role !== "uploader" && <NavItem to="/settings" icon="settings" label={t("nav.settings")} onClick={onNavigate} />}
          <NavItem to="/account" icon="account" label={t("nav.account")} onClick={onNavigate} />
        </div>
      </nav>
      <div className="space-y-4 px-5 pb-5 pt-5">
        <SidebarSkyline />
        <ApiStatus />
        <div className="flex items-center justify-between">
          <button type="button" onClick={toggle} className="rounded-lg px-2 py-1 text-xs text-on-nile-2 hover:bg-white/5 hover:text-on-nile">{t("langSwitch")}</button>
          <a href={WEBSITE_URL} className="text-xs text-on-nile-2 hover:text-on-nile">{t("common.backToSite")}</a>
        </div>
      </div>
    </div>
  );
}

/** Phone tab bar, like a native app. The middle button opens the camera flow. */
function TabBar({ onMore }) {
  const { t } = useLanguage();
  const { role } = useAppState();
  const tab = (to, icon, label) => (
    <NavLink to={to} className={({ isActive }) => `flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium ${isActive ? "text-nile" : "text-muted"}`}>
      <Icon name={icon} size={22} />
      {label}
    </NavLink>
  );
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-nile-deep/95 backdrop-blur lg:hidden" aria-label="Tabs">
      <div className="mx-auto flex max-w-lg items-end">
        {role === "uploader" ? tab("/account", "account", t("nav.account")) : tab("/overview", "overview", t("nav.overview"))}
        {role === "verifier" ? tab("/verify", "verify", t("nav.verify")) : role === "uploader" ? null : tab("/report", "report", t("nav.report").split(" ")[0])}
        {role === "verifier" ? tab("/ledger", "ledger", t("nav.ledger")) : <Link to="/receipts" aria-label={t("nav.receipts")} className="-mt-5 flex flex-1 flex-col items-center gap-1 pb-2 text-[11px] font-medium text-nile">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-nile text-[#04161b] shadow-float"><Icon name="camera" size={24} /></span>
          {t("nav.receipts")}
        </Link>}
        {tab("/calculator", "calculator", t("nav.tools"))}
        <button type="button" onClick={onMore} className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-muted">
          <Icon name="more" size={22} />
          {t("nav.more")}
        </button>
      </div>
    </nav>
  );
}

export default function Layout() {
  const { t, toggle } = useLanguage();
  const [more, setMore] = useState(false);
  const { pathname } = useLocation();
  const { role, cloudError, dismissCloudError, loading } = useAppState();
  const page = pathname.split("/")[1];
  if (page && !visible(role, page) && page !== "settings") return <Navigate to={role === "uploader" ? "/receipts" : "/overview"} replace />;
  if (role === "uploader" && page === "settings") return <Navigate to="/receipts" replace />;
  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block"><Sidebar /></aside>

      {/* Phone top bar */}
      <header className="safe-top sticky top-0 z-30 flex items-center justify-between border-b border-line bg-cream/90 px-4 py-3 backdrop-blur lg:hidden">
        <span className="flex items-center gap-2"><Mark size={28} /><span className="font-bold text-text">Daman</span></span>
        <button type="button" onClick={toggle} className="rounded-lg px-3 py-1.5 text-sm text-text-2 hover:bg-sand">{t("langSwitch")}</button>
      </header>

      {/* Phone "More" sheet: full navigation */}
      {more && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label={t("common.close")} onClick={() => setMore(false)} />
          <div className="absolute inset-y-0 start-0 w-[82%] max-w-xs fade-up"><Sidebar onNavigate={() => setMore(false)} /></div>
        </div>
      )}

      <main key={pathname} className="fade-up min-w-0 px-4 pb-28 pt-5 sm:px-8 sm:pt-8 lg:pb-10">
        <div className="mx-auto max-w-[1400px]">
          {cloudError && (
            <p role="alert" className="mb-5 flex items-start justify-between gap-3 rounded-card border border-anomaly/40 bg-anomaly-soft px-4 py-3 text-sm text-anomaly">
              <span>{t("account.cloudError")}: {cloudError}</span>
              <button type="button" onClick={dismissCloudError} className="shrink-0 underline">{t("common.close")}</button>
            </p>
          )}
          {loading && <p className="mb-5 text-sm text-text-2">{t("account.loading")}</p>}
          <Outlet />
        </div>
      </main>
      <TabBar onMore={() => setMore(true)} />
    </div>
  );
}
