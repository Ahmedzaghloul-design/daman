# Daman (ضمان)

Analog-to-digital bridge for EU CBAM compliance. Turns handwritten Arabic energy
receipts into a verifier-ready English emissions ledger, with a human sign-off
on every entry.

## Run it

Requires Node.js 22.9 or newer (`node -v`).

```bash
npm install
cp .env.example .env      # then paste your GEMINI_API_KEY
npm run dev               # starts all three parts
```

| Part | Address | Start it alone |
| --- | --- | --- |
| Website (marketing) | http://localhost:5173 | `npm run dev:website` |
| Program (workspace) | http://localhost:5174 | `npm run dev:app` |
| API (holds the Gemini key) | http://localhost:8787 | `npm run dev:api` |

The website and the program both need the API running for anything that uses
Gemini. No API key yet? Set `GEMINI_MOCK=true` in `.env`.

Get an API key at https://aistudio.google.com/apikey. A Gemini app
subscription does not include API access.

Run the tests with `npm test`.

## How data flows

```
photo ──► app/src/services/ocrApi.js       (MOCK CNN-BiLSTM-CTC: File -> raw Arabic string)
      ──► app/src/services/geminiApi.js    (browser: POST /api/audit)
      ──► api/app.js                       (validates input, holds the API key)
      ──► api/services/geminiApi.js        (ai.models.generateContent + strict responseSchema)
      ──► packages/core/massBalance.js     (deterministic energy-per-tonne check)
      ──► Dashboard HITL review            (reviewer edits / approves / rejects)
      ──► ledger                           (only approved rows; CSV export)
```

Design rule: **the LLM structures and explains, code calculates, a human
approves.** Anomaly numbers and tCO2e are computed in plain JavaScript so a
verifier can reproduce them. The server forces `requires_human_review` when
confidence is below 0.85, a field is missing, a digit is illegible, or mass
balance fails.

## Project layout

| Path | Purpose |
| --- | --- |
| `website/` | Marketing website: home, story, how-we-calculate (built in Phase 2) |
| `website/src/i18n/en.js`, `ar.js` | All website copy; every regulatory fact is tagged with its spec fact number |
| `website/src/data/images.js` | The website's photos; swap in real photos here |
| `website/src/data/recorded-audits.json` | Real Gemini responses replayed by the live demo |
| `app/` | The program: overview, emissions report, receipts, ledger, anomalies, installations, products, settings |
| `app/src/pages/Report.jsx` | Main screen: per-product report table (CN code, actual-data share, direct/indirect, tCO2e/t) |
| `app/src/state/Pipeline.jsx` | Receipt state machine (OCR → Gemini → human review) |
| `app/src/components/ReviewPanel.jsx` | Review form: assignment to installation/product and sign-off |
| `app/src/lib/exports.js` | CSV and O3CI-fields JSON export |
| `app/src/services/ocrApi.js` | OCR mock (swap for the real model service) |
| `app/src/i18n/en.js`, `ar.js` | All English and Arabic copy for the program |
| `packages/core/report.js` | Per-product emissions (direct, indirect, specific, actual-data share, completeness) |
| `api/` | Express server; `api/services/geminiApi.js` is the `@google/genai` integration |
| `packages/core/` | Normalisation, emission factors, mass balance, CBAM cost formula (shared by everything) |
| `packages/core/data/cbam-data.json` | Official EU default values (Egypt + other countries), benchmarks, prices, factors, with sources |
| `scripts/extract_cbam_data.py` | Rebuilds that data file from the EU Excel files in `docs/sources/eu/` |
| `website/src/pages/Tools.jsx` | Sector checker and CBAM cost calculator |
| `docs/DAMAN_V2_SPEC.md` | The v2 build specification, phases and verified facts |

## Roadmap to a real product

Build these one at a time.

1. **Real OCR service.** Train the CNN-BiLSTM-CTC model (PyTorch) on real
   receipts, serve it with FastAPI, and point `extractArabicText` at it. Return
   per-character confidence so the UI can highlight uncertain digits. Benchmark
   it against Gemini vision reading the image directly, and keep whichever is
   more accurate, or use both and flag disagreement.
2. **Data collection.** Partner with 1–2 factories (AUC Venture Lab / industrial
   contacts) to get a few hundred real, anonymised receipts. Label them. This
   dataset is your moat.
3. **Database and auth.** Move the ledger from localStorage to Postgres (e.g.
   Supabase), with login, one workspace per installation, and reviewer roles.
4. **Immutable audit trail.** Store the original image hash, raw OCR text, model
   output, every reviewer edit, and who approved what and when. Never allow
   silent edits after approval: corrections become new entries.
5. **Correct CBAM scope.** Model installations, production processes and
   reporting periods. Fuel per tonne of product is a simplification: CBAM
   needs direct and (for some goods) indirect emissions per tonne of good.
   Precursors count for steel and aluminium.
6. **Export in the EU format.** Generate the EU communication template for
   operators, which your EU buyers attach to their CBAM declarations.
7. **Security.** Rate limiting, request logging without personal data, upload
   scanning, HTTPS, secrets in a vault, and a data-processing agreement with
   each factory.
8. **Verifier partnership.** Work with an accredited verifier early. Their
   sign-off on your method is what makes "audit-grade" true.
