# Presentation mode (for judges)

A guided tour of the demo plant in 11 steps. You click Next; a small card
says the point of each step in one sentence.

## Start it

1. On your laptop: `npm run dev`
2. Open http://localhost:5174/present (or App → Settings → Start presentation)

It always starts from the clean demo plant, in English. It never changes a
signed-in factory workspace: it switches to "Demo on this device".

## During the presentation

- **Next / Back** on the card, or the → and ← keys. **Esc** leaves.
- **العربية** on the card switches the whole app to Arabic.
- Two steps ask you to click in the app yourself (judges see a person decide):
  step 3 **Reject**, step 5 **Approve and add to ledger**.
- "Run this step again" replays the current receipt or chat step.

| # | Step | What judges see |
|---|---|---|
| 1 | Welcome | The plant's overview |
| 2 | Unclear receipt | "12?00": the unreadable digit is flagged, with every reason |
| 3 | Reject | Nothing reaches the ledger |
| 4 | Unusual receipt | 15,000 L diesel = 12.5 L/t vs the normal 1–6: flagged by code |
| 5 | A person approves | Reason written, fields checked; you click Approve |
| 6 | Ledger | The new entry with its source text and reviewer |
| 7 | Report | Per product, direct + indirect, share backed by real data |
| 8 | Cost | What EU buyers pay on default values |
| 9 | Ask Daman | A question answered with official sources |
| 10 | Verifier | Read-only checking, comments, roles |
| 11 | End | "AI reads. Code calculates. A person approves." |

## Recorded or live

- **Off (default):** steps 2 and 4 replay real Gemini answers recorded on
  10 Nov 2026. No Gemini requests, nothing can run out mid-demo.
- **Live Gemini on:** the same steps go to Gemini (about 3–4 requests). Only
  turn it on if the daily free limit has room and the internet is good.
- The chatbot step currently shows a **prepared answer** written from verified
  notes F10 and F12, labelled as such. To replace it with a real recorded
  Gemini answer (uses 2–4 requests), run once when the quota allows:
  `node scripts/record_presentation.mjs`

## Before you present

- Run it once end to end. Close other tabs; use full screen (F11 / ⌃⌘F).
- Fonts load from Google Fonts: without internet the app still works, with
  system fonts.
