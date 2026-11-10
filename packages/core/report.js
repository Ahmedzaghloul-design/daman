// Per-product emissions for the program's report table, following the EU data
// model (CBAM Declarant Portal manual v1.81 §1.9, see docs/sources):
//   direct   = fuel combustion (from approved receipts) + process emissions (entered by the plant)
//   indirect = electricity MWh × emission factor (only counted for cement and fertilisers)
//   specific embedded emissions = (direct + indirect) ÷ tonnes produced
//
// PROTOTYPE LIMITS, shown to the user: precursors (e.g. clinker inside cement)
// are not yet traced; when process emissions are not entered the product is
// marked "incomplete" instead of showing a misleadingly low number.
import { computeCO2e } from "./emissionFactors.js";
import { defaultFor, findGood } from "./cbamCost.js";

const APPROVED = new Set(["verified", "verified_anomaly"]);
// Indirect emissions count toward CBAM obligations only for these sectors;
// for iron and steel, aluminium and hydrogen the default values list them as N/A.
const INDIRECT_SECTORS = new Set(["cement", "fertilisers"]);

const sum = (xs) => xs.reduce((a, b) => a + b, 0);

/** Approved ledger entries for a product within a year. */
export function entriesFor(product, entries, year) {
  return entries.filter((e) => e.productId === product.id && APPROVED.has(e.status) && String(e.date ?? "").startsWith(String(year)));
}

/**
 * @param product { id, cn, tonnesProduced, tonnesExported, processEmissions (t CO2e or null) }
 * @param entries ledger entries (approved ones are used)
 * @param opts    { year, gridFactor (t CO2 per MWh) }
 */
export function productEmissions(product, entries, { year, gridFactor }) {
  const good = findGood(product.cn);
  if (!good) return { ok: false, reason: "unknown_cn" };
  const dv = defaultFor(good);
  const tonnes = Number(product.tonnesProduced);
  if (!(tonnes > 0)) return { ok: false, reason: "no_production", good, dv };

  const mine = entriesFor(product, entries, year);
  const fuel = mine.filter((e) => e.energy_type !== "Electricity");
  const elec = mine.filter((e) => e.energy_type === "Electricity" && String(e.unit).toLowerCase() === "kwh");
  const fuelT = sum(fuel.map((e) => computeCO2e(e) ?? 0));
  const mwh = sum(elec.map((e) => Number(e.volume) || 0)) / 1000;
  const hasProcess = product.processEmissions !== null && product.processEmissions !== undefined && product.processEmissions !== "";
  const processT = hasProcess ? Number(product.processEmissions) : 0;
  const countsIndirect = INDIRECT_SECTORS.has(good.sector);

  // Direct: actual when the plant has approved fuel receipts.
  const directActual = fuel.length > 0;
  const direct = directActual ? fuelT + processT : (typeof dv.direct === "number" ? dv.direct * tonnes : 0);
  // Indirect: actual when there are approved electricity receipts.
  const indirectActual = countsIndirect && elec.length > 0;
  const indirect = !countsIndirect ? 0 : indirectActual ? mwh * Number(gridFactor) : (typeof dv.indirect === "number" ? dv.indirect * tonnes : 0);
  const total = direct + indirect;

  const actualPart = (directActual ? direct : 0) + (indirectActual ? indirect : 0);
  const actualShare = total > 0 ? actualPart / total : 0;
  const warnings = [];
  if (directActual && !hasProcess) warnings.push("process_missing");
  if (good.sector === "cement" && product.cn !== "2523100090" && product.cn !== "2523100010") warnings.push("precursors_not_traced");

  // Incomplete (missing process or precursor emissions): the true total is
  // unknown, so no actual-data share is claimed for it.
  const incomplete = directActual && (warnings.includes("process_missing") || warnings.includes("precursors_not_traced"));
  const status = !directActual && !indirectActual ? "default" : incomplete ? "incomplete" : "estimated";
  const specific = total / tonnes;
  return {
    ok: true,
    good,
    dv,
    status,
    warnings,
    receipts: { fuel: fuel.length, electricity: elec.length },
    direct,
    directActual,
    fuelT,
    processT: hasProcess ? processT : null,
    indirect,
    indirectActual,
    countsIndirect,
    mwh,
    total,
    specific,
    specificDirect: direct / tonnes,
    actualShare: incomplete ? null : actualShare,
    exportedEmbedded: specific * (Number(product.tonnesExported) || 0),
  };
}

/** Totals across products, for the overview. */
export function reportTotals(rows) {
  const ok = rows.filter((r) => r.ok);
  const total = sum(ok.map((r) => r.total));
  const actual = sum(ok.map((r) => r.total * (r.actualShare ?? 0))); // incomplete products count as not backed
  return { products: ok.length, total, actualShare: total > 0 ? actual / total : 0, exportedEmbedded: sum(ok.map((r) => r.exportedEmbedded)) };
}
