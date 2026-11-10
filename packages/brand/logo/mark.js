// The Daman logo: "The Stamped Receipt" (chosen 2026-11-10, Phase 1).
// Single source of truth for every logo file and the 3D logo. Run
// `npm run build -w @daman/brand` after changing anything here.
//
// Meaning:
//   back receipt  -> the carbon copy in a factory receipt book
//   front receipt -> the handwritten original, torn from the book
//   Kufic ض       -> ضمان (guarantee), in square Kufic calligraphy
//   ledger lines  -> the record, written down
//   gold seal     -> a human reviewer approved it
//
// Coordinates use a 96 x 96 box, y pointing down (SVG convention).

const f = (n) => +n.toFixed(2);
export const rect = (x, y, w, h) => `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
export const circle = (cx, cy, r) =>
  `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;

/** A receipt with a torn, zig-zag bottom edge. */
export function tornBottom(x, y, w, h, teeth, depth) {
  const step = w / teeth / 2;
  let d = `M${x} ${y}H${x + w}V${y + h}`;
  for (let i = 0; i < teeth; i++) d += `l${f(-step)} ${depth}l${f(-step)} ${-depth}`;
  return d + "Z";
}

/**
 * The letter ض in square Kufic, from non-overlapping blocks (so even-odd
 * filling never cuts holes where blocks touch). Designed in a 96 box around
 * (48, 48); `s` scales it and (cx, cy) moves its centre.
 */
export function kufic(s = 1, cx = 48, cy = 48) {
  const t = (x, y, w, h) => rect(cx + (x - 48) * s, cy + (y - 48) * s, w * s, h * s);
  return {
    dot: t(61.5, 21, 7, 7),
    // loop head with its hole, the bowl's right rim, bottom bar and left rise
    body: [t(51, 34, 28, 24), t(58, 41, 14, 10), t(44, 51, 7, 17), t(17, 68, 35, 7), t(17, 42, 7, 26)].join(""),
  };
}

export const COLORS = {
  nile: "#0e5e6f",
  nileDeep: "#073640",
  mist: "#a9bfc3",
  paper: "#e6d7b8",
  gold: "#c8963e",
  cream: "#f6f0e4",
};

const K = kufic(0.5, 48, 40);

/**
 * Layers, back to front. `light`/`dark` are flat colors for light and dark
 * backgrounds; `material`, `depth` and `z` drive the 3D version.
 */
export const LAYERS = [
  { name: "carbon copy", d: tornBottom(26, 14, 50, 68, 6, 4), light: COLORS.nile, dark: COLORS.mist, material: "nile", depth: 4, z: 0 },
  { name: "receipt", d: tornBottom(20, 9, 50, 68, 6, 4), light: COLORS.paper, dark: COLORS.paper, material: "paper", depth: 6, z: 4 },
  { name: "letter and lines", d: K.body + K.dot + rect(28, 60, 24, 2.5) + rect(28, 66, 16, 2.5), light: COLORS.nile, dark: COLORS.nile, material: "nile", depth: 4, z: 10 },
  { name: "approval seal", d: circle(66, 70, 12) + "M59.5 70.2L62 67.7L64.6 70.3L70.6 64.3L73.1 66.8L64.6 75.3Z", light: COLORS.gold, dark: COLORS.gold, material: "gold", depth: 6, z: 10 },
];

/**
 * Simplified icon for browser tabs and app icons (32 x 32): the Kufic ض
 * with its dot in gold, the approval seal reduced to one detail.
 */
const KI = kufic(0.34, 16, 16.5);
export const ICON = {
  viewBox: "0 0 32 32",
  layers: [
    { d: "M7 0h18a7 7 0 0 1 7 7v18a7 7 0 0 1-7 7H7a7 7 0 0 1-7-7V7a7 7 0 0 1 7-7Z", fill: COLORS.nile },
    { d: KI.body, fill: COLORS.cream },
    { d: KI.dot, fill: COLORS.gold },
  ],
};

export function markSVG({ theme = "light", size } = {}) {
  const sizeAttr = size ? ` width="${size}" height="${size}"` : "";
  const paths = LAYERS.map((l) => `<path d="${l.d}" fill="${l[theme]}" fill-rule="evenodd"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"${sizeAttr} role="img" aria-label="Daman">${paths}</svg>`;
}

export function iconSVG({ size } = {}) {
  const sizeAttr = size ? ` width="${size}" height="${size}"` : "";
  const paths = ICON.layers.map((l) => `<path d="${l.d}" fill="${l.fill}" fill-rule="evenodd"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ICON.viewBox}"${sizeAttr} role="img" aria-label="Daman">${paths}</svg>`;
}
