// CBAM certificate cost on DEFAULT values, following the law step by step.
//
//   embedded (t CO2e / t)   = default value × (1 + mark-up)            [IR 2025/2621, Annex I]
//   free allocation (t / t) = CBAM factor × CSCF × benchmark Column B    [IR 2025/2620, Annex, Eq. 6]
//   certificates per tonne  = max(0, embedded − free allocation)        [Reg. 2023/956, Art. 31]
//   cost                    = certificates × tonnes × certificate price
//
// Data: packages/core/data/cbam-data.json (built from the official EU files
// by scripts/extract_cbam_data.py). This module never invents a value: when
// something is not defined (e.g. CSCF after 2030), it returns an explicit
// "unavailable" reason instead of a number.
import data from "./data/cbam-data.json" with { type: "json" };

export const CBAM_DATA = data;
export const SUPPORTED_YEARS = Object.keys(data.cscf).map(Number); // 2026–2030: CSCF is defined
const METALS = new Set(["steel", "cement", "aluminium", "hydrogen"]);

/** Mark-up on default values for a sector and year. Electricity is not handled here. */
export function markup(sector, year) {
  if (sector === "fertilisers") return data.markups.fertilisers;
  if (!METALS.has(sector)) return null;
  const m = data.markups.metals;
  return year >= 2028 ? m["2028"] : m[String(year)] ?? null;
}

export const cbamFactor = (year) => (year >= 2034 ? 0 : data.cbamFactor[String(year)] ?? null);
export const cscf = (year) => data.cscf[String(year)] ?? null;

/** Find a CBAM good by CN/TARIC code (spaces ignored). */
export function findGood(code) {
  const c = String(code).replace(/\s+/g, "");
  return data.goods.find((g) => g.code === c) ?? null;
}

/**
 * The default value that applies to a good from Egypt: Egypt's own value when
 * listed, otherwise 'Other countries and territories' (IR 2025/2621, Annex I).
 */
export function defaultFor(good, country = "EG") {
  if (country === "EG" && good.egypt) return { ...good.egypt, table: "Egypt" };
  return { ...good.other, table: "Other countries and territories" };
}

/**
 * Benchmark options (Column B) for a good and year. A good may map to several
 * 8-digit CN codes and production routes; the caller lets the user pick when
 * more than one distinct value remains.
 */
export function benchmarkOptions(good, year, route) {
  const code = good.code;
  const keys =
    code.length >= 8
      ? [code.slice(0, 8)]
      : Object.keys(data.benchmarks).filter((k) => k.startsWith(code));
  const wanted = route ? route.split("/").map((r) => r.trim()) : null;
  const opts = [];
  for (const k of keys) {
    const bm = data.benchmarks[k];
    if (!bm) continue;
    for (const r of bm.routes) {
      if (typeof r.b !== "number") continue;
      // Column B labels combine a route letter and a period: "(C)", "(1)", "(F)(2)".
      // (1) = production years 2026-27, (2) = 2028-30 (IR 2025/2620, Annex).
      const label = r.routeB ?? "";
      const letter = label.match(/\(([A-Z])\)/)?.[0] ?? null;
      const period = label.match(/\((\d)\)/)?.[1] ?? null;
      if (period === "1" && year > 2027) continue;
      if (period === "2" && year < 2028) continue;
      if (wanted && letter && !wanted.includes(letter)) continue;
      opts.push({ cn: k, description: bm.description, route: letter, period, b: r.b });
    }
  }
  return opts;
}

/** Distinct Column B values among options (used to decide if the user must choose). */
export const distinctBenchmarks = (opts) => [...new Set(opts.map((o) => o.b))];

/**
 * Cost on default values. Returns every intermediate number so the UI can
 * show the full working.
 */
export function defaultValueCost({ good, year, tonnes, price, benchmark, country = "EG" }) {
  const dv = defaultFor(good, country);
  const m = markup(good.sector, year);
  const f = cbamFactor(year);
  const k = cscf(year);
  if (typeof dv.total !== "number") return { ok: false, reason: "no_default_value" };
  if (m == null) return { ok: false, reason: "unsupported_sector" };
  if (f == null || k == null) return { ok: false, reason: "year_not_supported" };
  if (typeof benchmark !== "number") return { ok: false, reason: "no_benchmark" };
  const embedded = dv.total * (1 + m);
  const freeAllocation = f * k * benchmark;
  const perTonne = Math.max(0, embedded - freeAllocation);
  const certificates = perTonne * tonnes;
  return {
    ok: true,
    table: dv.table,
    defaultValue: dv.total,
    direct: dv.direct,
    indirect: dv.indirect,
    markup: m,
    embedded,
    cbamFactor: f,
    cscf: k,
    benchmark,
    freeAllocation,
    perTonne,
    certificates,
    cost: certificates * price,
    costPerTonne: perTonne * price,
  };
}

/**
 * What verified data could change: the gap between the marked-up default and
 * the installation's own specific embedded emissions, valued at the price.
 * APPROXIMATE: with actual data the free allocation uses Column A and the
 * precursors' embedded free allocation (IR 2025/2620, Eq. 2–5), which this
 * estimate does not compute.
 */
export function actualDataGap({ embeddedDefault, actualPerTonne, tonnes, price }) {
  const gap = embeddedDefault - actualPerTonne;
  return { gapPerTonne: gap, gapTotal: gap * tonnes, value: gap * tonnes * price };
}
