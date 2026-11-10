# Daman (ضمان)

Turns handwritten Arabic fuel and energy receipts from Egyptian factories into
verified emissions data for EU CBAM, with a human sign-off on every entry.
Built by students at The American University in Cairo.

**Status:** demo, running locally. Not online yet. See
[`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) for what is built and what
is left.

## Run it

Requires Node.js 22.9 or newer (`node -v`).

```bash
npm install
cp .env.example .env      # then paste your GEMINI_API_KEY
npm run dev               # starts all three parts
```

| Part | Address | What it is |
| --- | --- | --- |
| Website | http://localhost:5173 | Story, method, CBAM cost estimate, Ask Daman chatbot (EN/AR) |
| App | http://localhost:5174 | The factory workspace (installable on phones) |
| API | http://localhost:8787 | Holds the Gemini key; receipts, chatbot, WhatsApp, demo requests |

**Presenting to judges?** Open http://localhost:5174/present — see
[`docs/PRESENTATION.md`](docs/PRESENTATION.md).

No API key, or saving the free daily Gemini limit (about 20 requests)? Set
`GEMINI_MOCK=true` in `.env`.

## Test it

```bash
npm test            # 40 unit tests: calculations, receipt checks, chatbot rules, WhatsApp, security headers
npm run test:e2e    # 98 browser tests (Playwright): accessibility, keyboard, SEO, click-through flows, presentation
node scripts/check_i18n_numbers.mjs   # English and Arabic texts carry the same numbers
```

Browser tests run Chromium locally and send every API call to a mock API, so
they never use the Gemini quota or touch real data.

## How a receipt becomes data

```
photo (app or WhatsApp)
  ──► API /api/audit-image      Gemini copies the Arabic text as written (؟ for anything unreadable)
  ──► validator                 fields checked; unreadable digit, low confidence or missing field → review
  ──► packages/core             emissions and the mass-balance check, in plain code
  ──► human review              a named reviewer approves, edits or rejects
  ──► ledger                    append-only; ID and reviewer stamped by the database
  ──► report                    per product: direct + indirect, share backed by real data, O3CI-ready export
```

Rule: **AI reads and explains, code calculates, a person approves.**

Privacy: on Gemini's free tier Google may use what is sent to improve its
products, so real receipts are blocked until `GEMINI_BILLING=paid` (test
photos can be sent with a tick-box).

## Project layout

| Path | Purpose |
| --- | --- |
| `website/` | Marketing website (React + Vite + Tailwind) |
| `app/` | The factory workspace: overview, report, receipts, ledger, anomalies, verifier view, calculator, registry, account |
| `api/` | Express server: `services/geminiApi.js` (receipts), `chat.js` (chatbot), `whatsapp.js`, `leads.js` |
| `api/knowledge/kb.json` | The chatbot's verified notes, generated from the spec by `scripts/build_kb.mjs` |
| `packages/core/` | Shared logic: normalisation, emission factors, mass balance, CBAM cost formula, report |
| `packages/core/data/cbam-data.json` | Official EU default values, benchmarks, prices and factors, with sources |
| `packages/chat/` | The "Ask Daman" chat panel used by both the website and the app |
| `packages/brand/` | Logo, colours, fonts |
| `supabase/migrations/` | Database tables, roles and security rules (Supabase project "daman") |
| `e2e/` | Playwright browser tests |
| `scripts/` | Data extraction from the EU files, knowledge-base build, checks |
| `docs/` | Spec, setup, security review, fact-check, WhatsApp, pilot pack, status |

## Documents

- [`docs/DAMAN_V2_SPEC.md`](docs/DAMAN_V2_SPEC.md) — decisions, rules and every verified CBAM fact with its source
- [`docs/SETUP.md`](docs/SETUP.md) — setup steps only the owner can do, and deployment options
- [`docs/SECURITY_REVIEW.md`](docs/SECURITY_REVIEW.md) — what was checked, fixed, and decided before going online
- [`docs/FACT_CHECK.md`](docs/FACT_CHECK.md) — how the text was checked and what changed
- [`docs/WHATSAPP.md`](docs/WHATSAPP.md) — receipts by WhatsApp (Twilio)
- [`docs/PRESENTATION.md`](docs/PRESENTATION.md) — presentation mode for judges
- [`docs/pilot/`](docs/pilot/) — pitch, EN/AR consent letter, data checklist

## Roadmap to a real product

Done: website, app, official CBAM data and calculator, photo reading with
Gemini, accounts and team roles, verifier view, WhatsApp intake, chatbot,
accessibility, browser tests, security review.

Next, one at a time:

1. **Go live** — Gemini billing, own email service, hosting (see `docs/SETUP.md`),
   the decisions in `docs/SECURITY_REVIEW.md`.
2. **Real factory data** — a pilot with 1–2 factories (`docs/pilot/`); real
   photos replace the AI images.
3. **Emission factors agreed with a verifier** — the built-in ones are
   illustrative.
4. **Tamper-proof audit trail** — a fingerprint of each photo and a history of
   every edit (the ledger is already append-only).
5. **The EU's official operator template** for buyers, next to the O3CI export.
6. **A dedicated Arabic handwriting model** (CNN-BiLSTM-CTC), benchmarked
   against Gemini on real receipts.
7. **Verifier partnership** — an accredited verifier's sign-off on the method.
