import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppStateContext } from "./contexts.js";
import { DEFAULT_BENCHMARKS } from "@daman/core/massBalance.js";
import { computeCO2e } from "@daman/core/emissionFactors.js";
import { getApiHealth } from "../services/geminiApi.js";
import { must, supabase } from "../lib/supabase.js";
import { permissions, useAuth } from "./Auth.jsx";

// Two modes with the same interface for every page:
//  - Demo on this device: everything lives in this browser's localStorage.
//  - Cloud workspace (signed in): data lives in Supabase; the database's
//    row-level security decides what each role may read or write.
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
  const auth = useAuth();
  const ws = auth.workspace;
  const can = useMemo(() => permissions(auth.role), [auth.role]);
  const [local, setLocal] = useState(load);
  const [cloud, setCloud] = useState(null); // { wsId, installations, products, ledger, settings }
  const [pending, setPending] = useState([]);
  const [cloudError, setCloudError] = useState(null);
  const [apiHealth, setApiHealth] = useState({ ok: null });
  const settingsTimer = useRef(null);
  const cloudRef = useRef(null);
  cloudRef.current = cloud;

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(local));
    } catch {
      /* storage unavailable: keep working in memory */
    }
  }, [local]);
  useEffect(() => {
    getApiHealth().then(setApiHealth);
  }, []);

  const fail = useCallback((err) => setCloudError(err?.message || String(err)), []);

  const loadPending = useCallback(async () => {
    if (!ws) return setPending([]);
    const rows = must(await supabase.from("pending_receipts").select("id, uploader_email, data, created_at").eq("workspace_id", ws.id).order("created_at"));
    setPending(rows);
  }, [ws]);

  const loadCloud = useCallback(async () => {
    if (!ws) return setCloud(null);
    setCloudError(null);
    const seeLedger = permissions(ws.role).seeLedger;
    const q = (table) => supabase.from(table).select("data").eq("workspace_id", ws.id);
    const [w, inst, prod, led] = await Promise.all([
      supabase.from("workspaces").select("settings").eq("id", ws.id).single(),
      q("installations"),
      q("products"),
      seeLedger ? q("ledger_entries").order("created_at") : Promise.resolve({ data: [] }),
    ]);
    setCloud({
      wsId: ws.id,
      settings: { ...DEFAULT_SETTINGS, ...must(w).settings },
      installations: must(inst).map((r) => r.data),
      products: must(prod).map((r) => r.data),
      ledger: must(led).map((r) => r.data),
    });
    await loadPending();
  }, [ws, loadPending]);

  useEffect(() => {
    loadCloud().catch(fail);
  }, [loadCloud, fail]);

  const inCloud = Boolean(ws);
  const state = inCloud
    ? cloud && cloud.wsId === ws.id
      ? { ...cloud, settings: { ...cloud.settings, reviewerName: auth.email } }
      : { installations: [], products: [], ledger: [], settings: { ...DEFAULT_SETTINGS, reviewerName: auth.email }, loading: true }
    : local;

  const setCloudKey = useCallback((key, fn) => setCloud((c) => (c ? { ...c, [key]: fn(c[key]) } : c)), []);
  const updateLocal = useCallback((key, fn) => setLocal((s) => ({ ...s, [key]: fn(s[key]) })), []);

  // Write a registry item (installation/product) locally and, in cloud mode, to Supabase.
  const saveItem = useCallback(
    (key, table, prefix, item) => {
      const apply = (list) => {
        const saved = item.id ? { ...list.find((x) => x.id === item.id), ...item } : { ...item, id: nextId(list, prefix) };
        return { saved, next: item.id ? list.map((x) => (x.id === item.id ? saved : x)) : [...list, saved] };
      };
      if (!inCloud) return updateLocal(key, (list) => apply(list).next);
      const { saved, next } = apply(state[key]);
      setCloudKey(key, () => next);
      supabase
        .from(table)
        .upsert({ workspace_id: ws.id, id: saved.id, data: saved, updated_at: new Date().toISOString() })
        .then((r) => (r.error ? (fail(r.error), loadCloud()) : null));
    },
    [inCloud, ws, state, updateLocal, setCloudKey, fail, loadCloud],
  );
  const deleteItem = useCallback(
    (key, table, id) => {
      if (!inCloud) return updateLocal(key, (list) => list.filter((x) => x.id !== id));
      setCloudKey(key, (list) => list.filter((x) => x.id !== id));
      supabase
        .from(table)
        .delete()
        .eq("workspace_id", ws.id)
        .eq("id", id)
        .then((r) => (r.error ? (fail(r.error), loadCloud()) : null));
    },
    [inCloud, ws, updateLocal, setCloudKey, fail, loadCloud],
  );

  const updateSettings = useCallback(
    (patch) => {
      if (!inCloud) return updateLocal("settings", (s) => ({ ...s, ...patch }));
      setCloudKey("settings", (s) => ({ ...s, ...patch }));
      if (!can.edit) return; // e.g. an uploader's production figure stays on their device
      clearTimeout(settingsTimer.current);
      settingsTimer.current = setTimeout(() => {
        const c = cloudRef.current;
        if (!c) return;
        // The reviewer's name is never stored: the database stamps the signed-in email.
        const { reviewerName: _drop, ...settings } = c.settings;
        supabase.from("workspaces").update({ settings }).eq("id", c.wsId).then((r) => r.error && fail(r.error));
      }, 700);
    },
    [inCloud, can.edit, updateLocal, setCloudKey, fail],
  );

  // Sequential, never-reused entry IDs: DMN-<year>-<seq>. In cloud mode the
  // database assigns the ID and stamps the signed-in reviewer. Returns a Promise.
  const addEntry = useCallback(
    async (entry) => {
      if (inCloud) {
        const id = must(await supabase.rpc("add_entry", { p_ws: ws.id, p_entry: entry }));
        const row = must(await supabase.from("ledger_entries").select("data").eq("workspace_id", ws.id).eq("id", id).single());
        setCloudKey("ledger", (list) => [...list, row.data]);
        return id;
      }
      const year = (entry.date || "").slice(0, 4) || String(new Date().getFullYear());
      const seq = local.ledger.reduce((m, e) => Math.max(m, Number(e.id.split("-").pop()) || 0), 0) + 1;
      const id = `DMN-${year}-${String(seq).padStart(4, "0")}`;
      setLocal((s) => ({ ...s, ledger: [...s.ledger, { ...entry, id }] }));
      return id;
    },
    [inCloud, ws, local.ledger, setCloudKey],
  );

  const actions = useMemo(
    () => ({
      updateSettings,
      saveInstallation: (inst) => saveItem("installations", "installations", "INS", inst),
      deleteInstallation: (id) => deleteItem("installations", "installations", id),
      saveProduct: (p) => saveItem("products", "products", "PRD", p),
      deleteProduct: (id) => deleteItem("products", "products", id),
      clearDemo: () =>
        setLocal((s) => ({
          ...s,
          installations: s.installations.filter((x) => !x.demo),
          products: s.products.filter((x) => !x.demo),
          ledger: s.ledger.filter((x) => !x.demo),
        })),
      resetDemo: () => setLocal((s) => ({ ...DEMO_STATE, settings: s.settings })),
      // Uploaders: a checked receipt goes to the team's review queue.
      sendForReview: async (data) => {
        must(await supabase.from("pending_receipts").insert({ workspace_id: ws.id, uploader_email: auth.email, data }));
        await loadPending();
      },
      removePending: async (id) => {
        must(await supabase.from("pending_receipts").delete().eq("id", id));
        await loadPending();
      },
      reloadCloud: () => loadCloud().catch(fail),
      dismissCloudError: () => setCloudError(null),
    }),
    [updateSettings, saveItem, deleteItem, ws, auth.email, loadPending, loadCloud, fail],
  );

  const value = useMemo(
    () => ({ ...state, ...actions, addEntry, apiHealth, pending, cloudError, inCloud, can, role: auth.role, workspace: ws }),
    [state, actions, addEntry, apiHealth, pending, cloudError, inCloud, can, auth.role, ws],
  );
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
