// Shared flat UI primitives. Sharp corners (rounded-sm), solid colours only.
import { useLanguage } from "../i18n/LanguageContext.jsx";

const VARIANTS = {
  primary: "bg-slate-900 text-white hover:bg-slate-800 border border-slate-900",
  secondary: "bg-white text-slate-900 hover:bg-gray-100 border border-slate-300",
  success: "bg-emerald-700 text-white hover:bg-emerald-800 border border-emerald-700",
  danger: "bg-white text-red-700 hover:bg-red-50 border border-red-700",
  inverse: "bg-white text-slate-900 hover:bg-gray-100 border border-white",
};

/** Button styling, reusable on <a> / <Link> so links never wrap a <button>. */
export const buttonClass = (variant = "primary", className = "") =>
  `inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`;

export function Button({ variant = "primary", className = "", ...props }) {
  return <button type="button" className={buttonClass(variant, className)} {...props} />;
}

export function Logo({ inverse = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-sm font-arabic text-lg font-bold ${inverse ? "bg-white text-slate-900" : "bg-slate-900 text-white"}`}
        aria-hidden="true"
      >
        ض
      </span>
      <span className={`text-lg font-semibold tracking-tight ${inverse ? "text-white" : "text-slate-900"}`}>
        Daman <span className={`font-arabic font-normal ${inverse ? "text-slate-400" : "text-slate-500"}`}>ضمان</span>
      </span>
    </span>
  );
}

export function LanguageToggle({ inverse = false }) {
  const { t, toggle } = useLanguage();
  return (
    <button
      type="button"
      onClick={toggle}
      className={`rounded-sm border px-2.5 py-1 text-xs font-medium ${inverse ? "border-slate-600 text-slate-200 hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-gray-100"}`}
    >
      {t("lang.switch")}
    </button>
  );
}

/** Numeric readout: always monospace, tabular, Western digits, LTR. */
export function Num({ children, className = "" }) {
  return (
    <span dir="ltr" className={`font-mono tabular-nums ${className}`}>
      {children}
    </span>
  );
}

export const fmt = (n, digits = 0) =>
  n === null || n === undefined || !Number.isFinite(Number(n))
    ? "—"
    : Number(n).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function SectionHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-300 pb-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 max-w-3xl text-sm text-slate-600">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Panel({ title, children, className = "", actions }) {
  return (
    <section className={`rounded-sm border border-slate-300 bg-white ${className}`}>
      {title && (
        <header className="flex items-center justify-between border-b border-slate-300 px-4 py-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-600">{title}</h2>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}
