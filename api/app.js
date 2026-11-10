// Express routes. index.js starts the server; tests import this file directly.
import express from "express";
import { auditReceipt, MODEL, MOCK, toUserError } from "./services/geminiApi.js";

export const app = express();
const MAX_TEXT = 5000;

app.use(express.json({ limit: "64kb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    model: MOCK ? "mock" : MODEL,
    mock: MOCK,
    keyConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// POST /api/audit
// Body: { rawText, productionTonnes, sector, benchmarks }
// rawText is the unstructured Arabic string produced by the OCR model.
app.post("/api/audit", async (req, res) => {
  const { rawText, productionTonnes, sector, benchmarks } = req.body ?? {};

  if (typeof rawText !== "string" || !rawText.trim()) {
    return res.status(400).json({ error: "rawText is required." });
  }
  if (rawText.length > MAX_TEXT) {
    return res.status(413).json({ error: `rawText exceeds ${MAX_TEXT} characters.` });
  }

  try {
    const result = await auditReceipt({
      rawText,
      productionTonnes: Number(productionTonnes),
      sector: typeof sector === "string" ? sector.slice(0, 40) : "cement",
      benchmarks: sanitizeBenchmarks(benchmarks),
    });
    res.json(result);
  } catch (err) {
    console.error("[audit] failed:", err?.status ?? "", String(err?.message ?? err).slice(0, 500));
    const safe = toUserError(err);
    res.status(safe.status || 502).json({ error: safe.message });
  }
});

// Only accept numeric min/max per known energy type from the client.
function sanitizeBenchmarks(input) {
  if (!input || typeof input !== "object") return undefined;
  const out = {};
  for (const [type, b] of Object.entries(input)) {
    const min = Number(b?.min);
    const max = Number(b?.max);
    if (typeof b?.unit === "string" && Number.isFinite(min) && Number.isFinite(max) && min >= 0 && max > min) {
      out[type] = { unit: b.unit, min, max };
    }
  }
  return Object.keys(out).length ? out : undefined;
}
