# Daman setup guide (things only the owner can do)

Each step says where to click. Nothing here needs code. Never paste a secret
key into chat, the code, or GitHub: only into the website named in the step.

## 1. Sign-in emails (Supabase): needed now, even on your laptop

Project: **daman** (Frankfurt) at https://supabase.com/dashboard/project/sovamqmyxkptfmswcknt

1. **Authentication → URL Configuration**
   - Site URL: `http://localhost:5174`
   - Redirect URLs: add `http://localhost:5174/**`
   - After deploying (step 3), add the app's Vercel address too, e.g. `https://daman-app.vercel.app/**`.
2. **Authentication → Emails → Magic Link** template: add this line, so the
   email also carries a 6-digit code (the installed phone app needs it,
   because tapping a link opens the browser instead of the app):
   `Your code: {{ .Token }}`
3. Who can receive sign-in emails: until you add your own email service,
   Supabase only sends to **members of your Supabase organization**, with a
   low hourly limit (Supabase docs: "Send emails with custom SMTP").
   - For testing: use your own email, or invite teammates to the org
     (**Organization → Team**).
   - Before real factory staff sign in: **Authentication → Emails → SMTP
     Settings**, using an email service such as Resend (free tier).

## 2. Gemini (Google AI Studio)

- Free tier: about 20 requests a day for `gemini-3.6-flash` (seen 2026-11-10;
  Google can change it). Each receipt uses 2 requests.
- Google's terms: on the unpaid tier, content may be used to improve Google
  products and read by human reviewers. Daman therefore blocks real receipt
  photos until billing is on.
- To turn on billing: https://aistudio.google.com → **Billing**. Then set
  `GEMINI_BILLING=paid` in `.env` (and in Vercel, step 3).

## 3. Putting Daman online (Vercel) — only after you say yes

Three projects from the GitHub repo `Ahmedzaghloul-design/daman`:

| Project | Root directory | Environment variables (Vercel → Settings → Environment Variables) |
|---|---|---|
| daman-api | `api` | `GEMINI_API_KEY` (you paste it), `GEMINI_MODEL=gemini-3.6-flash`, `GEMINI_BILLING=paid` only once billing is on |
| daman-app | `app` | `VITE_WEBSITE_URL=<website address>` |
| daman-website | `website` | `VITE_APP_URL=<app address>` |

After the projects exist, the app and website need one rewrite each, so
`/api/...` reaches the API. Add to `app/vercel.json` and `website/vercel.json`,
before the existing rewrite:

```json
{ "source": "/api/:path*", "destination": "https://<api address>/api/:path*" }
```

Then add the app address to Supabase (step 1.1).

## 4. WhatsApp receipts (Twilio sandbox)

See `docs/WHATSAPP.md`.
