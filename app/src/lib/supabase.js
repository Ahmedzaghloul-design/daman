// Supabase client. The URL and publishable key are public by design (they
// identify the project; row-level security in the database decides what each
// signed-in person may read or write). Never put a secret/service key here.
import { createClient } from "@supabase/supabase-js";

const URL = import.meta.env.VITE_SUPABASE_URL || "https://sovamqmyxkptfmswcknt.supabase.co";
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_cvpLCUUEVeDSTEW0W14UXQ_JqAiIJsy";

export const supabase = createClient(URL, KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
});

/** Throw a readable error when a Supabase call fails. */
export function must({ data, error }) {
  if (error) throw new Error(error.message || "Cloud request failed.");
  return data;
}
