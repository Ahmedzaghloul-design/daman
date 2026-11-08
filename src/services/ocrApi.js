// ---------------------------------------------------------------------------
// OCR service — MOCK of the CNN-BiLSTM-CTC Arabic handwriting model.
//
// Production plan: the trained model runs as a separate Python service
// (e.g. FastAPI + PyTorch). This function will POST the image there and return
// its decoded CTC string. The contract stays the same: File in, raw
// unstructured Arabic string out. That string is handed UNCHANGED to
// src/services/geminiApi.js, which sends it to the server for structuring.
// ---------------------------------------------------------------------------

// Sample outputs that mimic what a CTC decoder emits: one flat line, Arabic-
// Indic digits, separators, and the occasional unreadable glyph ("؟").
export const SAMPLE_OCR_OUTPUTS = [
  "مصنع الفراعنة للأسمنت - ١٥٠٠٠ لتر سولار - التاريخ ١٥ مارس ٢٠٢٦",
  "شركة الدلتا للصلب - فاتورة كهرباء - ١٤٢٠٠٠ كيلو وات ساعة - التاريخ ٣ أبريل ٢٠٢٦",
  "مصنع الفراعنة للأسمنت - ١٢؟٠٠ لتر سولار - التاريخ ؟ مارس ٢٠٢٦ - المستلم م. حسن",
];

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];

/**
 * Simulates the OCR model: 2-second latency, returns a raw Arabic string.
 * @param {File} file  Photo of a receipt or manifest.
 * @returns {Promise<string>} Unstructured Arabic text (no parsing yet).
 */
export async function extractArabicText(file) {
  if (!file) throw new Error("No file provided.");
  if (file.size > MAX_BYTES) throw new Error("File exceeds 10 MB.");
  if (file.type && !ACCEPTED.includes(file.type)) throw new Error("Unsupported file type.");

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Deterministic choice so the same file always gives the same output.
  const index = file.size % SAMPLE_OCR_OUTPUTS.length;
  return SAMPLE_OCR_OUTPUTS[index];
}
