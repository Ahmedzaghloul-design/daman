# Daman — project status (demo stage, 2026-11-10)

Daman is a **demo** right now, not a live product. Everything below runs on
your laptop (`npm run dev`) and is saved on GitHub
(`Ahmedzaghloul-design/daman`, private).

## 1. What has been built

### The website (http://localhost:5173), for factory owners and judges
- **Home:** 3D globe, Egyptian and European landmarks, the CBAM problem in
  plain words, how Daman works, a live demo of a receipt being read (recorded
  answers, so it never uses Gemini), "any factory" section, a preview of the
  app, indicative pricing, FAQ, and a request-a-demo form (it only shows a
  thank-you for now and sends nothing).
- **Story:** what ضمان means, why Daman exists, the expansion roadmap.
- **How we calculate:** step-by-step explorer of the method.
- **Tools:** a quick CBAM cost estimate for 5 common Egyptian exports, with a
  link to the full calculator in the app.
- **Ask Daman chatbot** (sales mode) with a demo-request form that needs a
  consent tick.
- English and Arabic, phone and desktop.

### The app (http://localhost:5174), for factory teams
- Dark Nile & gold dashboard; can be installed on a phone like an app.
- **Overview, Emissions report, Ledger, Anomalies:** per-product emissions
  (direct and indirect), share backed by real data, buyer cost on EU defaults.
- **Receipts:** take or upload a photo; Gemini reads it, code checks it
  (unreadable digits, mass balance), a person approves it.
- **Full CBAM calculator and sector checker** using the official EU data
  (default values, benchmarks, certificate prices), checked against published
  worked examples to the cent.
- **Installations and Products** registry in the EU data model; export ready
  for the EU's O3CI registry module.
- **Accounts:** email sign-in, one workspace per factory, roles (owner,
  reviewer, uploader, verifier) enforced by the database.
- **Verifier view:** each entry with its source text and checks, comments,
  access log.
- **WhatsApp numbers:** owners register workers' phones.
- **Ask Daman chatbot** (workspace mode): can explain your own report.
- "Demo on this device" mode with sample data, no account needed.

### The server (API, http://localhost:8787)
- Holds the Gemini key (never sent to the browser).
- Receipt reading from text and from photos, with the same checks.
- WhatsApp webhook (Twilio), chatbot, demo requests.
- Privacy guard: real photos and factory data reach Gemini only when billing is
  on. Rate limits per device.

### Data, design and documents
- **Brand:** Stamped Receipt logo (3D and flat), colours, fonts
  (`packages/brand`).
- **Official EU CBAM data** and the calculation core (`packages/core`), with
  scripts to update it when the EU publishes new files.
- **Database:** Supabase project "daman" (Frankfurt, free plan), 4 migrations
  in `supabase/migrations`.
- **Docs:** `docs/DAMAN_V2_SPEC.md` (the spec and every verified CBAM fact
  with its source), `docs/SETUP.md` (setup steps), `docs/WHATSAPP.md`,
  `docs/pilot/` (pitch, EN/AR consent letter, data checklist).
- **Tests:** 40 unit tests and 92 browser tests (calculations, receipt checks, chatbot rules,
  WhatsApp signatures, rate limits).

## 2. Not tested yet

| What | Why | What it needs |
| --- | --- | --- |
| Real chatbot answers from Gemini | Free daily limit was used up | Wait for the reset, then ask a few questions |
| Photo with a smudged digit | Same | One test photo after the reset |
| Email sign-in | Needs your inbox and Supabase settings | `docs/SETUP.md` step 1 |
| Installing the app on a phone | Needs a public https address | Going online (section 4) |
| WhatsApp with a real phone | Needs a Twilio account and going online | `docs/WHATSAPP.md` |

## 2b. Phases in the spec (`docs/DAMAN_V2_SPEC.md` §9)

| Phase | Status |
| --- | --- |
| 0 Restructure · 1 Brand · 2 Website · 3 Data tools · 4 Program redesign | Done |
| 5 Chatbot | Built and tested in mock mode. Its finish line, "answers 10 scripted questions correctly" with real Gemini, is not met yet: run `scripts/chat_eval.mjs` after the daily limit resets |
| 6 Quality & launch prep | Done (2026-11-11): accessibility (axe scan clean on 15 pages × EN/AR × desktop/phone, keyboard tests), link previews and SEO, 92 Playwright browser tests, security review (`docs/SECURITY_REVIEW.md`), fact-check (`docs/FACT_CHECK.md`), README, deployment options (`docs/SETUP.md`). Open: decisions listed in those two documents |

Ideas from spec §10 that are only partly built:
- **Tamper-proof audit trail:** the ledger is append-only and the database
  stamps the reviewer, but there is no photo fingerprint or edit history yet.
- **Official EU template:** Daman exports an O3CI-ready file, not the EU's
  official "communication template for operators".
- **Demo-request inbox and analytics:** only the chatbot form saves requests;
  no analytics.

## 3. Left to do for the demo (small)

1. Supabase: set the sign-in address and add `{{ .Token }}` to the sign-in
   email (`docs/SETUP.md` step 1). Without it, sign-in does not work.
2. After the Gemini reset: one real photo test and a few chatbot questions.
3. Replace the AI images with your real photos when you have them.
4. Add the team's real names to the Story page and the pitch.
5. Decide the pilot price (placeholder in `docs/pilot/01-pitch.md`).
6. Connect the home page's request-a-demo form to the same consent-based
   storage the chatbot form uses (small change; ask me).
7. Optional: put the demo online on Vercel's free plan so judges can open it on
   their phones. Tell me when, and I'll ask before deploying.

## 4. Left to do before going live (when you tell me)

- **Gemini billing** on (real receipts are blocked until then; the free tier
  allows about 20 requests a day).
- **Real emission factors:** the built-in ones are illustrative; use the
  factors agreed with a verifier.
- **Own email service** for sign-in (Supabase's built-in one only reaches your
  Supabase team).
- **Hosting:** Vercel Pro (Hobby is for non-commercial use), a domain name.
- **WhatsApp:** a real number through Meta business verification (the sandbox
  is for testing only).
- **Legal:** AUC legal office or a lawyer reviews the consent letter, privacy
  notice and terms (Egypt's data protection law No. 151 of 2020 may apply).
- **Data checks:** re-check every CBAM fact and the EU data files before launch
  (prices change every quarter; rules may change, e.g. the proposed 2028
  extension).
- **Security review** before real factory data, plus backups of the database.
- Real OCR model (the CNN-BiLSTM-CTC model) if you still plan to use it next
  to Gemini.

## 5. How to run it

```bash
npm run dev     # website :5173, app :5174, API :8787
npm test        # 39 tests
```

Set `GEMINI_MOCK=true` in `.env` to work without using Gemini requests.
