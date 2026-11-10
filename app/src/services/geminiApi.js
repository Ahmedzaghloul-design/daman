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

/**
 * Photo -> Gemini vision. The photo is shrunk in the browser first (longest
 * side 2000 px, JPEG) so it uploads quickly on a phone and stays under the
 * API's 3 MB cap. PDFs and HEIC that the browser cannot draw go as they are.
 * @param {File} file
 * @param {{ testData: boolean, productionTonnes: number, sector: string, benchmarks: object }} ctx
 */
export async function auditReceiptImage(file, { testData, productionTonnes, sector, benchmarks }) {
  const { data, mimeType } = await prepareImage(file);
  const res = await fetch("/api/audit-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: data, mimeType, testData, productionTonnes, sector, benchmarks }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.error || `Audit request failed (${res.status}).`), { code: body.code });
  return body;
}

const MAX_SIDE = 2000;
const MAX_UPLOAD = 3 * 1024 * 1024;

async function prepareImage(file) {
  if (file.type.startsWith("image/")) {
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close?.();
      const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.85));
      if (blob) return { data: await toBase64(blob), mimeType: "image/jpeg" };
    } catch {
      // The browser cannot draw this format (e.g. HEIC outside Safari): send the original.
    }
  }
  if (file.size > MAX_UPLOAD) throw new Error("File is larger than 3 MB. Take the photo again or use a smaller file.");
  return { data: await toBase64(file), mimeType: file.type === "image/heif" ? "image/heif" : file.type };
}

function toBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(new Error("Could not read the file."));
    r.readAsDataURL(blob);
  });
}
