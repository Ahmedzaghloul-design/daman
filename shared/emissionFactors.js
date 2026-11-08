import { normalizeEnergyType, normalizeUnit } from "./normalize.js";

// ILLUSTRATIVE emission factors for prototype calculations only.
// Before any real CBAM submission these must be replaced with values agreed
// with the installation's accredited verifier (EU CBAM implementing rules /
// IPCC 2006 defaults / measured fuel analysis). Electricity in particular
// depends on the grid factor or a PPA, and on the CBAM rules for indirect
// emissions of the specific good.
export const EMISSION_FACTORS = {
  Diesel: { unit: "L", kgCO2ePerUnit: 2.68, source: "IPCC 2006 default (74.1 tCO2/TJ), NCV-derived" },
  "Natural Gas": { unit: "m3", kgCO2ePerUnit: 2.02, source: "IPCC 2006 default (56.1 tCO2/TJ), NCV-derived" },
  Electricity: { unit: "kWh", kgCO2ePerUnit: 0.45, source: "Placeholder Egyptian grid factor — verify" },
  "Heavy Fuel Oil": { unit: "L", kgCO2ePerUnit: 3.1, source: "IPCC 2006 default (77.4 tCO2/TJ), NCV-derived" },
};

/**
 * Returns tonnes CO2e for a record, or null when no factor applies
 * (unknown carrier or unit mismatch). Never guesses.
 */
export function computeCO2e({ energy_type, volume, unit }) {
  const factor = EMISSION_FACTORS[normalizeEnergyType(energy_type)];
  if (!factor || !Number.isFinite(Number(volume))) return null;
  if (normalizeUnit(unit) !== factor.unit) return null;
  return (Number(volume) * factor.kgCO2ePerUnit) / 1000;
}
