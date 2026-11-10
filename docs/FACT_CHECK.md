# Fact-check — Phase 6 (2026-11-11)

Every sentence on the website (`website/src/i18n/en.js`, mirrored in `ar.js`),
the app's wording and the chatbot's notes (`api/knowledge/kb.json`) was
checked against the verified facts in `docs/DAMAN_V2_SPEC.md` §4 and against
what the product really does today.

## How it was checked

- Regulatory statements: each one carries an `[F#]` tag pointing to a fact
  with an official source; F10 was re-verified this phase against the
  regulation itself (Reg. 2023/956 Art. 6, 10, 22 on EUR-Lex).
- English vs Arabic: `node scripts/check_i18n_numbers.mjs` confirms every text
  has the same numbers in both languages (7 texts write a number as a word in
  Arabic, checked by hand).
- Calculator figures: unit tests reproduce published worked examples to the
  cent; browser test checks the website estimate (steel billets €252.37/t).
- Demo numbers on the home page: compared with the app's demo data.
- Chatbot notes: rebuilt from the spec by `scripts/build_kb.mjs`, so they
  cannot drift from it.

## Corrected (clear errors, English and Arabic)

| Where | Was | Now | Why |
|---|---|---|---|
| Home › How it works › Photograph | "The image is kept as evidence." | Photograph in the app or send on WhatsApp | Daman stores the text read from a receipt, not the photo |
| Home › How it works › Read | "A model trained for cursive Arabic transcribes…" | "Gemini reads the Arabic text from the photo… a digit it cannot read is marked, never guessed." | The trained model doesn't exist yet; Gemini reads photos today |
| Home › How it works › status | "reading uses a stand-in model…" | "photos are read with Gemini today; a dedicated Arabic handwriting model is planned." | Same |
| Home › Timeline › 2028 | "…such as screws, tubes and machinery" | "…about 180 downstream steel and aluminium products" | The examples are not in verified fact F9 |
| Home › Trust | "links back to the photo it came from" | "keeps the text read from its receipt, the source file name and the approver" | Photos are not stored |
| Home › App preview | 21,708 tCO2e, −49.9%, 8 receipts, clinker 0.7004 | 21,667, −50.0%, 7, 0.6990 | Now matches the app's demo data |

## Needs your decision (claims without a source, or not built yet)

1. "Fuel, electricity and delivery records on Egyptian plant floors are
   **largely handwritten** in Arabic" — no source. Keep, soften ("often"), or
   back it with your own factory interviews.
2. "Established carbon-accounting platforms … are **not built to read cursive
   Arabic handwriting**" — a claim about competitors, no source.
3. Story: the paper record "is also **invisible to every compliance system in
   Europe**" — strong wording, no source.
4. Pricing › Assured: "**Evidence pack per reporting period**" and "**On-site
   onboarding**" — not built yet (pricing is marked indicative).
5. App preview: "It **installs to the home screen on iPhone and Android**" —
   built for it, not yet tested on a real phone.
