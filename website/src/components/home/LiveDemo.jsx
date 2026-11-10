import { useEffect, useState } from "react";
import { normalizeDigits } from "@daman/core/normalize.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import recorded from "../../data/recorded-audits.json";
import { ArabicWithNumbers, Button, Container, Mark, Num, SectionHeading } from "../ui.jsx";

const STAGES = ["raw", "digits", "fields", "check", "decision"];
const fmt = (n, d = 2) => Number(n).toLocaleString("en-US", { maximumFractionDigits: d });

export default function LiveDemo() {
  const { t } = useLanguage();
  const [sample, setSample] = useState(0);
  const [shown, setShown] = useState(0); // how many stages are visible
  const [run, setRun] = useState(0);
  const rec = recorded[sample];
  const r = rec.response;
  const det = r.massBalance?.deterministic;
  const llm = r.massBalance?.llm;
  const needsReview = r.reviewReasons.length > 0;

  // Reveal stages one after another (all at once with reduced motion).
  useEffect(() => {
    if (!run) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(STAGES.length);
      return;
    }
    setShown(1);
    const timers = STAGES.slice(1).map((_, i) => setTimeout(() => setShown(i + 2), (i + 1) * 900));
    return () => timers.forEach(clearTimeout);
  }, [run, sample]);

  const card = (i, title, children) =>
    shown > i && (
      <div key={title} className="reveal in rounded-card border border-line bg-card p-5">
        <p className="font-mono text-xs text-gold-700">
          0{i + 1} · {title}
        </p>
        <div className="mt-3">{children}</div>
      </div>
    );

  return (
    <section id="demo-live" className="scroll-mt-20 py-24">
      <Container>
        <SectionHeading kicker={t("demo.kicker")} title={t("demo.title")} intro={t("demo.intro")} />
        <div className="mt-10 flex flex-wrap items-center gap-2">
          {t("demo.samples").map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setSample(i);
                setShown(0);
                setRun((n) => n + 1);
              }}
              className={`h-10 rounded-control px-4 text-sm transition-colors ${sample === i && run ? "bg-nile text-white" : "border border-line bg-card text-text hover:bg-sand"}`}
            >
              {label}
            </button>
          ))}
          <Button variant="secondary" className="ms-auto h-10" onClick={() => setRun((n) => n + 1)}>
            {run ? t("demo.replay") : t("demo.run")}
          </Button>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2" aria-live="polite">
          {!run && (
            <button
              type="button"
              onClick={() => setRun(1)}
              className="flex min-h-48 items-center justify-center rounded-card border border-dashed border-line bg-card text-text-2 hover:bg-sand lg:col-span-2"
            >
              {t("demo.run")} · {t("demo.samples")[sample]}
            </button>
          )}
          {card(0, t("demo.stages.raw"),
            <p dir="rtl" lang="ar" className="font-receipt text-2xl leading-loose text-nile-deep">{rec.rawText}</p>)}
          {card(1, t("demo.stages.digits"),
            <p dir="rtl" lang="ar" className="font-mono text-sm leading-relaxed text-text"><ArabicWithNumbers text={normalizeDigits(rec.rawText)} /></p>)}
          {card(2, t("demo.stages.fields"),
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              {Object.keys(t("demo.fields")).map((k) => (
                <div key={k} className="contents">
                  <dt className="text-text-2">{t(`demo.fields.${k}`)}</dt>
                  <dd>
                    <Num className={k === "confidence_score" && r.receipt[k] < 0.85 ? "text-review" : "text-text"}>
                      {r.receipt[k] === "" || r.receipt[k] == null ? "—" : k === "volume" ? fmt(r.receipt[k], 0) : String(r.receipt[k])}
                    </Num>
                  </dd>
                </div>
              ))}
            </dl>)}
          {card(3, t("demo.stages.check"),
            <div className="space-y-3 text-sm">
              {det?.evaluated && (
                <p className={det.outOfRange ? "text-anomaly" : "text-verified"}>
                  <Num>{t("demo.intensity", { value: fmt(det.intensity), unit: det.intensityUnit, min: det.expectedMin, max: det.expectedMax })}</Num>
                </p>
              )}
              {llm?.reasoning && <p dir="ltr" className="text-start leading-relaxed text-text-2">{llm.reasoning}</p>}
            </div>)}
          {card(4, t("demo.stages.decision"),
            <div className="flex items-start gap-4">
              <div className="seal-press shrink-0"><Mark size={56} /></div>
              <div>
                <p className={`font-semibold ${needsReview ? "text-review" : "text-verified"}`}>{needsReview ? t("demo.decisionReview") : t("demo.decisionClear")}</p>
                <ul className="mt-2 space-y-1 text-sm text-text-2">
                  {r.reviewReasons.map((code) => <li key={code}>— {t(`demo.reasons.${code}`)}</li>)}
                </ul>
              </div>
            </div>)}
        </div>
        {run > 0 && (
          <p className="mt-4 font-mono text-xs text-muted">
            {t("demo.recorded", { date: rec.recordedAt.slice(0, 10), model: r.model })}
          </p>
        )}
      </Container>
    </section>
  );
}
