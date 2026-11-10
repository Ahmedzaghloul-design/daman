// ---------------------------------------------------------------------------
// WhatsApp receipt intake (Twilio). A factory worker sends a photo of a
// receipt to the Daman WhatsApp number; it is read with the same photo checks
// as the app and lands in that factory's review queue. Nothing reaches the
// ledger until a reviewer approves it in the app.
//
// Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
// ("whatsapp:+1..." from the Twilio console), WHATSAPP_WEBHOOK_URL (the exact
// URL set in Twilio), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// WHATSAPP_TEST_DATA=true while Gemini is on the unpaid tier.
// ---------------------------------------------------------------------------
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { auditReceiptImage, IMAGE_TYPES, MOCK, PAID_TIER, toUserError } from "./geminiApi.js";

const MAX_MEDIA_BYTES = 3 * 1024 * 1024;

/**
 * Twilio's request signature (twilio.com/docs/usage/security): the full URL,
 * then every POST parameter name+value sorted by name, HMAC-SHA1 with the
 * Auth Token, base64.
 */
export function twilioSignature(url, params, authToken) {
  const data = Object.keys(params)
    .sort()
    .reduce((acc, k) => acc + k + params[k], url);
  return crypto.createHmac("sha1", authToken).update(Buffer.from(data, "utf8")).digest("base64");
}

export function validSignature(url, params, authToken, header) {
  if (!header || !authToken) return false;
  const expected = Buffer.from(twilioSignature(url, params, authToken));
  const got = Buffer.from(String(header));
  return expected.length === got.length && crypto.timingSafeEqual(expected, got);
}

/** "whatsapp:+201001234567" -> "+201001234567" (null if not a valid number). */
export function phoneFrom(from) {
  const p = String(from ?? "").replace(/^whatsapp:/, "").trim();
  return /^\+[1-9]\d{7,14}$/.test(p) ? p : null;
}

const xml = (s) => String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);
export const twiml = (text) => `<?xml version="1.0" encoding="UTF-8"?><Response>${text ? `<Message>${xml(text)}</Message>` : ""}</Response>`;

/** Short bilingual reply text (the sender may read either). */
export const MSG = {
  notRegistered: "This number is not registered with a Daman workspace. Ask your factory owner to add it in the app (Account → WhatsApp numbers).\nهذا الرقم غير مسجّل في مساحة عمل ضمان. اطلب من مالك المصنع إضافته في التطبيق.",
  noPhoto: "Send a photo of one fuel or energy receipt.\nأرسل صورة إيصال وقود أو طاقة واحد.",
  blocked: "Real receipts are paused until the factory owner turns on Gemini billing. Nothing was stored.\nالإيصالات الحقيقية متوقفة حتى يفعّل المالك الدفع في Gemini. لم يُحفظ شيء.",
  received: "Received. Daman is reading your receipt; you'll get the result in a moment.\nتم الاستلام. يقرأ ضمان الإيصال الآن وستصلك النتيجة بعد قليل.",
  tooBig: "The file is larger than 3 MB. Send a normal photo instead.\nالملف أكبر من 3 ميجابايت. أرسل صورة عادية.",
  wrongType: "Send a photo (JPG/PNG) or a PDF of the receipt.\nأرسل صورة أو ملف PDF للإيصال.",
};

export function resultMessage(audit) {
  const r = audit.receipt;
  const qty = r.volume == null ? "?" : Number(r.volume).toLocaleString("en-US");
  const lines = [`Read: ${r.energy_type || "?"} ${qty} ${r.unit || ""}, date ${r.date || "?"}.`];
  if (audit.reviewReasons.includes("illegibleDigits")) lines.push("Some digits were unreadable: your reviewer will check them.");
  if (audit.massBalance?.anomaly) lines.push("This amount looks unusual for your production: your reviewer will check it.");
  lines.push("Sent to your reviewer. Nothing is final until they approve it in the app.");
  lines.push("أُرسل إلى المراجع. لا يُعتمد شيء حتى يوافق عليه في التطبيق.");
  return lines.join("\n");
}

let admin = null;
function db() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  admin ??= createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  return admin;
}

/** Download Twilio media. Only Twilio's API host is ever fetched (no open proxy). */
async function downloadMedia(url) {
  const u = new URL(url);
  if (u.protocol !== "https:" || u.hostname !== "api.twilio.com") throw Object.assign(new Error("Unexpected media host."), { userMsg: MSG.wrongType });
  const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
  const res = await fetch(u, { headers: { Authorization: `Basic ${auth}` }, redirect: "follow" });
  if (!res.ok) throw new Error(`Media download failed (${res.status}).`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_MEDIA_BYTES) throw Object.assign(new Error("Media too large."), { userMsg: MSG.tooBig });
  return buf.toString("base64");
}

/** Send a WhatsApp message through Twilio's Messages API. */
export async function sendWhatsApp(to, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ From: process.env.TWILIO_WHATSAPP_FROM, To: to, Body: body.slice(0, 1500) }),
  });
  if (!res.ok) console.error("[whatsapp] reply failed:", res.status, (await res.text()).slice(0, 300));
}

/**
 * Decide what to do with one incoming message. Returns { reply, work } where
 * reply is sent at once (Twilio waits at most 15 s) and work, if any, is the
 * slow part (Gemini) that finishes afterwards and messages the sender.
 */
export async function handleIncoming(params) {
  const phone = phoneFrom(params.From);
  const client = db();
  if (!phone || !client) return { reply: MSG.notRegistered };

  const { data: sender } = await client.from("whatsapp_senders").select("workspace_id, label").eq("phone", phone).maybeSingle();
  if (!sender) return { reply: MSG.notRegistered };

  const n = Number(params.NumMedia) || 0;
  const mimeType = String(params.MediaContentType0 ?? "");
  if (n < 1) return { reply: MSG.noPhoto };
  if (!IMAGE_TYPES.includes(mimeType)) return { reply: MSG.wrongType };

  const testData = String(process.env.WHATSAPP_TEST_DATA).toLowerCase() === "true";
  if (!MOCK && !PAID_TIER && !testData) return { reply: MSG.blocked };

  const work = async () => {
    try {
      const { data: ws } = await client.from("workspaces").select("settings").eq("id", sender.workspace_id).single();
      const s = ws?.settings ?? {};
      const data = await downloadMedia(params.MediaUrl0);
      const audit = await auditReceiptImage({
        data,
        mimeType,
        productionTonnes: Number(s.productionTonnes) || 1200,
        sector: "cement",
        benchmarks: s.benchmarks,
      });
      const { error } = await client.from("pending_receipts").insert({
        workspace_id: sender.workspace_id,
        uploader_email: `WhatsApp ${phone}${sender.label ? ` (${sender.label})` : ""}`,
        data: {
          receipt: audit.receipt, audit, rawText: audit.rawText, edited: false,
          sourceFile: `whatsapp-${params.MessageSid ?? "photo"}`, productionTonnes: Number(s.productionTonnes) || 1200,
          installationId: "", productId: "", testData,
        },
      });
      if (error) throw new Error(error.message);
      await sendWhatsApp(params.From, resultMessage(audit));
    } catch (err) {
      console.error("[whatsapp] failed:", String(err?.message ?? err).slice(0, 300));
      await sendWhatsApp(params.From, err.userMsg ?? `Daman could not read this receipt: ${toUserError(err).message}`);
    }
  };
  return { reply: MSG.received, work };
}
