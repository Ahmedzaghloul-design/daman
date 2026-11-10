// Writes the logo SVG files from logo/mark.js (the single source of truth).
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { COLORS, iconSVG, LAYERS, markSVG } from "../logo/mark.js";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "logo");

// Full lockup: mark + "Daman" + "ضمان". The words use live fonts (Inter,
// IBM Plex Sans Arabic); outline them before sending the file to a printer.
function lockup(theme) {
  const word = theme === "light" ? COLORS.nileDeep : "#f2eee6";
  const wordAr = theme === "light" ? "#875f1c" : COLORS.gold;
  const paths = LAYERS.map((l) => `<path d="${l.d}" fill="${l[theme]}" fill-rule="evenodd"/>`).join("");
  // Measured in the browser: "Daman" at 44px ≈ 146 wide (108→254), "ضمان" at 32px ≈ 78 wide.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 372 96" role="img" aria-label="Daman ضمان">
  <g>${paths}</g>
  <text x="108" y="61" font-family="Inter, sans-serif" font-weight="600" font-size="44" letter-spacing="-0.6" fill="${word}">Daman</text>
  <rect x="268" y="30" width="1.5" height="36" fill="${wordAr}" opacity="0.6"/>
  <text x="283" y="61" font-family="'IBM Plex Sans Arabic', sans-serif" font-weight="600" font-size="32" fill="${wordAr}">ضمان</text>
</svg>
`;
}

const files = {
  "daman-mark.svg": markSVG({ theme: "light" }),
  "daman-mark-on-dark.svg": markSVG({ theme: "dark" }),
  "daman-icon.svg": iconSVG(),
  "daman-lockup.svg": lockup("light"),
  "daman-lockup-on-dark.svg": lockup("dark"),
};
for (const [name, svg] of Object.entries(files)) {
  writeFileSync(join(out, name), svg.endsWith("\n") ? svg : svg + "\n");
  console.log("wrote logo/" + name);
}

// Brand sheet: every final file inline, so it opens anywhere without a server.
const fonts = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=IBM+Plex+Mono&family=IBM+Plex+Sans+Arabic:wght@600&display=swap">`;
const cell = (label, inner, bg = "#f6f0e4") =>
  `<figure style="margin:0;background:${bg};border:1px solid rgba(30,26,20,.1);border-radius:12px;padding:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;min-height:160px">${inner}<figcaption style="font:12px 'IBM Plex Mono',monospace;color:${bg === "#f6f0e4" ? "#6b6152" : "#a9bfc3"}">${label}</figcaption></figure>`;
const sheet = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Daman — Brand Sheet</title>${fonts}</head>
<body style="margin:0;background:#fcf8f0;font:15px/1.5 Inter,sans-serif;color:#1e1a14"><main style="max-width:1100px;margin:0 auto;padding:48px 24px">
<p style="font:12px 'IBM Plex Mono',monospace;color:#6b6152;margin:0">DAMAN BRAND SHEET · GENERATED FROM logo/mark.js</p>
<h1 style="font-weight:500;letter-spacing:-.02em;margin:8px 0 24px">The Stamped Receipt</h1>
<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px">
${cell("daman-lockup.svg", files["daman-lockup.svg"].replace("<svg ", '<svg width="240" '))}
${cell("daman-lockup-on-dark.svg", files["daman-lockup-on-dark.svg"].replace("<svg ", '<svg width="240" '), "#073640")}
${cell("daman-mark.svg · 128px", markSVG({ theme: "light", size: 128 }))}
${cell("daman-mark-on-dark.svg · 128px", markSVG({ theme: "dark", size: 128 }), "#073640")}
${cell("daman-icon.svg · 64 / 32 / 16px", `<div style="display:flex;gap:16px;align-items:end">${iconSVG({ size: 64 })}${iconSVG({ size: 32 })}${iconSVG({ size: 16 })}</div>`)}
${cell("browser tab", `<span style="display:inline-flex;gap:6px;align-items:center;background:#ede3d1;border-radius:6px 6px 0 0;padding:6px 10px;font-size:12px">${iconSVG({ size: 16 })} Daman — CBAM Compliance</span>`)}
</div></main></body></html>
`;
writeFileSync(join(out, "..", "brand-sheet.html"), sheet);

// Favicons for both frontends.
for (const app of ["website", "app"]) {
  const dir = join(out, "..", "..", "..", app, "public");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "favicon.svg"), iconSVG() + "\n");
  console.log(`wrote ${app}/public/favicon.svg`);
}
console.log("wrote brand-sheet.html");
