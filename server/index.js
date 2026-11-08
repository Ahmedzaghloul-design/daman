import express from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditReceipt, MODEL, MOCK, toUserError } from "./services/geminiApi.js";

const app = express();
// API_PORT wins in development (tools often set PORT for the web server);
// hosting platforms that only set PORT still work in production.
const PORT = Number(process.env.API_PORT || process.env.PORT) || 8787;
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

// In production (`npm run build && npm start`) the same server hosts the React app.
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(PORT, () => {
  console.log(`Daman API listening on http://localhost:${PORT}`);
  console.log(MOCK ? "Gemini: MOCK mode" : `Gemini model: ${MODEL}`);
  if (!MOCK && !process.env.GEMINI_API_KEY) {
    console.warn("Warning: GEMINI_API_KEY is not set. /api/audit will return 503 until it is.");
  }
});
