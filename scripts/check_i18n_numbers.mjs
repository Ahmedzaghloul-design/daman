// Fact-check helper: every English text and its Arabic twin must contain the
// same numbers (dates, prices, percentages, CN codes). Run:
//   node scripts/check_i18n_numbers.mjs
const pairs = [
  ["website", await import("../website/src/i18n/en.js"), await import("../website/src/i18n/ar.js")],
  ["app", await import("../app/src/i18n/en.js"), await import("../app/src/i18n/ar.js")],
];
const pick = (m) => m.default ?? Object.values(m)[0];
const nums = (s) => [...String(s).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).matchAll(/\d+(?:[.,]\d+)*/g)].map((x) => x[0].replace(/,/g, "")).sort();
// Checked by hand 2026-11-11: the Arabic writes these as words (CO2, Q3, "one", "zero").
const SAME_IN_WORDS = new Set(["website calc.s3.body", "website tools.calc.priceAssumed", "website teaser.basis", "app tools.calc.priceAssumed", "app overview.pending", "app products.fields.processHint", "app account.phoneHint"]);
let problems = 0;
const walk = (a, b, path, name) => {
  if (typeof a === "string") {
    const na = nums(a).join(" "), nb = nums(b ?? "").join(" ");
    if (na !== nb && !SAME_IN_WORDS.has(`${name} ${path}`)) { problems++; console.log(`${name} ${path}\n  en: ${na || "-"}\n  ar: ${nb || "-"}`); }
    return;
  }
  if (a && typeof a === "object") for (const k of Object.keys(a)) walk(a[k], b?.[k], path ? `${path}.${k}` : k, name);
};
for (const [name, en, ar] of pairs) walk(pick(en), pick(ar), "", name);
console.log(problems ? `${problems} texts differ` : "All numbers match between English and Arabic.");
process.exitCode = problems ? 1 : 0;
