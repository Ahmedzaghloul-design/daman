// Replaces the presentation's prepared chatbot answer with a real recorded
// Gemini answer (EN and AR). Uses 2-4 Gemini requests. Run with the API up:
//   node scripts/record_presentation.mjs [http://localhost:8787]
import fs from "node:fs";
const base = process.argv[2] || "http://localhost:8787";
const file = new URL("../packages/core/data/presentation-chat.json", import.meta.url);
const data = JSON.parse(fs.readFileSync(file, "utf8"));
for (const lang of ["en", "ar"]) {
  const r = await fetch(`${base}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", text: data.question[lang] }], lang }) });
  const a = await r.json();
  if (!r.ok || a.mock || a.kind !== "kb") throw new Error(`Not recorded (${lang}): ${a.error ?? (a.mock ? "API is in mock mode" : `answer came from '${a.kind}', not the verified notes`)}`);
  data.answer[lang] = a;
  console.log(`[${lang}]`, a.text.replace(/\s+/g, " ").slice(0, 200));
}
data.source = "recorded";
data.recordedAt = new Date().toISOString();
data.note = "Recorded from the live API (Gemini).";
fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
console.log("Saved. Read both answers before presenting.");
