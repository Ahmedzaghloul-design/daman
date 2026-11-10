import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeDigits, normalizeEnergyType, normalizeUnit } from "../normalize.js";
import { computeCO2e } from "../emissionFactors.js";
import { checkMassBalance, DEFAULT_BENCHMARKS } from "../massBalance.js";

test("Arabic-Indic digits become Western digits", () => {
  assert.equal(normalizeDigits("١٥٠٠٠ لتر"), "15000 لتر");
  assert.equal(normalizeDigits("١٥ مارس ٢٠٢٦"), "15 مارس 2026");
  assert.equal(normalizeDigits("١٢٫٥"), "12.5");
});

test("units and energy types normalise from Arabic and English", () => {
  assert.equal(normalizeUnit("لتر"), "L");
  assert.equal(normalizeUnit("Litres"), "L");
  assert.equal(normalizeUnit("كيلو وات ساعة"), "kWh");
  assert.equal(normalizeEnergyType("سولار"), "Diesel");
  assert.equal(normalizeEnergyType("electricity"), "Electricity");
});

test("CO2e: 15,000 L diesel × 2.68 kg/L = 40.2 t", () => {
  assert.equal(computeCO2e({ energy_type: "Diesel", volume: 15000, unit: "L" }), 40.2);
});

test("CO2e returns null rather than guessing on a unit mismatch", () => {
  assert.equal(computeCO2e({ energy_type: "Diesel", volume: 15000, unit: "kWh" }), null);
  assert.equal(computeCO2e({ energy_type: "Unknown", volume: 10, unit: "L" }), null);
});

test("mass balance flags 12.5 L/t against a 1–6 L/t benchmark (+108.3%)", () => {
  const r = checkMassBalance({
    receipt: { energy_type: "Diesel", volume: 15000, unit: "L" },
    productionTonnes: 1200,
    benchmarks: DEFAULT_BENCHMARKS,
  });
  assert.equal(r.evaluated, true);
  assert.equal(r.intensity, 12.5);
  assert.equal(r.outOfRange, true);
  assert.equal(Number(r.deviationPct.toFixed(1)), 108.3);
});

test("mass balance passes an in-range record", () => {
  const r = checkMassBalance({
    receipt: { energy_type: "Electricity", volume: 142000, unit: "kWh" },
    productionTonnes: 1200,
  });
  assert.equal(r.outOfRange, false);
  assert.equal(r.deviationPct, 0);
});

test("mass balance refuses to evaluate without production or with wrong unit", () => {
  const receipt = { energy_type: "Diesel", volume: 100, unit: "L" };
  assert.equal(checkMassBalance({ receipt, productionTonnes: 0 }).reason, "no_production");
  assert.equal(checkMassBalance({ receipt: { ...receipt, unit: "m3" }, productionTonnes: 10 }).reason, "unit_mismatch");
});
