import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_BENCHMARKS } from "@daman/core/massBalance.js";
import { computeCO2e } from "@daman/core/emissionFactors.js";
import { getApiHealth } from "../services/geminiApi.js";

// Prototype persistence: the ledger lives in this browser's localStorage.
// A real deployment must store it server-side (see README, Step 7).
const LEDGER_KEY = "daman.ledger.v1";
const SETTINGS_KEY = "daman.settings.v1";

const DEFAULT_SETTINGS = {
  factoryName: "Al-Faraana Cement Factory",
  sector: "cement",
  reviewerName: "",
  productionTonnes: 1200,
  benchmarks: DEFAULT_BENCHMARKS,
};

function demoEntry(seq, fields) {
  return {
    id: `DMN-2026-${String(seq).padStart(4, "0")}`,
    demo: true,
    confidence_score: 0.95,
    reviewer: "Demo Reviewer",
    justification: "",
    ...fields,
    co2e_t: computeCO2e(fields),
  };
}

export const DEMO_LEDGER = [
  demoEntry(1, {
    date: "2026-01-12",
    factory_name: "Al-Faraana Cement Factory",
    energy_type: "Diesel",
    volume: 4200,
    unit: "L",
    status: "verified",
    reviewedAt: "2026-01-13T09:20:00Z",
  }),
  demoEntry(2, {
    date: "2026-02-03",
    factory_name: "Al-Faraana Cement Factory",
    energy_type: "Electricity",
    volume: 118500,
    unit: "kWh",
    status: "verified",
    reviewedAt: "2026-02-04T11:05:00Z",
  }),
  demoEntry(3, {
    date: "2026-02-21",
    factory_name: "Al-Faraana Cement Factory",
    energy_type: "Natural Gas",
    volume: 151000,
    unit: "m3",
    status: "verified_anomaly",
    confidence_score: 0.88,
    justification: "Kiln restart after maintenance shutdown; additional gas used for preheating.",
    massBalance: { anomaly: true, deterministic: { evaluated: true, intensity: 125.83, intensityUnit: "m3/t", expectedMin: 80, expectedMax: 110, deviationPct: 14.39 } },
    reviewedAt: "2026-02-22T08:40:00Z",
  }),
];

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: state still works in memory */
  }
}

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [ledger, setLedger] = useState(() => load(LEDGER_KEY, DEMO_LEDGER));
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...load(SETTINGS_KEY, {}) }));
  const [apiHealth, setApiHealth] = useState({ ok: null });

  useEffect(() => save(LEDGER_KEY, ledger), [ledger]);
  useEffect(() => save(SETTINGS_KEY, settings), [settings]);
  useEffect(() => {
    getApiHealth().then(setApiHealth);
  }, []);

  // Sequential, never-reused entry IDs (DMN-<year>-<seq>), as an auditor expects.
  const addEntry = useCallback(
    (entry) => {
      const year = (entry.date || "").slice(0, 4) || String(new Date().getFullYear());
      const nextSeq = ledger.reduce((max, e) => Math.max(max, Number(e.id.split("-").pop()) || 0), 0) + 1;
      const id = `DMN-${year}-${String(nextSeq).padStart(4, "0")}`;
      setLedger((prev) => [...prev, { ...entry, id }]);
      return id;
    },
    [ledger],
  );

  const updateSettings = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), []);
  const resetLedger = useCallback(() => setLedger(DEMO_LEDGER), []);

  const value = useMemo(
    () => ({ ledger, addEntry, resetLedger, settings, updateSettings, apiHealth }),
    [ledger, addEntry, resetLedger, settings, updateSettings, apiHealth],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
