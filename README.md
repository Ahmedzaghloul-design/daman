# Daman (ضمان)

Analog-to-digital bridge for EU CBAM compliance. Turns handwritten Arabic energy
receipts into a verifier-ready English emissions ledger, with a human sign-off
on every entry.

## Run it

Requires Node.js 22.9 or newer (`node -v`).

```bash
npm install
cp .env.example .env      # then paste your GEMINI_API_KEY
npm run dev               # web on :5173, API on :8787
```

Open http://localhost:5173. No API key yet? Set `GEMINI_MOCK=true` in `.env`.

Get an API key at https://aistudio.google.com/apikey. A Gemini app
subscription does not include API access.

## How data flows

```
photo ──► src/services/ocrApi.js          (MOCK CNN-BiLSTM-CTC: File -> raw Arabic string)
      ──► src/services/geminiApi.js       (browser: POST /api/audit)
      ──► server/index.js                 (validates input, holds the API key)
      ──► server/services/geminiApi.js    (ai.models.generateContent + strict responseSchema)
      ──► shared/massBalance.js           (deterministic energy-per-tonne check)
      ──► Dashboard HITL review           (reviewer edits / approves / rejects)
      ──► ledger                          (only approved rows; CSV export)
```

Design rule: **the LLM structures and explains, code calculates, a human
approves.** Anomaly numbers and tCO2e are computed in plain JavaScript so a
verifier can reproduce them. The server forces `requires_human_review` when
confidence is below 0.85, a field is missing, or mass balance fails.

## Project layout

| Path | Purpose |
| --- | --- |
| `src/App.jsx` | Routing and providers (language, workspace state) |
| `src/pages/LandingPage.jsx` | Marketing site |
| `src/pages/Dashboard.jsx` | Workspace: state machine, upload, ledger, anomalies, settings |
| `src/components/LedgerTable.jsx` | Monospace compliance ledger and CSV export |
| `src/components/ReviewPanel.jsx` | HITL review form and sign-off |
| `src/services/ocrApi.js` | OCR mock (swap for the real model service) |
| `src/services/geminiApi.js` | Browser client for `/api/audit` |
| `server/services/geminiApi.js` | Real `@google/genai` integration |
| `shared/` | Normalisation, emission factors, mass balance (used by both sides) |
| `src/i18n/strings.js` | All English and Arabic copy |

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
