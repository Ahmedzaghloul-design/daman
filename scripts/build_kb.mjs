// Builds the chatbot's knowledge base (api/knowledge/kb.json) from the spec,
// so the bot can only cite facts we verified. Run after editing the spec:
//   node scripts/build_kb.mjs
// F-facts come from docs/DAMAN_V2_SPEC.md §4; Daman product notes (P-items)
// are written below and must match the spec and the app.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const spec = fs.readFileSync(path.join(root, "docs/DAMAN_V2_SPEC.md"), "utf8");
const section = spec.slice(spec.indexOf("## 4. Verified facts"), spec.indexOf("## 5. Product"));
const checked = section.match(/Checked (\d{4}-\d{2}-\d{2})/)?.[1] ?? "";

const facts = [];
for (const line of section.split("\n")) {
  const m = line.match(/^\| (F\d+) \| (.+?) \| (.+?) \|$/);
  if (!m) continue;
  const [, id, rawText, rawSource] = m;
  const text = rawText.replace(/\*\*/g, "").trim();
  const urls = [...rawSource.matchAll(/https?:\/\/[^\s;)]+/g)].map((u) => u[0].replace(/[.,]$/, ""));
  facts.push({ id, text, sources: urls, sourceNote: rawSource.replace(/https?:\/\/[^\s;)]+/g, "").replace(/[—;\s]+$/g, "").trim() });
}
if (facts.length < 20) throw new Error(`Expected the F-facts table, found ${facts.length} rows.`);

// Daman product notes: only what the product really does today.
const product = [
  ["P1", "Daman (ضمان, 'guarantee') is built by students at The American University in Cairo. It turns handwritten Arabic fuel and energy receipts from Egyptian factories into verified emissions data for EU CBAM."],
  ["P2", "How Daman works: 1) a factory worker photographs a receipt in the Daman app or sends it on WhatsApp; 2) Gemini reads the Arabic text and structures it (factory, energy type, quantity, unit, date, confidence); a number with an unreadable digit is flagged as a possible guess and always goes to human review; 3) code calculates emissions (quantity × emission factor) and a mass-balance check (energy ÷ declared production compared with the plant's normal range); 4) a human reviewer approves before anything reaches the ledger. Rule: AI reads and explains, code calculates, a human approves."],
  ["P3", "The emission factors built into the current Daman version are illustrative and must be replaced with the factors agreed with the factory's verifier before real use."],
  ["P4", "Daman is not an accredited CBAM verifier and does not give legal or financial advice. The EU declarant stays responsible for the declaration (F15)."],
  ["P5", "Daman produces a per-product emissions report (direct and indirect) and an export prepared for the EU CBAM Registry's operator module O3CI (F13)."],
  ["P6", "Daman works with energy records from any factory (textiles, food, chemicals, glass, ceramics and more). For goods covered by CBAM it produces the data EU buyers need; for other goods it helps answer EU buyers' emissions questions and prepares for the proposed 2028 expansion (F9, proposed, not law). CBAM does not apply to all factories."],
  ["P7", "Indicative pricing (not final): Standard $1,000 and Assured $1,500 per installation per month. Pilots are discussed with the team; book a demo on the website."],
  ["P8", "Team roles in the Daman app: owner (everything, invites people), reviewer (approves receipts, edits products and settings), uploader (only sends receipts, cannot see the ledger or costs), verifier (reads everything and comments, cannot change anything; every visit is logged)."],
  ["P9", "Privacy: Daman stores the text read from receipts and approved figures in Supabase in Frankfurt (EU), not the photos. Real receipts are only read with Gemini's paid tier, because on Google's unpaid tier content may be used to improve Google's products. Only people the factory invites can see its workspace."],
  ["P10", "Daman's CBAM cost calculator uses the official EU default values, benchmarks and certificate prices: cost per tonne = (default value × (1 + mark-up) − CBAM factor × CSCF × benchmark) × certificate price (F18–F20). Results are estimates, not financial or legal advice."],
  ["P11", "The transitional-period quarterly CBAM reports (2023–2025) and 'request delayed submission' are historical and no longer apply."],
].map(([id, text]) => ({ id, text, sources: [], sourceNote: "Daman product notes (docs/DAMAN_V2_SPEC.md)" }));

const out = { checked, built: new Date().toISOString().slice(0, 10), items: [...facts, ...product] };
fs.mkdirSync(path.join(root, "api/knowledge"), { recursive: true });
fs.writeFileSync(path.join(root, "api/knowledge/kb.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`kb.json: ${facts.length} facts + ${product.length} product notes (facts checked ${checked})`);
