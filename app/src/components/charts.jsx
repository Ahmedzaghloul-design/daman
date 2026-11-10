// Dashboard charts drawn in SVG (no chart library). Colors come from tokens.
import { useId, useState } from "react";
import { fmt } from "./ui.jsx";

const NILE = "var(--color-nile)";

/** Smooth area chart with a soft fill, hover readout. */
export function AreaChart({ values, labels, height = 120, color = NILE, unit = "" }) {
  const id = useId();
  const [hover, setHover] = useState(null);
  const w = 300;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => [values.length === 1 ? w / 2 : (i / (values.length - 1)) * w, height - 8 - (v / max) * (height - 24)]);
  // Catmull-Rom to Bezier for a smooth line.
  const d = pts.reduce((acc, p, i, a) => {
    if (i === 0) return `M${p[0]} ${p[1]}`;
    const p0 = a[i - 2] ?? a[i - 1], p1 = a[i - 1], p3 = a[i + 1] ?? p;
    const c1 = [p1[0] + (p[0] - p0[0]) / 6, p1[1] + (p[1] - p0[1]) / 6];
    const c2 = [p[0] - (p3[0] - p1[0]) / 6, p[1] - (p3[1] - p1[1]) / 6];
    return `${acc} C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p[0]} ${p[1]}`;
  }, "");
  return (
    <div className="relative" dir="ltr">
      <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none" onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.32" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${d} L${w} ${height} L0 ${height} Z`} fill={`url(#${id})`} />
        <path d={d} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {pts.map((p, i) => (
          <rect key={i} x={p[0] - w / values.length / 2} y="0" width={w / values.length} height={height} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
        {hover !== null && <circle cx={pts[hover][0]} cy={pts[hover][1]} r="3.5" fill={color} stroke="var(--color-card)" strokeWidth="2" vectorEffect="non-scaling-stroke" />}
      </svg>
      {hover !== null && (
        <span className="pointer-events-none absolute -top-2 rounded-md bg-sand px-2 py-1 text-xs tabular-nums text-text shadow-float" style={{ left: `${(pts[hover][0] / w) * 100}%`, transform: "translate(-50%,-100%)" }}>
          {labels?.[hover]} · {fmt(values[hover], 0)} {unit}
        </span>
      )}
    </div>
  );
}

/** Progress ring (0..1). */
export function Ring({ value, size = 92, stroke = 9, color = NILE, label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value ?? 0));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-sand)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${c * v} ${c}`} style={{ transition: "stroke-dasharray 900ms cubic-bezier(0.22,1,0.36,1)" }} />
      </svg>
      <span className="absolute text-lg font-bold tabular-nums text-text" dir="ltr">{label ?? `${Math.round(v * 100)}%`}</span>
    </div>
  );
}

/** Grouped vertical bars per label (e.g. direct vs indirect by month). */
export function GroupedBars({ labels, series, height = 200, unit = "" }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  return (
    <div dir="ltr">
      <div className="relative flex items-end gap-2 border-b border-line" style={{ height }}>
        {[0.25, 0.5, 0.75, 1].map((g) => <span key={g} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-line" style={{ bottom: `${g * 100}%` }} />)}
        {labels.map((l, i) => (
          <div key={l} className="relative flex h-full min-w-0 flex-1 items-end justify-center gap-1" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            {series.map((s) => (
              <span key={s.label} className="w-full max-w-5 rounded-t-[4px] transition-[height] duration-700" style={{ height: `${s.values[i] ? Math.max(2, (s.values[i] / max) * 100) : 0}%`, background: s.color, opacity: hover === null || hover === i ? 1 : 0.45 }} />
            ))}
            {hover === i && (
              <span className="pointer-events-none absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-md bg-sand px-2 py-1 text-xs tabular-nums text-text shadow-float">
                {series.map((s) => `${s.label} ${fmt(s.values[i], 0)}`).join(" · ")} {unit}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-2 text-[11px] text-muted">{labels.map((l) => <span key={l} className="min-w-0 flex-1 text-center">{l}</span>)}</div>
      <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs text-text-2">
        {series.map((s) => <span key={s.label} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: s.color }} />{s.label}</span>)}
      </div>
    </div>
  );
}

/** Donut with legend. items: [{ label, value, color }] */
export function Donut({ items, size = 132, stroke = 16, center }) {
  const total = items.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-sand)" strokeWidth={stroke} />
          {items.map((x) => {
            const len = (x.value / total) * c;
            const el = <circle key={x.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={x.color} strokeWidth={stroke} strokeDasharray={`${Math.max(0, len - 2)} ${c}`} strokeDashoffset={-offset} />;
            offset += len;
            return el;
          })}
        </svg>
        {center && <span className="absolute inset-0 flex flex-col items-center justify-center text-center">{center}</span>}
      </div>
      <ul className="min-w-0 flex-1 space-y-2 text-sm">
        {items.map((x) => (
          <li key={x.label} className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-text-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: x.color }} />{x.label}</span>
            <span className="tabular-nums text-text" dir="ltr">{Math.round((x.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
