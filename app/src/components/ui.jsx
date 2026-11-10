// Shared UI for the program: brand tokens only, quiet chrome, numbers in mono.
import { useEffect, useRef } from "react";
import { LAYERS } from "@daman/brand/logo/mark.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const VARIANTS = {
  primary: "bg-nile text-[#04161b] hover:bg-nile-700",
  secondary: "border border-line bg-card text-text hover:bg-sand",
  ghost: "text-text-2 hover:bg-sand hover:text-text",
  success: "bg-verified text-[#04161b] hover:brightness-110",
  danger: "border border-anomaly/40 bg-card text-anomaly hover:bg-anomaly-soft",
};
export const buttonClass = (variant = "primary", extra = "") =>
  `inline-flex h-9 items-center justify-center gap-2 rounded-control px-3.5 text-sm font-medium transition-[background-color,filter,transform] duration-150 ease-daman active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${extra}`;
export function Button({ variant, className = "", ...p }) {
  return <button type="button" className={buttonClass(variant, className)} {...p} />;
}

export const fmt = (n, d = 0) =>
  n === null || n === undefined || !Number.isFinite(Number(n)) ? "—" : Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

/** Numbers and dates: even-width digits, always left-to-right. */
export function Num({ children, className = "" }) {
  return (
    <span dir="ltr" className={`tabular-nums ${className}`}>
      {children}
    </span>
  );
}

/** Customs codes and entry IDs: monospace, accent color, left-to-right. */
export function Code({ children, className = "" }) {
  return (
    <span dir="ltr" className={`font-mono text-[0.92em] text-nile ${className}`}>
      {children}
    </span>
  );
}

/** A colored icon chip, as in dashboard KPI cards. */
export function IconChip({ d, tone = "nile", size = 40 }) {
  const tones = { nile: "bg-nile/15 text-nile", gold: "bg-gold/15 text-gold", verified: "bg-verified-soft text-verified", review: "bg-review-soft text-review", anomaly: "bg-anomaly-soft text-anomaly" };
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-xl ${tones[tone]}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 20 20" width={size * 0.45} height={size * 0.45} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
    </span>
  );
}

export function Mark({ size = 28, theme = "dark" }) {
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} aria-hidden="true">
      {LAYERS.map((l) => (
        <path key={l.name} d={l.d} fill={l[theme]} fillRule="evenodd" />
      ))}
    </svg>
  );
}

const BADGE = {
  verified: "bg-verified-soft text-verified",
  verified_anomaly: "bg-anomaly-soft text-anomaly",
  pending: "bg-review-soft text-review",
  estimated: "bg-verified-soft text-verified",
  incomplete: "bg-review-soft text-review",
  default: "bg-sand text-text-2",
};
export function StatusBadge({ status }) {
  const { t } = useLanguage();
  return <span className={`inline-flex whitespace-nowrap rounded-tag px-2 py-0.5 text-xs font-medium ${BADGE[status] ?? "bg-sand text-text-2"}`}>{t(`status.${status}`)}</span>;
}
export function DemoTag() {
  const { t } = useLanguage();
  return <span className="rounded-tag border border-line px-1 text-[10px] uppercase tracking-wide text-muted">{t("common.demo")}</span>;
}

/** Share of actual data as a small bar (like the EU portals' "% actual data"). */
export function ActualBar({ share }) {
  // null = incomplete product: no share is claimed.
  if (share === null || share === undefined) return <span className="text-xs text-review">—</span>;
  const pct = Math.round(share * 100);
  return (
    <span className="inline-flex items-center gap-2" dir="ltr">
      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-sand">
        <span className={`block h-full rounded-full ${pct >= 80 ? "bg-verified" : pct > 0 ? "bg-gold" : "bg-line"}`} style={{ width: `${pct}%` }} />
      </span>
      <span className="text-xs font-medium tabular-nums text-text-2">{pct}%</span>
    </span>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 pb-6">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-text sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-text-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({ title, actions, children, className = "", padded = true }) {
  return (
    <section className={`rounded-card border border-line bg-card shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] ${className}`}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="text-[15px] font-semibold text-text">{title}</h2>
          {actions}
        </header>
      )}
      <div className={padded ? "p-4" : ""}>{children}</div>
    </section>
  );
}

export const inputClass = "h-10 w-full rounded-control border border-line bg-cream px-3 text-sm text-text focus:border-nile focus:outline-none";

export function Field({ label, hint, children, className = "" }) {
  return (
    <label className={`block text-sm font-medium text-text-2 ${className}`}>
      {label}
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

/** Side drawer for details and forms. Escape closes it. */
export function Drawer({ open, title, onClose, children, footer }) {
  const { t } = useLanguage();
  const panel = useRef(null);
  useEffect(() => {
    if (!open) return;
    const before = document.activeElement;
    panel.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab" || !panel.current) return;
      // Keep Tab inside the drawer while it is open.
      const items = [...panel.current.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (!items.length) return;
      const first = items[0], last = items.at(-1);
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (before instanceof HTMLElement) before.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" tabIndex={-1} className="absolute inset-0 bg-nile-deep/30" aria-label={t("common.close")} onClick={onClose} />
      <div ref={panel} tabIndex={-1} className="relative flex h-full w-full max-w-xl flex-col bg-card shadow-float outline-none" style={{ animation: "drawer-in 300ms cubic-bezier(0.22,1,0.36,1)" }}>
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-semibold">{title}</h2>
          <Button variant="ghost" onClick={onClose}>{t("common.close")}</Button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</footer>}
      </div>
    </div>
  );
}

/** Arabic text with Western digits kept in true order; unreadable digits highlighted. */
export function ArabicWithNumbers({ text, unreadableLabel = "?" }) {
  return String(text ?? "").split(/(\s+)/).map((tok, i) => {
    if (!/\d/.test(tok)) return tok;
    const parts = tok.split("؟");
    return (
      <bdi key={i} dir="ltr">
        {parts.map((p, j) => (
          <span key={j}>
            {j > 0 && <span className="mx-px rounded-tag bg-review-soft px-1 text-review" title={unreadableLabel}>?</span>}
            {p}
          </span>
        ))}
      </bdi>
    );
  });
}

export function downloadFile(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
