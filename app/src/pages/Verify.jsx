import { useCallback, useEffect, useMemo, useState } from "react";
import { reportTotals } from "@daman/core/report.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useAppState } from "../state/AppState.jsx";
import { useReport } from "../lib/useReport.js";
import { must, supabase } from "../lib/supabase.js";
import { ArabicWithNumbers, Button, Code, fmt, inputClass, Num, PageHeader, Panel, StatusBadge } from "../components/ui.jsx";

/**
 * Verifier view: everything a CBAM verifier needs to check one entry against
 * its source, read-only, with a comment thread per entry. Verifier visits are
 * written to the workspace's access log.
 */
export default function Verify() {
  const { t, energyLabel } = useLanguage();
  const { ledger, products, settings, inCloud, workspace, role, can } = useAppState();
  const rows = useReport();
  const totals = useMemo(() => reportTotals(rows.map((x) => x.r)), [rows]);
  const [comments, setComments] = useState([]);
  const [open, setOpen] = useState(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);

  const loadComments = useCallback(async () => {
    if (!inCloud) return;
    setComments(must(await supabase.from("comments").select("id, entry_id, author_email, body, created_at").eq("workspace_id", workspace.id).order("created_at")));
  }, [inCloud, workspace]);

  useEffect(() => {
    loadComments().catch((e) => setError(e.message));
  }, [loadComments]);
  useEffect(() => {
    if (inCloud && role === "verifier") supabase.rpc("log_access", { p_ws: workspace.id, p_action: "view_verification", p_target: "" });
  }, [inCloud, role, workspace]);

  const entries = ledger
    .filter((e) => (e.date || "").startsWith(String(settings.year)))
    .filter((e) => filter === "all" || (filter === "flagged" ? e.status === "verified_anomaly" || e.editedByReviewer : comments.some((c) => c.entry_id === e.id)))
    .sort((a, b) => a.id.localeCompare(b.id));

  const toggle = (id) => {
    setOpen(open === id ? null : id);
    if (open !== id && inCloud && role === "verifier") supabase.rpc("log_access", { p_ws: workspace.id, p_action: "view_entry", p_target: id });
  };

  return (
    <>
      <PageHeader title={t("verify.title")} subtitle={t("verify.subtitle")} />
      {!inCloud && <p className="mb-5 rounded-card border border-line bg-card px-4 py-3 text-sm text-text-2">{t("verify.demoNote")}</p>}
      {error && <p role="alert" className="mb-5 rounded-card border border-anomaly/40 bg-anomaly-soft px-4 py-3 text-sm text-anomaly">{error}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Stat label={t("verify.entries")} value={ledger.filter((e) => (e.date || "").startsWith(String(settings.year))).length} />
        <Stat label={t("verify.products")} value={products.length} />
        <Stat label={t("verify.total")} value={`${fmt(totals.total ?? 0, 0)} tCO2e`} />
        <Stat label={t("verify.flagged")} value={ledger.filter((e) => e.status === "verified_anomaly" || e.editedByReviewer).length} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label={t("verify.filter")}>
        {["all", "flagged", "commented"].map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-sm ${filter === f ? "bg-nile text-[#04161b]" : "bg-card text-text-2 hover:text-text"}`}>
            {t(`verify.filters.${f}`)}
          </button>
        ))}
      </div>

      <Panel className="mt-4" padded={false}>
        <ul className="divide-y divide-line">
          {entries.map((e) => {
            const thread = comments.filter((c) => c.entry_id === e.id);
            const det = e.massBalance?.deterministic;
            return (
              <li key={e.id}>
                <button type="button" onClick={() => toggle(e.id)} aria-expanded={open === e.id} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-start hover:bg-sand/50">
                  <Code>{e.id}</Code>
                  <Num className="text-sm text-text-2">{e.date}</Num>
                  <span className="text-sm">{energyLabel(e.energy_type)} · <Num>{fmt(e.volume, 0)} {e.unit}</Num></span>
                  <span className="ms-auto flex items-center gap-2">
                    {e.editedByReviewer && <span className="rounded-full bg-review-soft px-2 py-0.5 text-[11px] text-review">{t("verify.edited")}</span>}
                    {thread.length > 0 && <span className="rounded-full bg-nile/15 px-2 py-0.5 text-[11px] text-nile">{t("verify.comments", { n: thread.length })}</span>}
                    <StatusBadge status={e.status} />
                  </span>
                </button>
                {open === e.id && (
                  <div className="grid grid-cols-1 gap-4 border-t border-line bg-cream/40 px-4 py-4 lg:grid-cols-2">
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                      <dt className="text-text-2">{t("verify.source")}</dt><dd className="min-w-0 truncate"><Num>{e.sourceFile || "—"}</Num></dd>
                      <dt className="text-text-2">{t("verify.raw")}</dt><dd dir="rtl" lang="ar" className="font-arabic"><ArabicWithNumbers text={e.rawText || "—"} /></dd>
                      <dt className="text-text-2">{t("verify.emissions")}</dt><dd><Num>{e.co2e_t == null ? "—" : `${fmt(e.co2e_t, 3)} tCO2e`}</Num></dd>
                      <dt className="text-text-2">{t("verify.massBalance")}</dt>
                      <dd>{det?.evaluated ? <Num>{fmt(det.intensity, 2)} {det.intensityUnit} ({det.expectedMin}–{det.expectedMax})</Num> : "—"}</dd>
                      <dt className="text-text-2">{t("verify.reviewer")}</dt><dd className="min-w-0 truncate"><Num>{e.reviewer || "—"}</Num> · <Num className="text-muted">{e.reviewedAt ? new Date(e.reviewedAt).toLocaleString() : ""}</Num></dd>
                      {e.justification && (<><dt className="text-text-2">{t("verify.justification")}</dt><dd>{e.justification}</dd></>)}
                      <dt className="text-text-2">{t("verify.model")}</dt><dd><Num>{e.model || "—"}</Num></dd>
                    </dl>
                    <Thread entryId={e.id} thread={thread} canWrite={inCloud && can.comment} workspaceId={workspace?.id} onPosted={loadComments} />
                  </div>
                )}
              </li>
            );
          })}
          {!entries.length && <li className="px-4 py-8 text-center text-sm text-text-2">{t("verify.empty")}</li>}
        </ul>
      </Panel>
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-card border border-line bg-card px-4 py-3">
      <p className="text-xs text-text-2">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function Thread({ entryId, thread, canWrite, workspaceId, onPosted }) {
  const { t } = useLanguage();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  return (
    <div>
      <h3 className="text-sm font-semibold">{t("verify.thread")}</h3>
      <ul className="mt-2 space-y-2">
        {thread.map((c) => (
          <li key={c.id} className="rounded-xl bg-card px-3 py-2 text-sm">
            <p className="text-xs text-muted"><Num>{c.author_email}</Num> · <Num>{new Date(c.created_at).toLocaleString()}</Num></p>
            <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
          </li>
        ))}
        {!thread.length && <li className="text-sm text-text-2">{t("verify.noComments")}</li>}
      </ul>
      {canWrite && (
        <form
          className="mt-3 space-y-2"
          onSubmit={async (ev) => {
            ev.preventDefault();
            setBusy(true);
            setError(null);
            try {
              must(await supabase.from("comments").insert({ workspace_id: workspaceId, entry_id: entryId, author_email: (await supabase.auth.getUser()).data.user?.email ?? "", body: body.trim() }));
              setBody("");
              await onPosted();
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <textarea rows={2} maxLength={2000} className={`${inputClass} h-auto py-2`} value={body} onChange={(e) => setBody(e.target.value)} placeholder={t("verify.placeholder")} />
          <Button type="submit" disabled={!body.trim() || busy}>{t("verify.post")}</Button>
          {error && <p role="alert" className="text-sm text-anomaly">{error}</p>}
        </form>
      )}
    </div>
  );
}
