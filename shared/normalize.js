// Deterministic text/unit normalisation shared by the server and the browser.
// Keeping this outside the LLM means the same input always produces the same
// number — a requirement for anything an EU verifier will audit.

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";

/** Convert Arabic-Indic (and Persian) digits to Western digits. */
export function normalizeDigits(text = "") {
  return String(text)
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(PERSIAN.indexOf(d)))
    .replace(/٫/g, ".")
    .replace(/٬/g, ",");
}

const UNIT_ALIASES = {
  L: ["l", "liter", "liters", "litre", "litres", "لتر", "لترات", "ltr"],
  kWh: ["kwh", "kw h", "kilowatt hour", "kilowatt-hour", "kilowatt hours", "كيلو وات ساعة", "كيلووات ساعة", "ك.و.س"],
  m3: ["m3", "m^3", "m³", "cubic meter", "cubic meters", "cubic metre", "cubic metres", "متر مكعب", "م3"],
  t: ["t", "tonne", "tonnes", "ton", "tons", "طن"],
};

/** Map free-text units ("Liters", "لتر", "litre") to a canonical code. */
export function normalizeUnit(unit = "") {
  const u = String(unit).trim().toLowerCase();
  for (const [canonical, aliases] of Object.entries(UNIT_ALIASES)) {
    if (u === canonical.toLowerCase() || aliases.includes(u)) return canonical;
  }
  return String(unit).trim();
}

const ENERGY_ALIASES = {
  Diesel: ["diesel", "gas oil", "gasoil", "solar", "سولار", "ديزل"],
  Electricity: ["electricity", "electric", "power", "كهرباء"],
  "Natural Gas": ["natural gas", "gas", "ng", "غاز طبيعي", "غاز"],
  "Heavy Fuel Oil": ["heavy fuel oil", "hfo", "mazut", "مازوت"],
  Coal: ["coal", "فحم"],
  Petcoke: ["petcoke", "pet coke", "petroleum coke", "بتروكوك"],
};

/** Map free-text energy carriers to a canonical English name. */
export function normalizeEnergyType(type = "") {
  const v = String(type).trim().toLowerCase();
  for (const [canonical, aliases] of Object.entries(ENERGY_ALIASES)) {
    if (v === canonical.toLowerCase() || aliases.includes(v)) return canonical;
  }
  return String(type).trim();
}
