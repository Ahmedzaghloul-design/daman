// Demo requests from the website chatbot. Saved only after the visitor ticks
// consent. Uses the public (publishable) key: the database lets anyone insert
// a lead but nobody read one back (team reads them in the Supabase dashboard).
import { createClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL || "https://sovamqmyxkptfmswcknt.supabase.co";
const KEY = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_cvpLCUUEVeDSTEW0W14UXQ_JqAiIJsy";
let client = null;

export function cleanLead(b) {
  const s = (v, n) => String(v ?? "").trim().slice(0, n);
  const lead = { name: s(b?.name, 120), email: s(b?.email, 200).toLowerCase(), company: s(b?.company, 160), message: s(b?.message, 1500), lang: b?.lang === "ar" ? "ar" : "en", consent_text: s(b?.consentText, 600) };
  if (!lead.name) throw Object.assign(new Error("Name is required."), { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(lead.email)) throw Object.assign(new Error("A valid email is required."), { status: 400 });
  if (b?.consent !== true || lead.consent_text.length < 10) throw Object.assign(new Error("Consent is required."), { status: 400 });
  return lead;
}

export async function saveLead(lead) {
  client ??= createClient(URL, KEY, { auth: { persistSession: false } });
  const { error } = await client.from("leads").insert(lead);
  if (error) throw Object.assign(new Error("Could not save the request. Try again later."), { status: 502, cause: error });
}
