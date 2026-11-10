// Draws the link-preview pictures (1200 x 630) shown when someone shares the
// website on WhatsApp, LinkedIn, X or Facebook. Built from the real logo
// (packages/brand/logo/mark.js) and the brand colours, then photographed with
// Playwright's Chromium. Run after changing the logo or headline:
//   node website/scripts/build-og-image.mjs
// Output: website/public/og-image.png (English) and og-image-ar.png (Arabic).
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { markSVG } from "@daman/brand/logo/mark.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "..", "public");

const COPY = {
  en: {
    dir: "ltr",
    kicker: "EU CBAM · Egyptian exporters",
    title: "Verified carbon data from handwritten Arabic receipts",
    line: "Priced on your real emissions, not marked-up default values.",
  },
  ar: {
    dir: "rtl",
    kicker: "آلية CBAM الأوروبية · المصدّرون المصريون",
    title: "بيانات كربون مُتحقَّق منها من إيصالات مكتوبة بخط اليد",
    line: "تُسعَّر صادراتك على انبعاثاتك الفعلية، لا على قيم افتراضية مضاف إليها علاوة.",
  },
};

const page = (c) => `<!doctype html><html dir="${c.dir}"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&family=IBM+Plex+Sans+Arabic:wght@500;700&family=JetBrains+Mono:wght@500&display=block">
<style>
  *{margin:0;box-sizing:border-box}
  html{width:1200px;height:630px;overflow:hidden}
  body{width:1200px;height:630px;background:#073640;color:#f2eee6;font-family:"Plus Jakarta Sans","IBM Plex Sans Arabic",sans-serif;position:relative;overflow:hidden}
  html[dir=rtl] body{font-family:"IBM Plex Sans Arabic",sans-serif}
  .glow{position:absolute;right:-120px;bottom:-260px;width:720px;height:720px;border-radius:50%;background:radial-gradient(circle,#0e5e6f 0%,rgba(14,94,111,0) 70%)}
  html[dir=rtl] .glow{right:auto;left:-120px}
  .wrap{position:absolute;inset:72px 80px;display:flex;flex-direction:column;justify-content:space-between}
  .brand{display:flex;align-items:center;gap:18px}
  .brand svg{width:84px;height:84px}
  .name{font-size:44px;font-weight:800;letter-spacing:-.02em}
  .ar{font-family:"IBM Plex Sans Arabic";font-weight:700;font-size:36px;color:#c8963e}
  .kicker{font-family:"JetBrains Mono","IBM Plex Sans Arabic",monospace;font-size:24px;color:#f0d091;margin-bottom:18px}
  h1{font-size:62px;line-height:1.08;font-weight:800;letter-spacing:-.025em;max-width:960px}
  html[dir=rtl] h1{letter-spacing:0;line-height:1.25;font-size:58px}
  p{margin-top:22px;font-size:28px;color:#c8d8db;max-width:900px}
  .rule{position:absolute;bottom:0;inset-inline:0;height:10px;background:linear-gradient(90deg,#c8963e,#0e5e6f)}
</style></head><body>
<div class="glow"></div>
<div class="wrap">
  <div class="brand">${markSVG({ theme: "dark" })}<span class="name">Daman</span><span class="ar">ضمان</span></div>
  <div><div class="kicker">${c.kicker}</div><h1>${c.title}</h1><p>${c.line}</p></div>
</div>
<div class="rule"></div>
</body></html>`;

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
for (const [lang, c] of Object.entries(COPY)) {
  await tab.setContent(page(c), { waitUntil: "networkidle" });
  await tab.evaluate(() => document.fonts.ready);
  const file = path.join(out, lang === "en" ? "og-image.png" : "og-image-ar.png");
  await tab.screenshot({ path: file });
  console.log("wrote", path.relative(process.cwd(), file));
}
await browser.close();
