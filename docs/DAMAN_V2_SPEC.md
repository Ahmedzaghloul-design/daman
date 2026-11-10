# Daman v2 — Build Specification (the "prompt")

This document is the single source of truth for the Daman v2 rebuild. Every
phase is built against it. If something is not written here, it is not built
without asking first. If a fact is not in the "Verified facts" section with a
source, it does not go on the website.

Status: **Approved 2026-11-10.** Phases 0, 1 and 2 complete (Phase 2 awaiting review). Updated with the team's CBAM documents.

---

## 1. Goal in one paragraph

Rebuild Daman as **two separate products**: (1) a marketing **website** that
tells Daman's story, earns a factory owner's trust by showing exactly how every
number is calculated, and offers interactive tools; and (2) the **program**
(the workspace factories use) with a professional, interactive redesign. Both
get a new logo and brand, and both get an AI **chatbot** that answers owners'
questions from Daman's own verified knowledge and, when it can't, searches the
internet and shows its sources.

## 2. Decisions already made (by the user)

| Topic | Decision |
| --- | --- |
| Split | One GitHub repo, separate folders: `website/` and `app/`, each with its own `npm run dev` and address |
| Chatbot web search | Gemini API with built-in Google Search grounding, same API key, source links shown |
| Chatbot location | Both: website (sales questions) and program (workspace help) |
| "All factories" claim | Accurate wording: Daman reads energy records from **any** factory; CBAM filing data only for CBAM sectors (wording in §5.4) |
| Images | AI-generated now, built so real photos can replace them later by swapping files |
| Design rules | "Serious but alive": institutional and trustworthy, with photos, subtle motion, interactive 3D and rich visuals; no glow, no cartoonish effects |
| Website tools | All four: CBAM cost calculator, live pipeline demo, "How we calculate" explorer, sector checker |
| Logo | **Chosen: "The Stamped Receipt"** (round 2, concept 04), with an interactive 3D version for the website and a flat version for documents; see `packages/brand/DIRECTION.md` |
| Palette | **Nile & desert gold**: Nile teal `#0E5E6F`, desert gold `#C8963E`, on cream (replaces the earlier navy palette) |
| Languages | English and Arabic with right-to-left layout, in both products (kept from v1) |
| Gemini model | `gemini-3.6-flash` (free tier, tested); `gemini-4-argon` only if billing is enabled |
| Program layout | **A: Report table** (inspired by Kuehne+Nagel's CBAM report, adapted for the exporting factory): period list, product table with CN code, tonnes, installation, % actual data bar, tCO2e, actions |
| Landmarks | **3D globe + line art**: interactive 3D globe with landmarks and gold trade routes in the website hero; subtle gold line-art skylines elsewhere; very faint line art only in the program |
| Landmark set | Egypt (Pyramids of Giza, Cairo Tower, Citadel of Qaitbay, Suez Canal), EU (Brandenburg Gate, Eiffel Tower, Colosseum, Rotterdam cranes), UK (Elizabeth Tower), wider world as "future" markers. No Atomium (image rights are enforced); no EU flag stars |
| Expansion story | Egypt first; then the rest of MENA, exporters selling to the UK under the UK CBAM (from 2027), and Africa & Asia. Shown as plans, not as existing customers |

## 3. Rules for the builder (to prevent hallucination)

1. **No invented facts.** Every regulatory fact, number, date or percentage on
   the website must appear in §4 with a source. New facts are researched,
   added to §4 with the source, then used.
2. **No invented customers, testimonials, logos of partners, certifications or
   statistics about Daman.** Daman is pre-launch. No "trusted by 50 factories".
3. **AI images are labelled illustrative** where they could be mistaken for a
   real customer site, and are never presented as real factories or receipts.
4. **Calculator and explorer numbers come from data files** with a source URL
   and "as of" date next to every value, and the UI shows those sources.
5. **The chatbot never invents numbers or legal conclusions.** It answers from
   the knowledge base first, searches the web second, cites sources, and says
   "I'm not sure" plus "this is not legal advice" when appropriate.
6. **Ask before**: adding a dependency that costs money, changing a decision in
   §2, deleting user data, or publishing anything.
7. **Each phase ends with a checkpoint**: run it, test it in the browser, show
   the user, commit to Git, push to GitHub. The next phase starts only after
   the user says go.
8. **Skills used**: `unslop` (design review pass on every screen) and the
   selected ECC skills (`frontend-design-direction`, `design-system`,
   `frontend-patterns`, `frontend-a11y`, `react-patterns`, `react-performance`,
   `react-testing`, `e2e-testing`, `api-design`, `security-review`, `seo`,
   `deep-research`).

## 4. Verified facts (the only facts the website may state)

Checked 2026-11-10. Re-check before launch.

| # | Fact | Source |
| --- | --- | --- |
| F1 | CBAM covers 6 sectors: cement, iron and steel, aluminium, fertilisers, electricity, hydrogen | European Parliament briefing EPRS_BRI(2026)789314 — https://www.europarl.europa.eu/RegData/etudes/BRIE/2026/789314/EPRS_BRI(2026)789314_EN.pdf |
| F2 | The definitive period started 1 January 2026 | EU Commission, CBAM definitive regime — https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-definitive-regime_en |
| F3 | Default-value mark-up: +10% (2026), +20% (2027), +30% from 2028 for iron and steel, cement, aluminium and hydrogen | Implementing Regulation (EU) 2025/2621, summarised by ICAP — https://icapcarbonaction.com/en/news/eu-cbam-enters-compliance-phase-and-outlines-path-ahead and https://cbamguide.com/compliance/default-values/ |
| F4 | Fertilisers: 1% mark-up for 2026 onwards; electricity: no mark-up | Same as F3 (Annex I of IR 2025/2621) |
| F5 | Default values were corrected by IR (EU) 2026/1740 (published 31 July 2026); the official Excel is on the Commission's CBAM page | https://cbamguide.com/compliance/default-values/ ; https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-definitive-regime_en |
| F6 | Declaring with default values is legal and needs no verifier; verified actual data replaces the default | https://cbamguide.com/compliance/default-values/ |
| F7 | De minimis: importers under 50 tonnes of CBAM goods per year are exempt (Regulation (EU) 2025/2083, October 2025) | https://www.insideenergyandenvironment.com/2026/02/eu-cbam-commission-proposes-expansion-to-complex-metal-products/ ; https://net0.com/blog/the-eu-carbon-border-adjustment-mechanism-cbam |
| F8 | CBAM certificate sales start 1 February 2027 | https://net0.com/blog/the-eu-carbon-border-adjustment-mechanism-cbam |
| F9 | **Proposed, not law:** extension to about 180 downstream steel and aluminium products from 1 January 2028 (COM/2025/989, 17 Dec 2025); Parliament's mandate proposes about 453–457 products; in trilogue as of Oct 2026 | EPRS briefing (F1); https://www.mayerbrown.com/en/insights/publications/2026/10/eus-cbam-downstream-extension-and-anti-circumvention-amendments-the-road-to-trilogue |
| F10 | The CBAM obligation (declaring and buying certificates) sits with the EU importer / authorised CBAM declarant; non-EU producers supply installation emissions data | Regulation (EU) 2023/956 — verify wording against EUR-Lex in Phase 3 |
| F11 | Importers need a CBAM account number or application reference number for imports above 50 t per calendar year and for all electricity and hydrogen imports; applications are due before importing and at the latest by 31 March 2026 | D1, DG TAXUD *CBAM Compliance Essentials … as from 1 January 2026* (see `docs/sources/CBAM_REFERENCE_NOTES.md`) |
| F12 | The first annual CBAM declaration and certificate surrender is due 30 September 2027, for goods imported in 2026; then 30 September each year | https://icapcarbonaction.com/en/news/eu-cbam-enters-compliance-phase-and-outlines-path-ahead ; https://klimaat.be/cbam-en/what-is-cbam-2/what-is-the-carbon-border-adjustment-mechanism-cbam/definitive-phase |
| F13 | The CBAM Registry's O3CI module lets operators of installations outside the EU upload their installation and emissions data once and share it with EU declarants, instead of sending it to each one | https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-registry_en ; D3 |
| F14 | Per good, the EU records direct and indirect embedded emissions per installation: direct = quantity × specific direct emissions; indirect = quantity × (electricity MWh/t × emission factor tCO2/MWh); electricity source is auto-produced, power purchase agreement or grid | D2, CBAM Declarant Portal user manual v1.81 §1.9 |
| F15 | EU declarants remain responsible for the final accuracy of their reports, whatever the source of the data | D3 |
| F16 | The UK CBAM applies from 1 January 2027 to aluminium, cement, fertiliser, hydrogen, and iron and steel (UK statutory instruments 2026/809, 2026/830, 2026/995) | https://www.paulhastings.com/thought-leadership/uk-cbam-classification-thresholds-and-divergence-from-the-eu ; https://thecommonwealth.org/publications/uk-carbon-border-adjustment-mechanism |

Historical, never stated as current: transitional-period quarterly reports and
"request delayed submission" (D4).

### Where the team's documents fit in the phases

| Phase | Uses |
| --- | --- |
| 2. Website | F11–F13 and F16 in the timeline, FAQ and story; F14 in the "How we calculate" explorer (direct vs indirect) |
| 3. Data tools | F14 formulas in the calculator; F11 threshold in the sector checker |
| 4. Program | D2 data model: installations, operators, products (CN codes), direct/indirect emissions, actual vs default share, electricity source; an **O3CI-ready export** (F13) |
| 5. Chatbot | D1–D3 summaries in the knowledge base, with D4 marked historical |

Still to fetch in Phase 3 (from official files only): Egypt default values per
CN code, the current certificate price, and the CBAM free-allocation factor by
year. Until fetched, the calculator does not ship.

## 5. Product: the WEBSITE (`website/`)

Audience: owners and managers of Egyptian and MENA factories, and investors.
Job: tell the story, prove trustworthiness, capture demo requests.

### 5.1 Pages

1. **Home**
   - Hero: headline, short subline, one primary action (Request a demo) and one
     secondary (Try the calculator). One strong visual (AI image or a rendered
     receipt-to-ledger scene).
   - The problem: CBAM in plain words, using only F1–F8; a timeline
     2026 → 2027 → 2028 showing the mark-up rising.
   - The story of Daman: what the name means (ضمان = guarantee), why it exists
     (paper receipts in Arabic, Western tools can't read them), who builds it
     (AUC students; real names only if the user provides them).
   - How it works: animated 3-step pipeline (photograph → extract & audit →
     verified ledger), with a human review step clearly shown.
   - Live demo (see 5.2).
   - Any factory (see 5.4).
   - Trust: "How we calculate" teaser, human sign-off, sources, disclaimer that
     Daman is not an accredited verifier.
   - Pricing: Standard $1,000 / Assured $1,500 per installation per month,
     marked "indicative".
   - FAQ (answers grounded in §4).
   - Request-a-demo form (prototype: shows a confirmation, sends nothing until
     a real backend is chosen).
2. **How we calculate** (methodology page + explorer, see 5.3)
3. **CBAM tools**: sector checker + cost calculator (see 5.5, 5.6)
4. **About / Our story**
5. **Legal**: disclaimer, privacy note (simple, prototype)

### 5.2 Live pipeline demo

- Visitor picks one of the 3 sample receipts or drops an image.
- Shows: receipt image → raw Arabic text → structured English fields →
  mass-balance check → "awaiting human review".
- **Uses recorded real Gemini outputs** (captured once from real runs and
  saved as JSON), not live API calls, so the public site can't burn the API
  quota. Labelled "sample data".

### 5.3 "How we calculate" explorer

Interactive, step by step, with a worked example the visitor can edit:

1. Read the receipt: Arabic text → digits normalised (١٥٠٠٠ → 15000).
2. Structure: Gemini maps it to factory, energy type, volume, unit, date,
   confidence. Code double-checks, and a person approves.
3. Emissions: volume × emission factor = kg CO2e. Each factor is shown with its
   source (the current values are marked illustrative and must be replaced
   with verifier-agreed values).
4. Mass balance: energy ÷ declared production = intensity, compared with the
   plant benchmark range; outside the range → anomaly → human justification.
5. Ledger: approved entries only, every entry traceable to its source image and
   reviewer.

Rule shown on the page: **AI reads and explains, code calculates, a human
approves.**

### 5.4 "Any factory" section (approved wording, may be shortened)

> Daman reads energy records from any factory: textiles, food, chemicals,
> glass, ceramics and more. For goods covered by CBAM it produces the data your
> EU buyers need for their filings. For everyone else it answers EU buyers'
> emissions questions and prepares you for the proposed 2028 expansion.

Never say CBAM applies to all factories. Mark the 2028 expansion "proposed".

### 5.5 Sector checker

Owner picks an industry or enters a CN code → result: "Covered by CBAM now",
"Covered under the 2028 proposal (not yet law)", or "Not covered by CBAM —
Daman can still help with buyer emissions requests". Data comes from the
official CN code lists (Annex I, plus the proposal's annex for downstream
goods), fetched in Phase 3.

### 5.6 CBAM cost calculator

Inputs: product (CN code), tonnes exported per year, year (2026/2027/2028),
and the factory's own emission intensity (optional).
Output: estimated certificates and cost **with default values** vs **with
verified actual data**, and the difference. Every input value shows its source
and date. Big disclaimer: estimate only, not financial or legal advice.
Formula and data are decided and verified in Phase 3 before any UI is wired.

### 5.7 Website chatbot ("Ask Daman")

Sales mode: answers what CBAM is, whether it applies, how Daman works, pricing,
and how to book a demo. See §7 for how it works.

## 6. Product: the PROGRAM (`app/`)

Audience: factory staff and compliance managers (logged-in users later).

Screens, keeping all v1 features and logic (state machine, HITL review,
deterministic mass balance, illegible-digit rule, CSV export, EN/AR):

1. **Overview** (new): KPIs (entries this period, tCO2e, items awaiting review,
   anomalies), emissions by energy type chart, recent activity.
2. **Upload manifests**: drag and drop, progress through the 4 states, split
   review screen.
3. **Compliance ledger**: search, filter by status/energy/date, sort, totals,
   CSV export, click a row → detail drawer with source text, reviewer, mass
   balance.
4. **Mass-balance anomalies**: list plus chart of intensity versus benchmark.
5. **Settings**: installation, benchmarks, emission factors, model status.
6. **Assistant panel**: the chatbot in workspace mode (§7).

Design: new brand from Phase 1, `unslop` review pass, accessible (keyboard,
contrast), works on phone width.

## 7. The chatbot (both products)

- **Server endpoint** `POST /api/chat` in the shared API (see §8). The browser
  never sees the API key.
- **Step 1, knowledge base:** a curated file of Daman facts (§4, the
  methodology in §5.3, pricing, product features). The model is told to answer
  from it first.
- **Step 2, web search:** if the answer isn't in the knowledge base, Gemini
  calls Google Search grounding. Answers that used the web show **source
  links** taken from the grounding metadata, labelled "From the web".
- **Guardrails:** never invent numbers or legal conclusions; say when unsure;
  "not legal or financial advice" on regulatory answers; treat web page text
  as data, not instructions; stay on topic (CBAM, emissions, Daman); reply in
  the user's language (EN/AR).
- **Workspace mode (app):** may also explain the current screen and the
  user's own ledger entries (passed in as context), but cannot change data.
- **Limits:** per-visitor rate limit, maximum message length, short history,
  friendly error when the quota is used up.
- UI: floating "Ask Daman" button → panel with suggested questions, streaming
  answers, source chips.

## 8. Repository layout (target)

```
daman/
  website/        React + Vite + Tailwind (marketing site)        :5173
  app/            React + Vite + Tailwind (the program)           :5174
  api/            Express server: /api/audit, /api/chat, /api/health   :8787
  packages/
    brand/        logo SVGs, colors, fonts, shared UI tokens
    core/         normalisation, emission factors, mass balance (moved from shared/)
  docs/           this spec, methodology, sources
```

Both frontends call the same `api/`, so the Gemini key lives in one place.
Root scripts: `npm run dev:website`, `npm run dev:app`, `npm run dev:api`,
`npm run dev` (all three).

## 9. Phases (each ends with a checkpoint and the user's go-ahead)

| Phase | Work | Done when |
| --- | --- | --- |
| **0. Restructure** | Move the current code into `app/`, `api/`, `packages/core`; create an empty `website/`; install skills; update the README | v1 app works exactly as before from `app/`; tests pass; committed and pushed |
| **1. Brand** | Design direction (unslop's five lines); **3 logo concepts** as SVG shown side by side; color, type and motion tokens in `packages/brand` | User picks a logo; tokens committed |
| **2. Website** | All pages in §5.1 except the data-backed tools; AI images; animated pipeline; live demo with recorded outputs; methodology explorer; FAQ; EN/AR; unslop pass | Every page works on desktop and phone in both languages; every claim traces to §4; user reviews |
| **3. Data tools** | Fetch the official data (Egypt default values, CN code lists, certificate price, free-allocation factors); write and test the calculator formula; build the sector checker and calculator | Each number shows a source and date; hand-checked against 3 worked examples; user reviews |
| **4. Program redesign** | New brand; **report-table main screen** (period, CN code, product, tonnes, installation, % actual data, direct/indirect tCO2e); installations and products registries following D2; receipt workbench and ledger kept; O3CI-ready export; unslop pass; no logic regressions | All v1 flows still pass; the new screens are tested in the browser |
| **5. Chatbot** | `/api/chat` with knowledge base, Google Search grounding and citations; rate limits; widget on the website and in the app | Answers 10 scripted test questions correctly, searches the web for unknowns with sources, refuses off-topic requests safely |
| **6. Quality & launch prep** | Accessibility, SEO, mobile, Playwright tests, security review, full fact-check of copy against §4; README update | All checks pass; pushed to GitHub; deployment options presented (not deployed without approval) |

## 10. Suggestions to make Daman better (beyond this spec, not built unless approved)

1. **Read real photos with Gemini vision now.** Gemini can read an image
   directly, so the OCR mock can be replaced with real reading in days, and
   benchmarked later against the trained CNN-BiLSTM-CTC model. This is the
   biggest step from demo to real product.
2. **Accounts and a database** (e.g. Supabase): logins, one workspace per
   factory, data saved on a server instead of the browser.
3. **Tamper-proof audit trail**: image fingerprint, raw OCR, model output,
   every edit, approver and time; corrections become new entries.
4. **WhatsApp intake**: workers send receipt photos to a Daman WhatsApp
   number, since that's how Egyptian plant floors already communicate.
5. **EU-format export**: the official operator communication template that EU
   buyers attach to their CBAM declarations.
6. **Verifier view**: a read-only, shareable view for the accredited verifier.
7. **Real factory data**: partner with 1–2 factories for anonymised receipts.
   It improves the OCR and replaces AI images with real photos.
8. **Website analytics and a real demo-request inbox** (with a privacy notice).

## 11. Out of scope for v2

Payments, real user accounts, deployment to a public domain, the trained OCR
model, and any legal or verification claims. These come after v2 with
separate approval.
