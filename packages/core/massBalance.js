import { normalizeEnergyType, normalizeUnit } from "./normalize.js";

// Illustrative per-tonne benchmarks for a cement installation. They exist so
// the prototype has something to compare against. Each customer must replace
// them with plant-specific baselines (historical data / verifier-agreed).
export const DEFAULT_BENCHMARKS = {
  Diesel: { unit: "L", min: 1, max: 6 },
  Electricity: { unit: "kWh", min: 90, max: 130 },
  "Natural Gas": { unit: "m3", min: 80, max: 110 },
};

/**
 * Deterministic mass-balance check: energy input per tonne of declared output.
 *
 * The NUMBERS used in the anomaly decision come from this function, not from
 * the LLM. Gemini is asked to reason about the result (see
 * server/services/geminiApi.js), but a verifier must be able to reproduce the
 * calculation by hand, so the arithmetic stays in plain code.
 */
export function checkMassBalance({ receipt, productionTonnes, benchmarks = DEFAULT_BENCHMARKS }) {
  const energyType = normalizeEnergyType(receipt?.energy_type);
  const b = benchmarks?.[energyType];
  const production = Number(productionTonnes);
  const volume = Number(receipt?.volume);

  if (!b) return { evaluated: false, reason: "no_benchmark", energyType };
  if (!(production > 0)) return { evaluated: false, reason: "no_production", energyType };
  if (!Number.isFinite(volume)) return { evaluated: false, reason: "no_volume", energyType };
  if (normalizeUnit(receipt.unit) !== b.unit) {
    return { evaluated: false, reason: "unit_mismatch", energyType, expectedUnit: b.unit };
  }

  const intensity = volume / production;
  const outOfRange = intensity < b.min || intensity > b.max;
  const reference = intensity > b.max ? b.max : b.min;
  const deviationPct = outOfRange ? ((intensity - reference) / reference) * 100 : 0;

  return {
    evaluated: true,
    energyType,
    intensity,
    intensityUnit: `${b.unit}/t`,
    expectedMin: b.min,
    expectedMax: b.max,
    productionTonnes: production,
    outOfRange,
    deviationPct,
  };
}
