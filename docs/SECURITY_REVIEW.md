# Security review — Phase 6 (2026-11-11)

Scope: the API (`api/`), the database rules (Supabase project "daman"), the
sign-in flow, the website and the app. Nothing is online; this reviews the
code and the database as they are.

## Checked and fine

- **Secrets:** no API key, token or secret key in the code or anywhere in the
  Git history; `.env` is ignored. The Gemini key and (later) the Supabase
  secret key and Twilio token live only on the server.
- **Packages:** `npm audit` finds 0 known vulnerabilities in production
  dependencies.
- **Database rules:** every table has row-level security. Tested with fake
  users (rolled back): strangers see nothing, uploaders can't read the ledger
  or costs, verifiers can't change anything, nobody can approve in someone
  else's name (the database stamps the signed-in email), the ledger can't be
  edited after approval, entry numbers are assigned by the database.
- **WhatsApp webhook:** every message must carry Twilio's signature (checked
  against Twilio's published example); unknown numbers are refused; photos
  are only downloaded from `api.twilio.com` (no open proxy).
- **Chatbot:** page text, receipts and factory data are passed to Gemini as
  data, never as instructions; numbers in "verified notes" answers are checked
  by code; web answers are shown unchanged with their sources.
- **Website and app:** no raw HTML is inserted into pages (the only HTML is
  Google's Search Suggestions, inside a sandboxed frame with scripts disabled).
- **Sign-in:** email link or code (no passwords), PKCE flow.

## Fixed in this review

1. **Least privilege in the database:** visitors and users had Supabase's
   default table rights (including delete and truncate), held back only by
   the row rules. Now each role has only the operations the app uses.
   Migration `20261111090000_least_privilege_hardening.sql`.
2. **Joining a workspace needs a confirmed email** (`accept_invitations`).
3. **Approved entries are limited to 50 kB** (`add_entry`).
4. **API security headers:** `nosniff`, no referrer, a locked-down
   Content-Security-Policy, no caching; the `X-Powered-By` header is removed.
5. **Website and app security headers** for when they're hosted (in
   `vercel.json`): no framing (clickjacking), `nosniff`, HTTPS only (HSTS),
   strict referrer, camera only for the app.

## Needs your decision before going online

| # | Finding | Risk when online | Options |
|---|---|---|---|
| A | The receipt and chatbot endpoints don't require sign-in | Anyone who finds the API address can use up the Gemini quota (about 20 requests/day on the free tier) | Require sign-in for receipts (the website chatbot stays public, with its rate limit); or keep open with rate limits only |
| B | The "this is test data" box is decided by the browser | Someone could send real data to the free tier by ticking it; it is an accident guard, not a lock | Fine for a demo; for live use turn on billing so the guard isn't needed |
| C | Demo requests go straight to the database with the public key | Bots could fill the table with spam (size limits apply; nobody can read it back) | Add a CAPTCHA (e.g. Cloudflare Turnstile) or route requests through the server only |
| D | Rate limits are kept in memory | On Vercel each running copy counts separately, so the limit is softer than it looks | Use a shared store (e.g. Upstash Redis) when traffic matters |

## Before launch (no decision needed, just steps)

- Supabase dashboard: own email service (SMTP), CAPTCHA on sign-in, the exact
  redirect addresses only, short code expiry.
- A Content-Security-Policy for the website and app, tested on the live
  address (fonts, Supabase and the API must be allowed).
- Backups (Supabase free plan has none you can restore yourself) and a
  re-run of this review on the live setup.
