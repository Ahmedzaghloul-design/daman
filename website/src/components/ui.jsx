import { useEffect, useRef } from "react";
import { LAYERS } from "@daman/brand/logo/mark.js";

const VARIANTS = {
  primary: "bg-nile text-white hover:bg-nile-700",
  gold: "bg-gold text-nile-deep hover:brightness-105",
  secondary: "bg-card text-text border border-line hover:bg-sand",
  ghostDark: "text-on-nile border border-on-nile/25 hover:bg-white/5",
};

export const buttonClass = (variant = "primary", extra = "") =>
  `inline-flex items-center justify-center gap-2 rounded-xl px-5 h-11 text-sm font-semibold transition-[background-color,filter,transform] duration-150 ease-daman active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${extra}`;

export function Button({ variant, className = "", ...props }) {
  return <button type="button" className={buttonClass(variant, className)} {...props} />;
}

export function Container({ className = "", children, ...props }) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function Kicker({ children, dark }) {
  return <p className={`font-mono text-xs tracking-wide ${dark ? "text-gold" : "text-gold-700"}`}>{children}</p>;
}

export function SectionHeading({ kicker, title, intro, dark, center }) {
  return (
    <div className={`reveal max-w-3xl ${center ? "mx-auto text-center" : ""}`}>
      {kicker && <Kicker dark={dark}>{kicker}</Kicker>}
      <h2 className={`mt-3 text-3xl font-bold tracking-[-0.025em] sm:text-4xl ${dark ? "text-on-nile" : "text-text"}`}>{title}</h2>
      {intro && <p className={`mt-4 text-lg leading-relaxed ${dark ? "text-on-nile-2" : "text-text-2"}`}>{intro}</p>}
    </div>
  );
}

/** Numbers, IDs and dates: monospace, tabular, always left-to-right. */
export function Num({ children, className = "" }) {
  return (
    <span dir="ltr" className={`font-mono tabular-nums ${className}`}>
      {children}
    </span>
  );
}

/**
 * Arabic text with Western digits: wraps every token that contains a digit in
 * its own left-to-right run. Without this, the browser's bidi algorithm shows
 * "12؟00" as "00؟12" inside right-to-left text.
 */
export function ArabicWithNumbers({ text }) {
  return text.split(/(\s+)/).map((tok, i) => {
    if (!/\d/.test(tok)) return tok;
    // Inside a number, an unreadable glyph ("؟", which is a right-to-left
    // character) would pull the digits after it into reverse order. Show it as
    // a highlighted, direction-neutral "?" so "12؟00" reads as 12[?]00.
    const parts = tok.split("؟");
    return (
      <bdi key={i} dir="ltr">
        {parts.map((p, j) => (
          <span key={j}>
            {j > 0 && (
              <span className="mx-px rounded-tag bg-review-soft px-1 text-review" title="Unreadable digit">
                ?
              </span>
            )}
            {p}
          </span>
        ))}
      </bdi>
    );
  });
}

/** The flat Daman mark, drawn from the single logo source. */
export function Mark({ size = 36, theme = "light", className = "" }) {
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} className={className} aria-hidden="true">
      {LAYERS.map((l) => (
        <path key={l.name} d={l.d} fill={l[theme]} fillRule="evenodd" />
      ))}
    </svg>
  );
}

export function Wordmark({ dark = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Mark size={34} theme={dark ? "dark" : "light"} />
      <span className={`text-lg font-semibold tracking-[-0.01em] ${dark ? "text-on-nile" : "text-nile-deep"}`}>Daman</span>
      <span className={`font-arabic text-base font-semibold ${dark ? "text-gold" : "text-gold-700"}`}>ضمان</span>
    </span>
  );
}

/**
 * Adds the "in" class to every `.reveal` / `.draw` element inside the page
 * once it scrolls into view. Mount once per page.
 */
export function useReveal(deps = []) {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal:not(.in), .draw:not(.in)");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Counts up to `value` when it scrolls into view. */
export function CountUp({ value, decimals = 0, suffix = "", className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const format = (n) => n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
    if (reduce) {
      el.textContent = format(value);
      return;
    }
    let raf;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / 1200);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = format(value * eased);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, decimals, suffix]);
  return (
    <span ref={ref} dir="ltr" className={`font-mono tabular-nums ${className}`}>
      0{suffix}
    </span>
  );
}
