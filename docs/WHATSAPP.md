# WhatsApp receipts (Twilio sandbox)

How it works: a worker sends a receipt photo on WhatsApp → Twilio calls
`POST /api/whatsapp` → Daman checks Twilio's signature, finds the workspace
that registered the phone number, reads the photo with the same checks as the
app, and puts it in that factory's review queue (Receipts page). The worker
gets "Received" at once and the result a few seconds later. Nothing reaches
the ledger until a reviewer approves it.

Status: built and tested with signed test requests (including Twilio's own
published signature example). Not yet tested with a real Twilio account.

## What you do (once)

1. Create a free Twilio account: https://www.twilio.com/try-twilio
2. Console → Messaging → Try it out → **Send a WhatsApp message**. Note the
   sandbox number and the join code ("join <two-words>"). Each test phone
   must send that code to the sandbox number once.
3. The webhook needs a public https address, so Daman must be online first
   (docs/SETUP.md step 3). In the sandbox settings set **When a message comes
   in** to `https://<api address>/api/whatsapp` (method POST).
4. In Vercel → daman-api → Environment Variables, paste:
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` (Twilio console home)
   - `TWILIO_WHATSAPP_FROM` = `whatsapp:` + the sandbox number
   - `WHATSAPP_WEBHOOK_URL` = exactly the URL from step 3
   - `SUPABASE_URL` = `https://sovamqmyxkptfmswcknt.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API keys:
     the secret key. Server only; never in the app or GitHub)
   - `WHATSAPP_TEST_DATA=true` while Gemini is on the free tier
5. In the app: Account → WhatsApp numbers → add each worker's phone.

## Limits to know

- Sandbox: only phones that sent the join code; Twilio's sandbox branding.
- A real number needs Meta business verification (spec decision: later).
- Gemini free tier: about 20 requests a day; each receipt uses 2.
