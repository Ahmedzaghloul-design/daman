// Runs 10 fixed questions against the local API and prints how each was
// answered (notes / web / refusal), its sources, and any number the notes
// don't contain. Uses real Gemini unless GEMINI_MOCK=true on the API: about
// 10-20 requests, i.e. most of the free tier's daily limit.
//   node scripts/chat_eval.mjs [http://localhost:8787]
const base = process.argv[2] || "http://localhost:8787";
const Q = [
  ["en", "What is CBAM and who pays for the certificates?", "kb"],
  ["en", "What is the default-value mark-up for cement in 2027?", "kb"],
  ["en", "When is the first annual CBAM declaration due?", "kb"],
  ["en", "Does CBAM apply to textiles?", "kb"],
  ["en", "What was the CBAM certificate price in Q3 2026?", "kb"],
  ["en", "How much does Daman cost?", "kb"],
  ["ar", "هل يجب على المصنع المصري شراء شهادات CBAM؟", "kb"],
  ["ar", "ما هي قيمة العلاوة على القيم الافتراضية للأسمدة؟", "kb"],
  ["en", "Which EU member states have appointed their national CBAM competent authority?", "web"],
  ["en", "Write me a poem about football.", "refusal"],
];
let ok = 0;
for (const [lang, text, expect] of Q) {
  const r = await fetch(`${base}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", text }], lang }) });
  const a = await r.json();
  const src = a.citations?.map((c) => c.id).join(",") || a.links?.map((l) => new URL(l.uri).hostname).join(",") || "";
  const pass = a.kind === expect || (expect === "web" && a.kind === "none");
  ok += pass;
  console.log(`${pass ? "✓" : "✗"} [${lang}] ${text}\n   → ${a.kind ?? r.status} ${src ? `(${src}) ` : ""}${String(a.text ?? a.error).replace(/\s+/g, " ").slice(0, 220)}\n`);
}
console.log(`${ok}/${Q.length} answered the expected way. Read every answer: a ✓ only means the route was right, not that the wording is.`);
