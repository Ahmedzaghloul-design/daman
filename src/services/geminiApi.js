// ---------------------------------------------------------------------------
// Browser-side client for the Gemini audit.
//
// Data handoff:
//   1. Dashboard gets `rawText` from ocrApi.extractArabicText(file).
//   2. auditReceipt(rawText, ctx) POSTs it to /api/audit (proxied by Vite to
//      the Express server, so the Gemini key never reaches the browser).
//   3. server/services/geminiApi.js calls ai.models.generateContent() with a
//      strict responseSchema, validates the JSON, runs the mass-balance check,
//      and returns { receipt, reviewReasons, massBalance, model }.
//   4. Dashboard shows that result in the HITL review screen. Nothing reaches
//      the ledger until a person approves it.
// ---------------------------------------------------------------------------

/**
 * @param {string} rawText  Unmodified OCR output.
 * @param {{ productionTonnes: number, sector: string, benchmarks: object }} ctx
 */
export async function auditReceipt(rawText, { productionTonnes, sector, benchmarks }) {
  const res = await fetch("/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rawText, productionTonnes, sector, benchmarks }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Audit request failed (${res.status}).`);
  return body;
}

export async function getApiHealth() {
  try {
    const res = await fetch("/api/health");
    if (!res.ok) return { ok: false };
    return await res.json();
  } catch {
    return { ok: false };
  }
}
