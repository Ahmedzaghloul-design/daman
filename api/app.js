// Express routes. index.js starts the server; tests import this file directly.
import express from "express";
import { auditReceipt, auditReceiptImage, IMAGE_TYPES, MODEL, MOCK, PAID_TIER, toUserError } from "./services/geminiApi.js";

export const app = express();
const MAX_TEXT = 5000;

// Photos need a larger body (the app shrinks them to about 1 MB first; the
// cap stays under Vercel's 4.5 MB request limit).
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
app.use("/api/audit-image", express.json({ limit: "4.4mb" }));
app.use(express.json({ limit: "64kb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    model: MOCK ? "mock" : MODEL,
    mock: MOCK,
    keyConfigured: Boolean(process.env.GEMINI_API_KEY),
    realDataAllowed: MOCK || PAID_TIER,
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
    console.error("[audit] failed:", err?.status ?? "", String(err?.message ?? err).slice(0, 500), err?.cause ? `cause: ${String(err.cause?.message ?? err.cause).slice(0, 300)}` : "");
    const safe = toUserError(err);
    res.status(safe.status || 502).json({ error: safe.message });
  }
});

// POST /api/audit-image
// Body: { image (base64, no data: prefix), mimeType, testData, productionTonnes, sector, benchmarks }
app.post("/api/audit-image", async (req, res) => {
  const { image, mimeType, testData, productionTonnes, sector, benchmarks } = req.body ?? {};
  if (typeof image !== "string" || !image || !/^[A-Za-z0-9+/=]+$/.test(image)) {
    return res.status(400).json({ error: "image (base64) is required." });
  }
  if (!IMAGE_TYPES.includes(mimeType)) {
    return res.status(415).json({ error: "Unsupported file type. Use JPEG, PNG, WebP, HEIC or PDF." });
  }
  if (Math.floor((image.length * 3) / 4) > MAX_IMAGE_BYTES) {
    return res.status(413).json({ error: "File is larger than 3 MB." });
  }
  // Guard against sending confidential data to the unpaid tier by accident.
  if (realDataBlocked({ mock: MOCK, paid: PAID_TIER, testData })) {
    return res.status(403).json({ error: "Real receipts are blocked until Gemini billing is on. Tick 'test data' to send a test photo.", code: "real_data_blocked" });
  }
  try {
    const result = await auditReceiptImage({
      data: image,
      mimeType,
      productionTonnes: Number(productionTonnes),
      sector: typeof sector === "string" ? sector.slice(0, 40) : "cement",
      benchmarks: sanitizeBenchmarks(benchmarks),
    });
    res.json(result);
  } catch (err) {
    console.error("[audit-image] failed:", err?.status ?? "", String(err?.message ?? err).slice(0, 500), err?.cause ? `cause: ${String(err.cause?.message ?? err.cause).slice(0, 300)}` : "");
    if (process.env.NODE_ENV !== "production") console.error(err);
    const safe = toUserError(err);
    res.status(safe.status || 502).json({ error: safe.message });
  }
});

/** Real photos only reach Gemini on the paid tier (or in mock mode, which calls no model). */
export const realDataBlocked = ({ mock, paid, testData }) => !mock && !paid && testData !== true;

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
