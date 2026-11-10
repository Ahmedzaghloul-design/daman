import { test } from "node:test";
import assert from "node:assert/strict";
import { productEmissions, reportTotals } from "../report.js";

const clinker = { id: "P1", cn: "2523100090", tonnesProduced: 30000, tonnesExported: 8000, processEmissions: 15600 };
const entries = [
  { productId: "P1", status: "verified", energy_type: "Natural Gas", volume: 950000, unit: "m3", date: "2026-01-31" },
  { productId: "P1", status: "verified", energy_type: "Diesel", volume: 15000, unit: "L", date: "2026-02-10" },
  { productId: "P1", status: "verified", energy_type: "Electricity", volume: 1100000, unit: "kWh", date: "2026-01-31" },
  { productId: "P1", status: "pending", energy_type: "Diesel", volume: 99999, unit: "L", date: "2026-03-01" }, // not approved: ignored
  { productId: "P1", status: "verified", energy_type: "Diesel", volume: 99999, unit: "L", date: "2025-12-31" }, // other year: ignored
];

test("direct = fuel CO2e + process; indirect = MWh × factor; specific = total ÷ tonnes", () => {
  const r = productEmissions(clinker, entries, { year: 2026, gridFactor: 0.45 });
  assert.equal(r.ok, true);
  // 950,000 m3 × 2.02 kg = 1,919 t; 15,000 L × 2.68 kg = 40.2 t; + 15,600 t process
  assert.equal(Math.round(r.direct * 10) / 10, 17559.2);
  assert.equal(Math.round(r.indirect * 10) / 10, 495); // 1,100 MWh × 0.45
  assert.equal(Math.round(r.specific * 10000) / 10000, Math.round(((17559.2 + 495) / 30000) * 10000) / 10000);
  assert.equal(r.status, "estimated");
  assert.equal(r.actualShare, 1);
  assert.equal(r.receipts.fuel, 2);
});

test("no process emissions entered: marked incomplete, never presented as complete", () => {
  const r = productEmissions({ ...clinker, processEmissions: null }, entries, { year: 2026, gridFactor: 0.45 });
  assert.equal(r.status, "incomplete");
  assert.ok(r.warnings.includes("process_missing"));
  assert.equal(r.actualShare, null); // never claims a share for an incomplete product
});

test("no receipts: falls back to the default value (Egypt grey clinker 1.24 + 0.03 t/t)", () => {
  const r = productEmissions(clinker, [], { year: 2026, gridFactor: 0.45 });
  assert.equal(r.status, "default");
  assert.equal(Math.round(r.specific * 1000) / 1000, 1.27);
  assert.equal(r.actualShare, 0);
});

test("steel: indirect emissions not counted", () => {
  const billets = { id: "P2", cn: "72071114", tonnesProduced: 1000, tonnesExported: 1000, processEmissions: 0 };
  const r = productEmissions(billets, [{ productId: "P2", status: "verified", energy_type: "Electricity", volume: 500000, unit: "kWh", date: "2026-05-01" }], { year: 2026, gridFactor: 0.45 });
  assert.equal(r.countsIndirect, false);
  assert.equal(r.indirect, 0);
});

test("cement (not clinker) warns that precursors are not traced and is incomplete once it has receipts", () => {
  const cement = { id: "P3", cn: "25232900", tonnesProduced: 100, processEmissions: 0 };
  assert.ok(productEmissions(cement, [], { year: 2026, gridFactor: 0.45 }).warnings.includes("precursors_not_traced"));
  const r = productEmissions(cement, [{ productId: "P3", status: "verified", energy_type: "Diesel", volume: 100, unit: "L", date: "2026-01-01" }], { year: 2026, gridFactor: 0.45 });
  assert.equal(r.status, "incomplete");
  assert.equal(r.actualShare, null);
});

test("totals weight the actual-data share by emissions", () => {
  const a = productEmissions(clinker, entries, { year: 2026, gridFactor: 0.45 });
  const b = productEmissions(clinker, [], { year: 2026, gridFactor: 0.45 });
  const t = reportTotals([a, b]);
  assert.equal(Math.round(t.actualShare * 1000) / 1000, Math.round((a.total / (a.total + b.total)) * 1000) / 1000);
});
