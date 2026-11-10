import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AppStateContext } from "./contexts.js";
import { DEFAULT_BENCHMARKS } from "@daman/core/massBalance.js";
import { computeCO2e } from "@daman/core/emissionFactors.js";
import { getApiHealth } from "../services/geminiApi.js";

// Prototype persistence: everything lives in this browser's localStorage.
// A real deployment stores it server-side with accounts (spec §10, item 2).
const KEY = "daman.app.v2";

const DEFAULT_SETTINGS = {
  reviewerName: "",
  year: 2026,
  productionTonnes: 1200, // declared production for a receipt's mass-balance check
  gridFactor: 0.45, // t CO2 / MWh, illustrative
  benchmarks: DEFAULT_BENCHMARKS,
};

// ---------------------------------------------------------------------------
// Demo data: one fictional Egyptian cement installation. Every item is tagged
// demo: true and can be removed in Settings.
// ---------------------------------------------------------------------------
const DEMO_INSTALLATIONS = [
  {
    id: "INS-001",
    demo: true,
    name: "Al-Faraana Cement Works",
    operator: "Al-Faraana Cement Company",
    activity: "Manufacture of cement and clinker",
    city: "Suez",
    address: "Industrial Zone, Ataka",
    country: "EG",
    unlocode: "",
    lat: "29.97",
    lon: "32.55",
    contact: "",
    email: "",
    electricitySource: "grid",
  },
];
const DEMO_PRODUCTS = [
  { id: "PRD-001", demo: true, installationId: "INS-001", cn: "2523100090", tonnesProduced: 30000, tonnesExported: 8000, processEmissions: 15600 },
  { id: "PRD-002", demo: true, installationId: "INS-001", cn: "25232900", tonnesProduced: 37000, tonnesExported: 25000, processEmissions: null },
];

function demoEntry(seq, f) {
  const e = {
    id: `DMN-2026-${String(seq).padStart(4, "0")}`,
    demo: true,
    installationId: "INS-001",
    status: "verified",
    confidence_score: 0.94,
    reviewer: "Demo Reviewer",
    justification: "",
    factory_name: "Al-Faraana Cement Works",
    ...f,
  };
  return { ...e, co2e_t: computeCO2e(e) };
}

export const DEMO_LEDGER = [
  demoEntry(1, { productId: "PRD-001", date: "2026-01-31", energy_type: "Natural Gas", volume: 950000, unit: "m3", reviewedAt: "2026-02-02T09:10:00Z", rawText: "مصنع الفراعنة للأسمنت - غاز طبيعي - ٩٥٠٠٠٠ متر مكعب - يناير ٢٠٢٦" }),
  demoEntry(2, { productId: "PRD-001", date: "2026-01-31", energy_type: "Electricity", volume: 1100000, unit: "kWh", reviewedAt: "2026-02-02T09:20:00Z", rawText: "فاتورة كهرباء - ١١٠٠٠٠٠ كيلو وات ساعة - يناير ٢٠٢٦" }),
  demoEntry(3, { productId: "PRD-001", date: "2026-02-10", energy_type: "Diesel", volume: 15000, unit: "L", reviewedAt: "2026-02-11T08:00:00Z", rawText: "مصنع الفراعنة للأسمنت - ١٥٠٠٠ لتر سولار - التاريخ ١٠ فبراير ٢٠٢٦" }),
  demoEntry(4, {
    productId: "PRD-001",
    date: "2026-02-28",
    energy_type: "Natural Gas",
    volume: 1210000,
    unit: "m3",
    status: "verified_anomaly",
    confidence_score: 0.88,
    justification: "Kiln restart after the February maintenance shutdown; extra gas used for preheating.",
    massBalance: { anomaly: true, deterministic: { evaluated: true, intensity: 125.83, intensityUnit: "m3/t", expectedMin: 80, expectedMax: 110, deviationPct: 14.39 } },
    reviewedAt: "2026-03-02T10:40:00Z",
    rawText: "مصنع الفراعنة للأسمنت - غاز طبيعي - ١٢١٠٠٠٠ متر مكعب - فبراير ٢٠٢٦",
  }),
  demoEntry(5, { productId: "PRD-001", date: "2026-02-28", energy_type: "Electricity", volume: 1050000, unit: "kWh", reviewedAt: "2026-03-02T10:50:00Z", rawText: "فاتورة كهرباء - ١٠٥٠٠٠٠ كيلو وات ساعة - فبراير ٢٠٢٦" }),
  demoEntry(6, { productId: "PRD-002", date: "2026-02-28", energy_type: "Electricity", volume: 1500000, unit: "kWh", reviewedAt: "2026-03-03T09:00:00Z", rawText: "فاتورة كهرباء طحن الأسمنت - ١٥٠٠٠٠٠ كيلو وات ساعة - فبراير ٢٠٢٦" }),
  demoEntry(7, { productId: "PRD-002", date: "2026-03-05", energy_type: "Diesel", volume: 8000, unit: "L", reviewedAt: "2026-03-06T09:00:00Z", rawText: "مصنع الفراعنة للأسمنت - ٨٠٠٠ لتر سولار - التاريخ ٥ مارس ٢٠٢٦" }),
];

const DEMO_STATE = { installations: DEMO_INSTALLATIONS, products: DEMO_PRODUCTS, ledger: DEMO_LEDGER, settings: DEFAULT_SETTINGS };

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEMO_STATE;
    const s = JSON.parse(raw);
    return { ...DEMO_STATE, ...s, settings: { ...DEFAULT_SETTINGS, ...s.settings } };
  } catch {
    return DEMO_STATE;
  }
}

const nextId = (items, prefix) => `${prefix}-${String(items.reduce((m, x) => Math.max(m, Number(String(x.id).split("-").pop()) || 0), 0) + 1).padStart(3, "0")}`;

export function AppStateProvider({ children }) {
  const [state, setState] = useState(load);
  const [apiHealth, setApiHealth] = useState({ ok: null });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable: keep working in memory */
    }
  }, [state]);
  useEffect(() => {
    getApiHealth().then(setApiHealth);
  }, []);

  const update = useCallback((key, fn) => setState((s) => ({ ...s, [key]: fn(s[key]) })), []);

  const actions = useMemo(
    () => ({
      updateSettings: (patch) => update("settings", (s) => ({ ...s, ...patch })),
      saveInstallation: (inst) =>
        update("installations", (list) => (inst.id ? list.map((x) => (x.id === inst.id ? { ...x, ...inst } : x)) : [...list, { ...inst, id: nextId(list, "INS") }])),
      deleteInstallation: (id) => update("installations", (list) => list.filter((x) => x.id !== id)),
      saveProduct: (p) =>
        update("products", (list) => (p.id ? list.map((x) => (x.id === p.id ? { ...x, ...p } : x)) : [...list, { ...p, id: nextId(list, "PRD") }])),
      deleteProduct: (id) => update("products", (list) => list.filter((x) => x.id !== id)),
      clearDemo: () =>
        setState((s) => ({
          ...s,
          installations: s.installations.filter((x) => !x.demo),
          products: s.products.filter((x) => !x.demo),
          ledger: s.ledger.filter((x) => !x.demo),
        })),
      resetDemo: () => setState((s) => ({ ...DEMO_STATE, settings: s.settings })),
    }),
    [update],
  );

  // Sequential, never-reused entry IDs: DMN-<year>-<seq>.
  const addEntry = useCallback(
    (entry) => {
      const year = (entry.date || "").slice(0, 4) || String(new Date().getFullYear());
      const seq = state.ledger.reduce((m, e) => Math.max(m, Number(e.id.split("-").pop()) || 0), 0) + 1;
      const id = `DMN-${year}-${String(seq).padStart(4, "0")}`;
      setState((s) => ({ ...s, ledger: [...s.ledger, { ...entry, id }] }));
      return id;
    },
    [state.ledger],
  );

  const value = useMemo(() => ({ ...state, ...actions, addEntry, apiHealth }), [state, actions, addEntry, apiHealth]);
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
