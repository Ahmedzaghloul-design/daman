// Runs the real /api/audit route in mock mode (no Gemini calls, no API key).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";

process.env.GEMINI_MOCK = "true";
const { app, realDataBlocked, rateLimit } = await import("../app.js");
const { validateReceipt } = await import("../services/geminiApi.js");

let server;
let base;
before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const audit = (body) =>
  fetch(`${base}/api/audit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

test("health reports mock mode", async () => {
  const r = await fetch(`${base}/api/health`).then((res) => res.json());
  assert.equal(r.ok, true);
  assert.equal(r.mock, true);
});

test("rejects missing and oversized text", async () => {
  assert.equal((await audit({})).status, 400);
  assert.equal((await audit({ rawText: "x".repeat(5001) })).status, 413);
});

test("diesel sample: parsed, anomaly flagged", async () => {
  const r = await (await audit({ rawText: "مصنع الفراعنة للأسمنت - ١٥٠٠٠ لتر سولار - التاريخ ١٥ مارس ٢٠٢٦", productionTonnes: 1200 })).json();
  assert.equal(r.receipt.volume, 15000);
  assert.equal(r.receipt.unit, "L");
  assert.equal(r.receipt.date, "2026-03-15");
  assert.equal(r.massBalance.anomaly, true);
  assert.ok(r.reviewReasons.includes("anomaly"));
});

test("illegible digit forces review", async () => {
  const r = await (await audit({ rawText: "مصنع الفراعنة للأسمنت - ١٢؟٠٠ لتر سولار - التاريخ ؟ مارس ٢٠٢٦", productionTonnes: 1200 })).json();
  assert.ok(r.reviewReasons.includes("illegibleDigits"));
  assert.equal(r.receipt.requires_human_review, true);
});

test("validator forces review on low confidence even if the model says no", () => {
  const { receipt, reasons } = validateReceipt({
    factory_name: "X", energy_type: "Diesel", volume: 10, unit: "L", date: "2026-01-01",
    confidence_score: 0.5, requires_human_review: false,
  });
  assert.equal(receipt.requires_human_review, true);
  assert.ok(reasons.includes("lowConfidence"));
});

const auditImage = (body) =>
  fetch(`${base}/api/audit-image`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

test("photo route: validates input", async () => {
  assert.equal((await auditImage({})).status, 400);
  assert.equal((await auditImage({ image: "AAAA", mimeType: "text/html" })).status, 415);
  assert.equal((await auditImage({ image: "A".repeat(4.2 * 1024 * 1024), mimeType: "image/jpeg" })).status, 413);
});

test("photo route (mock): same checks as text, transcription returned", async () => {
  const r = await (await auditImage({ image: "AAAA", mimeType: "image/jpeg", productionTonnes: 1200 })).json();
  assert.equal(r.source, "vision");
  assert.match(r.rawText, /لتر/);
  assert.equal(r.receipt.volume, 15000);
  assert.ok(r.reviewReasons.includes("anomaly"));
});

test("real photos are blocked on the unpaid tier unless marked as test data", () => {
  assert.equal(realDataBlocked({ mock: false, paid: false, testData: false }), true);
  assert.equal(realDataBlocked({ mock: false, paid: false }), true);
  assert.equal(realDataBlocked({ mock: false, paid: false, testData: true }), false);
  assert.equal(realDataBlocked({ mock: false, paid: true, testData: false }), false);
});

test("rate limit answers 429 after the limit", () => {
  const mw = rateLimit({ windowMs: 60_000, max: 2 });
  const res = { code: 200, headers: {}, set(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json() { return this; } };
  let passed = 0;
  for (let i = 0; i < 3; i++) mw({ ip: "1.2.3.4" }, res, () => passed++);
  assert.equal(passed, 2);
  assert.equal(res.code, 429);
  mw({ ip: "5.6.7.8" }, { ...res, code: 200 }, () => passed++);
  assert.equal(passed, 3);
});

const { twilioSignature, validSignature, phoneFrom, twiml, resultMessage } = await import("../services/whatsapp.js");

test("Twilio signature matches Twilio's published example", () => {
  // twilio.com/docs/usage/security worked example (AuthToken 12345).
  const url = "https://example.com/myapp.php?foo=1&bar=2";
  const params = { Digits: "1234", To: "+18005551212", From: "+14158675310", Caller: "+14158675310", CallSid: "CA1234567890ABCDE" };
  assert.equal(twilioSignature(url, params, "12345"), "L/OH5YylLD5NRKLltdqwSvS0BnU=");
  assert.equal(validSignature(url, params, "12345", "L/OH5YylLD5NRKLltdqwSvS0BnU="), true);
  assert.equal(validSignature(url, { ...params, Digits: "9999" }, "12345", "L/OH5YylLD5NRKLltdqwSvS0BnU="), false);
  assert.equal(validSignature(url, params, "12345", undefined), false);
});

test("WhatsApp helpers: phone parsing, safe XML, result text", () => {
  assert.equal(phoneFrom("whatsapp:+201001234567"), "+201001234567");
  assert.equal(phoneFrom("whatsapp:+0123"), null);
  assert.equal(twiml("a<b & 'c'"), '<?xml version="1.0" encoding="UTF-8"?><Response><Message>a&lt;b &amp; &apos;c&apos;</Message></Response>');
  const msg = resultMessage({ receipt: { energy_type: "Diesel", volume: 8500, unit: "L", date: "2026-04-20" }, reviewReasons: ["illegibleDigits"], massBalance: { anomaly: true } });
  assert.match(msg, /Diesel 8,500 L, date 2026-04-20/);
  assert.match(msg, /unreadable/);
  assert.match(msg, /unusual/);
});

test("WhatsApp webhook rejects unsigned requests", async () => {
  process.env.TWILIO_AUTH_TOKEN = "test-token";
  process.env.WHATSAPP_WEBHOOK_URL = `${base}/api/whatsapp`;
  const body = new URLSearchParams({ From: "whatsapp:+201001234567", NumMedia: "0" });
  const bad = await fetch(`${base}/api/whatsapp`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Twilio-Signature": "nope" }, body });
  assert.equal(bad.status, 403);
  const sig = twilioSignature(`${base}/api/whatsapp`, Object.fromEntries(body), "test-token");
  const ok = await fetch(`${base}/api/whatsapp`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Twilio-Signature": sig }, body });
  assert.equal(ok.status, 200);
  assert.match(await ok.text(), /not registered/); // no Supabase configured in tests -> unknown sender
  delete process.env.TWILIO_AUTH_TOKEN;
  delete process.env.WHATSAPP_WEBHOOK_URL;
});

const { cleanRequest, unsupportedNumbers, numbersIn } = await import("../services/chat.js");
const { cleanLead } = await import("../services/leads.js");

test("chat: request validation and limits", () => {
  assert.throws(() => cleanRequest({}), /required/);
  assert.throws(() => cleanRequest({ messages: [{ role: "assistant", text: "hi" }] }), /question/);
  const r = cleanRequest({ messages: Array.from({ length: 20 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", text: "x".repeat(3000) })).concat([{ role: "user", text: "q" }]), lang: "ar", mode: "site", context: { a: 1 } });
  assert.equal(r.messages.length, 8);
  assert.equal(r.messages[0].text.length, 1500);
  assert.equal(r.lang, "ar");
  assert.equal(r.context, ""); // context only in workspace mode
  assert.throws(() => cleanRequest({ messages: [{ role: "user", text: "q" }], mode: "workspace", context: { big: "x".repeat(9000) } }), /too large/);
});

test("chat: numbers must come from the notes or conversation", () => {
  assert.deepEqual(numbersIn("Q3 €82.32, mark-up 10%, 1,500 USD, ٢٠٢٦"), ["3", "82.32", "10", "1500", "2026"]);
  const notes = "Q3 €82.32 (5 Oct 2026); +10% in 2026, +20% in 2027";
  assert.deepEqual(unsupportedNumbers("The Q3 2026 price was €82.32 and the mark-up is 20% in 2027.", notes), []);
  assert.deepEqual(unsupportedNumbers("The price will be €95.10 in 2027.", notes), ["95.10"]);
  assert.deepEqual(unsupportedNumbers("Three steps: 1, 2, 3.", notes), []);
});

test("chat (mock): answers from notes with official sources; off-topic refused", async () => {
  const post = (body) => fetch(`${base}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());
  const a = await post({ messages: [{ role: "user", text: "What is the default value mark-up for cement?" }], lang: "en" });
  assert.equal(a.kind, "kb");
  assert.ok(a.citations.some((c) => c.id === "F3" && c.sources.length));
  const b = await post({ messages: [{ role: "user", text: "Tell me a joke about football" }], lang: "en" });
  assert.equal(b.kind, "refusal");
});

test("lead: consent and email required", () => {
  assert.throws(() => cleanLead({ name: "A", email: "a@b.co" }), /Consent/);
  assert.throws(() => cleanLead({ name: "A", email: "nope", consent: true, consentText: "I agree to be contacted." }), /email/);
  const l = cleanLead({ name: " Mona ", email: "MONA@Factory.EG", consent: true, consentText: "I agree to be contacted about a demo." });
  assert.equal(l.email, "mona@factory.eg");
  assert.equal(l.name, "Mona");
});

test("security headers on every API answer", async () => {
  const r = await fetch(`${base}/api/health`);
  assert.equal(r.headers.get("x-powered-by"), null);
  assert.equal(r.headers.get("x-content-type-options"), "nosniff");
  assert.match(r.headers.get("content-security-policy"), /default-src 'none'/);
});
