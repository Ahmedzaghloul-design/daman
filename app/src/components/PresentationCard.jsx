import { useEffect, useRef } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { usePresentation } from "../state/Presentation.jsx";

/** The presenter's card: the point of each step, Back / Next, language, live switch. */
export default function PresentationCard() {
  const { t, toggle, lang } = useLanguage();
  const p = usePresentation();
  const heading = useRef(null);
  const s = p.steps[p.step];
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [p.step]);
  if (!p.active) return null;
  const last = p.step === p.steps.length - 1;
  return (
    <aside
      aria-label={t("present.label")}
      className="fixed inset-x-3 top-3 z-[60] rounded-2xl border border-gold/40 bg-nile-deep/95 p-4 text-on-nile shadow-float backdrop-blur sm:inset-x-auto sm:top-auto sm:bottom-5 sm:start-5 sm:w-[380px] lg:start-[280px]"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[11px] text-gold" dir="ltr">
          {t("present.kicker")} · {p.step + 1}/{p.steps.length}
        </p>
        <div className="flex items-center gap-1">
          <button type="button" onClick={toggle} className="rounded-lg px-2 py-1 text-xs text-on-nile-2 hover:bg-white/5">{t("langSwitch")}</button>
          <button type="button" onClick={p.exit} aria-label={t("present.exit")} className="rounded-lg p-1.5 text-on-nile-2 hover:bg-white/5">
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" /></svg>
          </button>
        </div>
      </div>
      <h2 ref={heading} tabIndex={-1} className="mt-2 text-lg font-bold leading-snug outline-none">{t(`present.steps.${s.id}.title`)}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-on-nile-2">{t(`present.steps.${s.id}.body`)}</p>
      {s.run && s.run !== "prefill" && (
        <button type="button" onClick={p.rerun} className="mt-2 text-xs text-gold underline-offset-2 hover:underline">{t("present.again")}</button>
      )}
      <div className="mt-3 flex gap-1" aria-hidden="true">
        {p.steps.map((x, i) => <span key={x.id} className={`h-1 flex-1 rounded-full ${i <= p.step ? "bg-gold" : "bg-white/10"}`} />)}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs text-on-nile-2" title={t("present.liveHint")}>
          <input type="checkbox" className="size-4 accent-[var(--color-gold)]" checked={p.live} onChange={(e) => p.setLive(e.target.checked)} />
          {t("present.live")}
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={p.back} disabled={p.step === 0} className="h-9 rounded-lg px-3 text-sm text-on-nile hover:bg-white/5 disabled:opacity-40">{t("present.back")}</button>
          <button type="button" onClick={last ? p.exit : p.next} className="h-9 rounded-lg bg-gold px-4 text-sm font-semibold text-nile-deep">
            {last ? t("present.finish") : t("present.next")} {!last && <span aria-hidden="true">{lang === "ar" ? "←" : "→"}</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
