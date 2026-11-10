// Express routes. index.js starts the server; tests import this file directly.
import express from "express";
import { waitUntil } from "@vercel/functions";
import { handleIncoming, twiml, validSignature } from "./services/whatsapp.js";
import { answer, cleanRequest } from "./services/chat.js";
import { cleanLead, saveLead } from "./services/leads.js";
import { auditReceipt, auditReceiptImage, IMAGE_TYPES, MODEL, MOCK, PAID_TIER, toUserError } from "./services/geminiApi.js";

export const app = express();
export default app; // Vercel runs the exported Express app as a function
const MAX_TEXT = 5000;

// Behind Vercel's proxy the visitor's address is in X-Forwarded-For.
app.set("trust proxy", 1);

/**
 * Small fixed-window rate limit per visitor address. It lives in memory, so on
 * a serverless host each running instance counts separately: a brake against
 * accidents and casual abuse, not a guarantee.
 */
export function rateLimit({ windowMs, max }) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || "unknown";
    const h = hits.get(key);
    if (!h || now - h.start > windowMs) hits.set(key, { start: now, n: 1 });
    else if (++h.n > max) {
      res.set("Retry-After", String(Math.ceil((h.start + windowMs - now) / 1000)));
      return res.status(429).json({ error: "Too many requests from this device. Wait a few minutes and try again." });
    }
    if (hits.size > 5000) for (const [k, v] of hits) if (now - v.start > windowMs) hits.delete(k);
    next();
  };
}
const auditLimit = rateLimit({ windowMs: 10 * 60_000, max: 30 });
app.use(["/api/audit", "/api/audit-image"], auditLimit);
app.use("/api/chat", rateLimit({ windowMs: 10 * 60_000, max: 20 }));
app.use("/api/lead", rateLimit({ windowMs: 60 * 60_000, max: 5 }));

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

// POST /api/whatsapp — Twilio webhook for incoming WhatsApp messages.
// Every request must carry a valid X-Twilio-Signature for the exact webhook URL.
app.post("/api/whatsapp", express.urlencoded({ extended: false, limit: "32kb" }), async (req, res) => {
  const token = process.env.TWILIO_AUTH_TOKEN;
  const url = process.env.WHATSAPP_WEBHOOK_URL;
  if (!token || !url) return res.status(503).type("text/plain").send("WhatsApp intake is not configured.");
  const params = req.body ?? {};
  if (!validSignature(url, params, token, req.get("X-Twilio-Signature"))) return res.status(403).type("text/plain").send("Invalid signature.");
  try {
    const { reply, work } = await handleIncoming(params);
    res.type("text/xml").send(twiml(reply));
    if (work) waitUntil(work()); // keeps the function alive on Vercel after replying
  } catch (err) {
    console.error("[whatsapp] failed:", String(err?.message ?? err).slice(0, 300));
    res.type("text/xml").send(twiml("Daman could not process this message. Try again later."));
  }
});

// POST /api/chat — "Ask Daman". Body: { messages: [{role, text}], lang, mode, context? }
app.post("/api/chat", async (req, res) => {
  let request;
  try {
    request = cleanRequest(req.body);
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message });
  }
  try {
    res.json(await answer(request));
  } catch (err) {
    console.error("[chat] failed:", err?.status ?? "", String(err?.message ?? err).slice(0, 500));
    const safe = toUserError(err);
    res.status(safe.status || 502).json({ error: safe.message });
  }
});

// POST /api/lead — a demo request, only with explicit consent.
app.post("/api/lead", async (req, res) => {
  try {
    await saveLead(cleanLead(req.body));
    res.json({ ok: true });
  } catch (err) {
    if (err.cause) console.error("[lead] failed:", String(err.cause?.message ?? err.cause).slice(0, 300));
    res.status(err.status || 500).json({ error: err.message });
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
