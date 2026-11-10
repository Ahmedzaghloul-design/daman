// Checks the cost formula against independently published worked examples
// (cbamguide.com, "CBAM default values" and "free allocation" articles,
// as of 26 Oct 2026) and against the official EU data files.
import { test } from "node:test";
import assert from "node:assert/strict";
import { benchmarkOptions, cbamFactor, CBAM_DATA, cscf, defaultValueCost, distinctBenchmarks, findGood, markup } from "../cbamCost.js";

const r2 = (n) => Math.round(n * 100) / 100;
const r4 = (n) => Math.round(n * 10000) / 10000;
// Türkiye semi-finished steel, CN 7207 11 14: default 2.310 (official file), benchmark Column B route (C) 1.364.
const turkeySteel = { code: "72071114", sector: "steel", egypt: null, other: { total: 2.31, direct: 2.31, indirect: "na", route: "(C)" } };

test("official data: Türkiye value is not ours, but the benchmark for 7207 11 14 route (C) is 1.364", () => {
  const opts = benchmarkOptions(findGood("7207 11 14"), 2026, "(C)");
  assert.deepEqual(distinctBenchmarks(opts), [1.364]);
});

test("factors: CBAM factor and CSCF by year, mark-ups by sector", () => {
  assert.equal(cbamFactor(2026), 0.975);
  assert.equal(cbamFactor(2030), 0.515);
  assert.equal(cbamFactor(2034), 0);
  assert.equal(cscf(2026), 1);
  assert.equal(cscf(2031), null); // not yet determined
  assert.equal(markup("steel", 2026), 0.1);
  assert.equal(markup("cement", 2027), 0.2);
  assert.equal(markup("aluminium", 2030), 0.3);
  assert.equal(markup("fertilisers", 2028), 0.01);
});

test("worked example 2026: 2.310 × 1.10 − 0.975 × 1.364 = 1.2111 certificates/t, €99.70/t at €82.32", () => {
  const r = defaultValueCost({ good: turkeySteel, year: 2026, tonnes: 1, price: 82.32, benchmark: 1.364, country: "TR" });
  assert.equal(r4(r.embedded), 2.541);
  assert.equal(r4(r.freeAllocation), 1.3299);
  assert.equal(r4(r.perTonne), 1.2111);
  assert.equal(r2(r.costPerTonne), 99.7);
});

test("worked examples 2029 and 2030: €160.19/t and €189.38/t at the same price", () => {
  assert.equal(r2(defaultValueCost({ good: turkeySteel, year: 2029, tonnes: 1, price: 82.32, benchmark: 1.364, country: "TR" }).costPerTonne), 160.19);
  assert.equal(r2(defaultValueCost({ good: turkeySteel, year: 2030, tonnes: 1, price: 82.32, benchmark: 1.364, country: "TR" }).costPerTonne), 189.38);
});

test("worked example China slab 2028: 3.169 × 1.30 − 0.90 × 1.364 = 2.892 t/t, €238.08/t (as published)", () => {
  const china = { ...turkeySteel, other: { ...turkeySteel.other, total: 3.169 } };
  const r = defaultValueCost({ good: china, year: 2028, tonnes: 1, price: 82.32, benchmark: 1.364, country: "CN" });
  assert.equal(Math.round(r.perTonne * 1000) / 1000, 2.892);
  assert.equal(r2(r.costPerTonne), 238.08);
});

test("Egypt: country value used when listed, 'Other countries' otherwise", () => {
  const clinker = findGood("2523 10 00 90");
  assert.equal(defaultValueCost({ good: clinker, year: 2026, tonnes: 1, price: 82.32, benchmark: 0.666 }).table, "Egypt");
  const billet = findGood("7207 11 14");
  const r = defaultValueCost({ good: billet, year: 2026, tonnes: 1, price: 82.32, benchmark: 1.364 });
  assert.equal(r.table, "Other countries and territories");
  assert.equal(r.defaultValue, 3.996);
});

test("never returns a number it cannot back: unsupported years and missing benchmark", () => {
  const clinker = findGood("2523 10 00 90");
  assert.equal(defaultValueCost({ good: clinker, year: 2031, tonnes: 1, price: 80, benchmark: 0.666 }).reason, "year_not_supported");
  assert.equal(defaultValueCost({ good: clinker, year: 2026, tonnes: 1, price: 80 }).reason, "no_benchmark");
});

test("time-dependent benchmark rows (1)/(2) follow the year (aluminous cement)", () => {
  const g = { code: "25233000", sector: "cement" };
  assert.deepEqual(distinctBenchmarks(benchmarkOptions(g, 2026)), [0.717]);
  assert.deepEqual(distinctBenchmarks(benchmarkOptions(g, 2028)), [0.686]);
});

test("data file records its sources", () => {
  assert.match(CBAM_DATA.meta.sources.defaultValues.version, /2026\/1740/);
  assert.equal(CBAM_DATA.prices2026.Q3.eur, 82.32);
});

// Values quoted from the Annex table of IR (EU) 2025/2620 on EUR-Lex (checked 10 Nov 2026).
test("benchmarks match the legal text, including 2028-30 '(2)' rows", () => {
  const b = (code, year, route) => distinctBenchmarks(benchmarkOptions({ code }, year, route));
  assert.deepEqual(b("72249002", 2026, "(F)"), [1.577]);
  assert.deepEqual(b("72249002", 2028, "(F)"), [1.409]);
  assert.deepEqual(b("72249002", 2028, "(J)"), [0.918]);
  assert.deepEqual(b("72131000".slice(0, 8), 2026, "(C)").length, 1);
  assert.deepEqual(b("25232900", 2026), [0.666]);
  assert.deepEqual(b("31021019", 2026), [0.902]);
  assert.deepEqual(b("72021180", 2027), [1.361]);
  assert.deepEqual(b("72021180", 2029), [1.277]);
});
