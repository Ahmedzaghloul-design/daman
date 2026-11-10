import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useAuth } from "../state/Auth.jsx";
import { must, supabase } from "../lib/supabase.js";
import { Button, Field, inputClass, Num, PageHeader, Panel } from "../components/ui.jsx";

const INVITE_ROLES = ["reviewer", "uploader", "verifier"];

export default function Account() {
  const { t } = useLanguage();
  const auth = useAuth();
  if (!auth.ready) return <PageHeader title={t("account.title")} />;
  return (
    <>
      <PageHeader title={t("account.title")} subtitle={t("account.subtitle")} />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {auth.session ? <Workspaces /> : <SignIn />}
        {auth.workspace?.role === "owner" && <Team />}
      </div>
    </>
  );
}

function SignIn() {
  const { t } = useLanguage();
  const { sendLink, verifyCode } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const run = (fn) => async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel title={t("account.signIn")}>
      <p className="text-sm leading-relaxed text-text-2">{t("account.signInBody")}</p>
      <form className="mt-4 space-y-3" onSubmit={run(async () => { await sendLink(email); setSent(true); })}>
        <Field label={t("account.email")}>
          <input type="email" dir="ltr" autoComplete="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Button type="submit" disabled={!valid || busy}>{t(sent ? "account.resend" : "account.sendLink")}</Button>
      </form>
      {sent && (
        <form className="mt-5 space-y-3 border-t border-line pt-4" onSubmit={run(() => verifyCode(email, code))}>
          <p className="text-sm text-verified">{t("account.sent", { email: email.trim() })}</p>
          <Field label={t("account.code")} hint={t("account.codeHint")}>
            <input inputMode="numeric" autoComplete="one-time-code" dir="ltr" maxLength={10} className={`${inputClass} tabular-nums tracking-[0.3em]`} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
          </Field>
          <Button type="submit" variant="secondary" disabled={code.length < 6 || busy}>{t("account.verify")}</Button>
        </form>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-anomaly">{error}</p>}
    </Panel>
  );
}

function Workspaces() {
  const { t } = useLanguage();
  const { email, workspaces, workspace, selectWorkspace, createWorkspace, signOut } = useAuth();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const option = (id, label, sub) => (
    <label key={id ?? "local"} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 ${(workspace?.id ?? null) === id ? "border-nile bg-nile/10" : "border-line"}`}>
      <input type="radio" name="ws" className="size-4 accent-[var(--color-nile)]" checked={(workspace?.id ?? null) === id} onChange={() => selectWorkspace(id)} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted">{sub}</span>
      </span>
    </label>
  );
  return (
    <Panel title={t("account.workspaces")} actions={<Button variant="secondary" onClick={signOut}>{t("account.signOut")}</Button>}>
      <p className="text-sm text-text-2">{t("account.signedInAs")} <Num className="text-text">{email}</Num></p>
      <div className="mt-4 space-y-2">
        {workspaces.map((w) => option(w.id, w.name, t(`roles.${w.role}`)))}
        {option(null, t("account.demoMode"), t("account.demoModeSub"))}
      </div>
      {!workspaces.length && <p className="mt-3 text-sm text-text-2">{t("account.none")}</p>}
      <form
        className="mt-5 flex flex-wrap items-end gap-2 border-t border-line pt-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await createWorkspace(name.trim());
            setName("");
          } catch (err) {
            setError(err.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label={t("account.newWorkspace")} className="min-w-0 flex-1">
          <input className={inputClass} maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("account.newPlaceholder")} />
        </Field>
        <Button type="submit" disabled={!name.trim() || busy}>{t("account.create")}</Button>
      </form>
      {error && <p role="alert" className="mt-3 text-sm text-anomaly">{error}</p>}
    </Panel>
  );
}

/** Owner only: members, invitations and the access log. */
function Team() {
  const { t } = useLanguage();
  const { workspace, session } = useAuth();
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [log, setLog] = useState([]);
  const [numbers, setNumbers] = useState([]);
  const [phone, setPhone] = useState("");
  const [label, setLabel] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("reviewer");
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const ws = workspace.id;
    const [m, i, l, w] = await Promise.all([
      supabase.from("members").select("user_id, email, role").eq("workspace_id", ws).order("created_at"),
      supabase.from("invitations").select("id, email, role, accepted_at").eq("workspace_id", ws).order("created_at"),
      supabase.from("access_log").select("id, email, action, target, created_at").eq("workspace_id", ws).order("created_at", { ascending: false }).limit(50),
      supabase.from("whatsapp_senders").select("phone, label").eq("workspace_id", ws).order("created_at"),
    ]);
    setNumbers(must(w));
    setMembers(must(m));
    setInvites(must(i));
    setLog(must(l));
  }, [workspace.id]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  const act = (fn) => async (...args) => {
    setError(null);
    try {
      await fn(...args);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };
  const invite = act(async (e) => {
    e.preventDefault();
    must(await supabase.from("invitations").insert({ workspace_id: workspace.id, email: email.trim().toLowerCase(), role, invited_by: session.user.id }));
    setEmail("");
  });
  const changeRole = act(async (userId, r) => must(await supabase.from("members").update({ role: r }).eq("workspace_id", workspace.id).eq("user_id", userId)));
  const remove = act(async (userId) => must(await supabase.from("members").delete().eq("workspace_id", workspace.id).eq("user_id", userId)));
  const cancel = act(async (id) => must(await supabase.from("invitations").delete().eq("id", id)));
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  // International format, e.g. +201001234567 (Egypt: +20, then the number without its first 0).
  const e164 = phone.replace(/[\s()-]/g, "");
  const validPhone = /^\+[1-9]\d{7,14}$/.test(e164);
  const addNumber = act(async (e) => {
    e.preventDefault();
    must(await supabase.from("whatsapp_senders").insert({ workspace_id: workspace.id, phone: e164, label: label.trim(), created_by: session.user.id }));
    setPhone("");
    setLabel("");
  });
  const removeNumber = act(async (p) => must(await supabase.from("whatsapp_senders").delete().eq("workspace_id", workspace.id).eq("phone", p)));

  return (
    <div className="space-y-5">
      <Panel title={t("account.team")}>
        <ul className="divide-y divide-line">
          {members.map((m) => (
            <li key={m.user_id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
              <Num className="min-w-0 flex-1 truncate">{m.email}</Num>
              {m.user_id === session.user.id ? (
                <span className="text-xs text-muted">{t("roles.owner")} · {t("account.you")}</span>
              ) : (
                <>
                  <select aria-label={t("account.role")} className={`${inputClass} w-auto`} value={m.role} onChange={(e) => changeRole(m.user_id, e.target.value)}>
                    {["owner", ...INVITE_ROLES].map((r) => <option key={r} value={r}>{t(`roles.${r}`)}</option>)}
                  </select>
                  <Button variant="danger" onClick={() => window.confirm(t("account.removeConfirm", { email: m.email })) && remove(m.user_id)}>{t("account.remove")}</Button>
                </>
              )}
            </li>
          ))}
        </ul>
        <form className="mt-4 grid grid-cols-1 gap-2 border-t border-line pt-4 sm:grid-cols-[1fr_auto_auto] sm:items-end" onSubmit={invite}>
          <Field label={t("account.inviteEmail")}>
            <input type="email" dir="ltr" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label={t("account.role")}>
            <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value)}>
              {INVITE_ROLES.map((r) => <option key={r} value={r}>{t(`roles.${r}`)}</option>)}
            </select>
          </Field>
          <Button type="submit" disabled={!validEmail}>{t("account.invite")}</Button>
        </form>
        <p className="mt-2 text-xs leading-relaxed text-muted">{t("account.inviteHint")}</p>
        <dl className="mt-3 space-y-1 text-xs text-text-2">
          {INVITE_ROLES.map((r) => <div key={r}><dt className="inline font-semibold text-text">{t(`roles.${r}`)}:</dt> <dd className="inline">{t(`roles.${r}Desc`)}</dd></div>)}
        </dl>
        {invites.length > 0 && (
          <ul className="mt-4 divide-y divide-line border-t border-line">
            {invites.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                <Num className="min-w-0 flex-1 truncate">{i.email}</Num>
                <span className="text-xs text-muted">{t(`roles.${i.role}`)} · {i.accepted_at ? t("account.joined") : t("account.waiting")}</span>
                {!i.accepted_at && <Button variant="secondary" onClick={() => cancel(i.id)}>{t("common.cancel")}</Button>}
              </li>
            ))}
          </ul>
        )}
        {error && <p role="alert" className="mt-3 text-sm text-anomaly">{error}</p>}
      </Panel>
      <Panel title={t("account.whatsapp")}>
        <p className="text-sm leading-relaxed text-text-2">{t("account.whatsappBody")}</p>
        {numbers.length > 0 && (
          <ul className="mt-3 divide-y divide-line">
            {numbers.map((n) => (
              <li key={n.phone} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                <Num className="flex-1">{n.phone}</Num>
                <span className="text-xs text-muted">{n.label}</span>
                <Button variant="secondary" onClick={() => removeNumber(n.phone)}>{t("account.remove")}</Button>
              </li>
            ))}
          </ul>
        )}
        <form className="mt-4 grid grid-cols-1 gap-2 border-t border-line pt-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={addNumber}>
          <Field label={t("account.phone")} hint={t("account.phoneHint")}>
            <input type="tel" dir="ltr" inputMode="tel" placeholder="+201001234567" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label={t("account.phoneLabel")}>
            <input className={inputClass} maxLength={80} value={label} onChange={(e) => setLabel(e.target.value)} />
          </Field>
          <Button type="submit" disabled={!validPhone}>{t("account.add")}</Button>
        </form>
      </Panel>
      <Panel title={t("account.log")}>
        {log.length ? (
          <ul className="space-y-1.5 text-xs">
            {log.map((l) => (
              <li key={l.id} className="flex flex-wrap gap-x-2 text-text-2">
                <Num className="text-muted">{new Date(l.created_at).toLocaleString()}</Num>
                <Num className="text-text">{l.email}</Num>
                <span>{t(`account.actions.${l.action}`, { target: l.target })}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-2">{t("account.logEmpty")}</p>
        )}
      </Panel>
    </div>
  );
}
