import { useEffect, useMemo, useRef, useState } from "react";
import { STRINGS } from "./strings.js";

// "Ask Daman": a floating button that opens a chat panel. Used by the website
// (mode "site", with the demo-request form) and the app (mode "workspace",
// with the factory's report summary as context).
//
// Display rules from the Gemini API terms for web (grounded) answers: the text
// is shown unchanged, with its links and Google's Search Suggestions, and no
// click tracking. Chat history stays on this device only.

const HISTORY_MAX = 30;
const read = (key) => {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(v) ? v.slice(-HISTORY_MAX) : [];
  } catch {
    return [];
  }
};
const write = (key, v) => {
  try {
    localStorage.setItem(key, JSON.stringify(v.slice(-HISTORY_MAX)));
  } catch {
    /* storage full or blocked: keep the chat in memory */
  }
};

/** Tiny, safe formatter: paragraphs, "- " / "* " / "1. " lists and **bold**. No HTML is injected. */
function Formatted({ text }) {
  const blocks = [];
  for (const line of String(text).split("\n")) {
    const item = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
    const last = blocks.at(-1);
    if (item) {
      if (last?.type === "ul") last.items.push(item[1]);
      else blocks.push({ type: "ul", items: [item[1]] });
    } else if (line.trim()) blocks.push({ type: "p", text: line });
  }
  const inline = (s) => s.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part));
  return blocks.map((b, i) =>
    b.type === "ul" ? (
      <ul key={i} className="my-1 list-disc space-y-0.5 ps-5">{b.items.map((x, j) => <li key={j}>{inline(x)}</li>)}</ul>
    ) : (
      <p key={i} className="my-1">{inline(b.text)}</p>
    ),
  );
}

/** Google's Search Suggestions, rendered as Google provides them, in a sandboxed frame. */
function SearchSuggestions({ html }) {
  const ref = useRef(null);
  const [h, setH] = useState(64);
  if (!html) return null;
  return (
    <iframe
      ref={ref}
      title="Google Search Suggestions"
      sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
      srcDoc={`<base target="_blank">${html}`}
      onLoad={() => {
        try {
          setH(Math.min(160, ref.current.contentDocument.body.scrollHeight + 8));
        } catch {
          /* keep default height */
        }
      }}
      style={{ height: h }}
      className="mt-2 w-full rounded-lg border-0 bg-transparent"
    />
  );
}

function Sources({ msg, s }) {
  if (msg.kind === "kb" && msg.citations?.length) {
    return (
      <div className="mt-2 border-t border-line pt-2 text-xs text-text-2">
        <p className="font-medium">{s.fromNotes}{msg.checked ? ` · ${s.checked.replace("{date}", msg.checked)}` : ""}</p>
        <ul className="mt-1 flex flex-wrap gap-1.5">
          {msg.citations.map((c) =>
            c.sources.length ? (
              c.sources.map((u, k) => (
                <li key={`${c.id}-${k}`}>
                  <a href={u} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-[220px] items-center gap-1 truncate rounded-full bg-sand px-2 py-0.5 text-nile hover:underline" dir="ltr">
                    {c.id} · {new URL(u).hostname.replace(/^www\./, "")}
                  </a>
                </li>
              ))
            ) : (
              <li key={c.id} className="rounded-full bg-sand px-2 py-0.5" dir="ltr">{c.id} · {s.noteSource}</li>
            ),
          )}
        </ul>
      </div>
    );
  }
  if (msg.kind === "web") {
    return (
      <div className="mt-2 border-t border-line pt-2 text-xs">
        <p className="font-medium text-review">{s.fromWeb}</p>
        <ol className="mt-1 list-decimal space-y-0.5 ps-5">
          {msg.links.map((l, i) => (
            <li key={i}><a href={l.uri} target="_blank" rel="noopener noreferrer" className="text-nile hover:underline">{l.title}</a></li>
          ))}
        </ol>
        <SearchSuggestions html={msg.searchSuggestions} />
      </div>
    );
  }
  return null;
}

function LeadForm({ s, lang, apiBase, onAccent, onDone }) {
  const [f, setF] = useState({ name: "", email: "", company: "", message: "", consent: false });
  const [state, setState] = useState("idle");
  const [error, setError] = useState(null);
  const input = "h-10 w-full rounded-lg border border-line bg-cream px-3 text-sm text-text focus:border-nile focus:outline-none";
  const valid = f.name.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim()) && f.consent;
  if (state === "sent") return <p className="rounded-xl bg-verified-soft px-3 py-2 text-sm text-verified">{s.lead.sent}</p>;
  return (
    <form
      className="space-y-2 rounded-xl border border-line bg-cream/60 p-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("sending");
        setError(null);
        try {
          const res = await fetch(`${apiBase}/api/lead`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, lang, consentText: s.lead.consent }) });
          const body = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(body.error || s.error);
          setState("sent");
        } catch (err) {
          setError(err.message);
          setState("idle");
        }
      }}
    >
      <p className="text-sm font-semibold">{s.lead.title}</p>
      <input aria-label={s.lead.name} placeholder={s.lead.name} className={input} maxLength={120} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <input aria-label={s.lead.email} placeholder={s.lead.email} type="email" dir="ltr" className={input} maxLength={200} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <input aria-label={s.lead.company} placeholder={s.lead.company} className={input} maxLength={160} value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} />
      <textarea aria-label={s.lead.message} placeholder={s.lead.message} rows={2} className={`${input} h-auto py-2`} maxLength={1500} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
      <label className="flex items-start gap-2 text-xs leading-relaxed text-text-2">
        <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[var(--color-nile)]" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} />
        {s.lead.consent}
      </label>
      {error && <p role="alert" className="text-xs text-anomaly">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={!valid || state === "sending"} className={`h-9 rounded-lg bg-nile px-3 text-sm font-semibold ${onAccent} disabled:opacity-50`}>{s.lead.submit}</button>
        <button type="button" onClick={onDone} className="h-9 rounded-lg px-3 text-sm text-text-2 hover:bg-sand">{s.lead.cancel}</button>
      </div>
    </form>
  );
}

/**
 * @param {{ mode: "site"|"workspace", lang: "en"|"ar", apiBase?: string, storageKey: string,
 *           getContext?: () => object|null, contextShared?: boolean, offset?: string }} props
 */
export default function ChatWidget({ mode, lang, apiBase = "", storageKey, getContext, contextShared = false, offset = "bottom-5", onAccent = "text-white" }) {
  const s = STRINGS[lang] ?? STRINGS.en;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => read(storageKey));
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [lead, setLead] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => write(storageKey, messages), [storageKey, messages]);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, busy, lead, open]);
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const wantsDemo = useMemo(() => mode === "site" && messages.some((m) => m.wantsDemo), [mode, messages]);

  async function ask(q) {
    const question = q.trim();
    if (!question || busy) return;
    const next = [...messages, { role: "user", text: question }];
    setMessages(next);
    setText("");
    setBusy(true);
    try {
      const history = next.filter((m) => m.role === "user" || m.kind === "kb" || m.kind === "web").map((m) => ({ role: m.role, text: m.text }));
      const context = mode === "workspace" && contextShared ? getContext?.() ?? null : null;
      const res = await fetch(`${apiBase}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, lang, mode, ...(context ? { context } : {}) }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || s.error);
      setMessages((m) => [...m, { role: "assistant", ...body }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", kind: "error", text: err.message || s.error }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`fixed end-5 ${offset} z-40 inline-flex h-12 items-center gap-2 rounded-full bg-nile px-5 text-sm font-semibold ${onAccent} shadow-float transition-transform hover:scale-[1.03] active:scale-[0.98]`}
        >
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h12v9H8l-4 3z" /><path d="M7.5 8h5M7.5 10.5h3" /></svg>
          {s.open}
        </button>
      )}
      {open && (
        <section
          role="dialog"
          aria-label={s.title}
          dir={lang === "ar" ? "rtl" : "ltr"}
          className={`fixed inset-x-3 ${offset} z-50 flex max-h-[min(640px,calc(100dvh-6rem))] flex-col overflow-hidden rounded-2xl border border-line bg-card text-text shadow-float sm:inset-x-auto sm:end-5 sm:w-[400px]`}
        >
          <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
            <div>
              <h2 className="text-[15px] font-semibold">{s.title}</h2>
              <p className="text-xs text-text-2">{s.subtitle[mode]}</p>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button type="button" onClick={() => window.confirm(s.clearConfirm) && setMessages([])} className="rounded-lg px-2 py-1 text-xs text-text-2 hover:bg-sand">{s.clear}</button>
              )}
              <button type="button" onClick={() => setOpen(false)} aria-label={s.close} className="rounded-lg p-1.5 text-text-2 hover:bg-sand">
                <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" /></svg>
              </button>
            </div>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm leading-relaxed" aria-live="polite">
            {mode === "workspace" && <p className="rounded-lg bg-sand px-3 py-2 text-xs text-text-2">{contextShared ? s.contextOn : s.contextOff}</p>}
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {s.suggestions[mode].map((q) => (
                  <button key={q} type="button" onClick={() => ask(q)} className="rounded-full border border-line px-3 py-1.5 text-start text-xs text-text hover:border-nile hover:text-nile">{q}</button>
                ))}
              </div>
            )}
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className={`ms-10 rounded-2xl rounded-ee-sm bg-nile px-3 py-2 ${onAccent}`}><p className="whitespace-pre-wrap">{m.text}</p></div>
              ) : (
                <div key={i} className={`me-6 rounded-2xl rounded-es-sm px-3 py-2 ${m.kind === "error" ? "bg-anomaly-soft text-anomaly" : "bg-sand"}`}>
                  <Formatted text={m.text} />
                  <Sources msg={m} s={s} />
                </div>
              ),
            )}
            {busy && <p className="me-6 animate-pulse rounded-2xl bg-sand px-3 py-2 text-text-2">{s.thinking}</p>}
            {wantsDemo && !lead && (
              <button type="button" onClick={() => setLead(true)} className="rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-nile-deep">{s.lead.cta}</button>
            )}
            {lead && <LeadForm s={s} lang={lang} apiBase={apiBase} onAccent={onAccent} onDone={() => setLead(false)} />}
          </div>

          <form
            className="flex items-end gap-2 border-t border-line px-3 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              ask(text);
            }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              maxLength={1500}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask(text);
                }
              }}
              placeholder={s.placeholder}
              aria-label={s.placeholder}
              className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-line bg-cream px-3 py-2 text-sm text-text focus:border-nile focus:outline-none"
            />
            <button type="submit" disabled={!text.trim() || busy} className={`h-10 rounded-xl bg-nile px-4 text-sm font-semibold ${onAccent} disabled:opacity-50`}>{s.send}</button>
          </form>
          <p className="px-4 pb-3 text-[11px] leading-snug text-muted">{s.disclaimer} {s.savedHere}</p>
        </section>
      )}
    </>
  );
}
