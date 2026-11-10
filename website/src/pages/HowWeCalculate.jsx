import { useMemo, useState } from "react";
import { normalizeDigits } from "@daman/core/normalize.js";
import { computeCO2e, EMISSION_FACTORS } from "@daman/core/emissionFactors.js";
import { checkMassBalance } from "@daman/core/massBalance.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import Nav from "../components/Nav.jsx";
import Footer from "../components/Footer.jsx";
import { ArabicWithNumbers, Container, Kicker, Num, useReveal } from "../components/ui.jsx";

// The explorer runs the SAME functions as the program (packages/core).
const FUELS = ["Diesel", "Natural Gas", "Heavy Fuel Oil"];
const DEFAULT_TEXT = "مصنع الفراعنة للأسمنت - ١٥٠٠٠ لتر سولار - التاريخ ١٥ مارس ٢٠٢٦";
const fmt = (n, d = 2) => (Number.isFinite(n) ? n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }) : "—");

function Step({ n, title, body, children }) {
  return (
    <section className="reveal grid gap-6 border-t border-line py-12 md:grid-cols-[80px_1fr_1.2fr] md:gap-10">
      <span className="font-mono text-4xl text-gold" dir="ltr">0{n}</span>
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-2 leading-relaxed text-text-2">{body}</p>
      </div>
      <div className="rounded-card border border-line bg-card p-5">{children}</div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-sm font-medium text-text-2">
      {label}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
const input = "h-11 w-full rounded-control border border-line bg-cream px-3 font-mono text-sm text-text tabular-nums focus:border-nile focus:outline-none";

export default function HowWeCalculate() {
  const { t } = useLanguage();
  useReveal([]);
  const [text, setText] = useState(DEFAULT_TEXT);
  const [fuel, setFuel] = useState("Diesel");
  const [qty, setQty] = useState(15000);
  const [mwh, setMwh] = useState(142);
  const [gridFactor, setGridFactor] = useState(0.45);
  const [source, setSource] = useState(0);
  const [tonnes, setTonnes] = useState(1200);
  const [bMin, setBMin] = useState(1);
  const [bMax, setBMax] = useState(6);

  const normalized = normalizeDigits(text);
  const litresInText = normalized.match(/(\d[\d,.]*)\s*لتر/)?.[1];

  const r = useMemo(() => {
    const f = EMISSION_FACTORS[fuel];
    const direct = computeCO2e({ energy_type: fuel, volume: qty, unit: f.unit }) ?? NaN; // tonnes CO2e
    const indirect = (Number(mwh) * Number(gridFactor)) || 0; // MWh × tCO2/MWh = tonnes
    const total = direct + indirect;
    const mb = checkMassBalance({
      receipt: { energy_type: fuel, volume: qty, unit: f.unit },
      productionTonnes: tonnes,
      benchmarks: { [fuel]: { unit: f.unit, min: Number(bMin), max: Number(bMax) } },
    });
    return { f, direct, indirect, total, perTonne: total / Number(tonnes), mb };
  }, [fuel, qty, mwh, gridFactor, tonnes, bMin, bMax]);

  return (
    <>
      <Nav />
      <main className="pt-16">
        <section className="border-b border-line bg-card">
          <Container className="py-20">
            <Kicker>{t("calc.kicker")}</Kicker>
            <h1 className="reveal in mt-4 text-4xl font-medium tracking-[-0.03em] sm:text-5xl">{t("calc.title")}</h1>
            <p className="reveal in mt-5 max-w-2xl text-lg text-text-2">{t("calc.lead")}</p>
            <p className="reveal in mt-8 inline-flex rounded-control bg-nile px-4 py-2 font-medium text-white">{t("calc.rule")}</p>
          </Container>
        </section>

        <Container className="pb-12">
          <Step n={1} title={t("calc.s1.title")} body={t("calc.s1.body")}>
            <Field label={t("calc.s1.input")}>
              <textarea dir="rtl" lang="ar" rows={2} value={text} onChange={(e) => setText(e.target.value)} className="w-full rounded-control border border-line bg-cream p-3 font-receipt text-xl leading-loose text-nile-deep focus:border-nile focus:outline-none" />
            </Field>
            <p dir="rtl" className="mt-3 rounded-control bg-sand p-3 font-mono text-sm"><ArabicWithNumbers text={normalized} /></p>
            {litresInText && (
              <button type="button" onClick={() => setQty(Number(litresInText.replace(/,/g, "")))} className="mt-3 text-sm text-nile underline underline-offset-4">
                <Num>{litresInText} L</Num> → {t("calc.s3.qty")}
              </button>
            )}
          </Step>

          <Step n={2} title={t("calc.s2.title")} body={t("calc.s2.body")}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 font-mono text-sm" dir="ltr">
              {[["energy_type", fuel], ["volume", qty], ["unit", r.f.unit], ["confidence_score", "0.95"], ["requires_human_review", "true"]].map(([k, v]) => (
                <div key={k} className="contents"><dt className="text-muted">{k}</dt><dd>{String(v)}</dd></div>
              ))}
            </dl>
          </Step>

          <Step n={3} title={t("calc.s3.title")} body={t("calc.s3.body")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("calc.s3.fuel")}>
                <select value={fuel} onChange={(e) => setFuel(e.target.value)} className={input}>{FUELS.map((f) => <option key={f}>{f}</option>)}</select>
              </Field>
              <Field label={`${t("calc.s3.qty")} (${r.f.unit})`}>
                <input type="number" min="0" dir="ltr" value={qty} onChange={(e) => setQty(Number(e.target.value))} className={input} />
              </Field>
            </div>
            <p className="mt-4 font-mono text-sm" dir="ltr">
              {fmt(qty, 0)} {r.f.unit} × {r.f.kgCO2ePerUnit} kgCO2e/{r.f.unit} = <span className="text-nile">{fmt(r.direct * 1000, 0)} kg</span> = <b>{fmt(r.direct, 3)} t</b>
            </p>
            <p className="mt-2 text-xs text-review">{t("calc.illustrative")} ({r.f.source})</p>
          </Step>

          <Step n={4} title={t("calc.s4.title")} body={t("calc.s4.body")}>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t("calc.s4.mwh")}><input type="number" min="0" dir="ltr" value={mwh} onChange={(e) => setMwh(Number(e.target.value))} className={input} /></Field>
              <Field label={t("calc.s4.factor")}><input type="number" min="0" step="0.01" dir="ltr" value={gridFactor} onChange={(e) => setGridFactor(Number(e.target.value))} className={input} /></Field>
              <Field label={t("calc.s4.source")}>
                <select value={source} onChange={(e) => setSource(Number(e.target.value))} className={`${input} font-sans`}>{t("calc.s4.sources").map((s, i) => <option key={s} value={i}>{s}</option>)}</select>
              </Field>
            </div>
            <p className="mt-4 font-mono text-sm" dir="ltr">{fmt(mwh, 0)} MWh × {gridFactor} tCO2/MWh = <b>{fmt(r.indirect, 3)} t</b></p>
            <p className="mt-2 text-xs text-review">{t("calc.illustrative")}</p>
          </Step>

          <Step n={5} title={t("calc.s5.title")} body={t("calc.s5.body")}>
            <Field label={t("calc.s5.tonnes")}><input type="number" min="1" dir="ltr" value={tonnes} onChange={(e) => setTonnes(Number(e.target.value))} className={`${input} max-w-48`} /></Field>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4" dir="ltr">
              {[["direct", r.direct], ["indirect", r.indirect], ["total", r.total], ["perTonne", r.perTonne]].map(([k, v]) => (
                <div key={k} className={`rounded-control p-3 ${k === "perTonne" ? "bg-nile text-white" : "bg-sand"}`}>
                  <p className={`text-xs ${k === "perTonne" ? "text-on-nile-2" : "text-muted"}`}>{t(`calc.result.${k}`)}</p>
                  <p className="mt-1 font-mono text-lg">{fmt(v, k === "perTonne" ? 4 : 3)}</p>
                  <p className={`font-mono text-xs ${k === "perTonne" ? "text-on-nile-2" : "text-muted"}`}>{k === "perTonne" ? "tCO2e / t" : "tCO2e"}</p>
                </div>
              ))}
            </div>
          </Step>

          <Step n={6} title={t("calc.s6.title")} body={t("calc.s6.body")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`${t("calc.s6.min")} (${r.f.unit}/t)`}><input type="number" min="0" dir="ltr" value={bMin} onChange={(e) => setBMin(e.target.value)} className={input} /></Field>
              <Field label={`${t("calc.s6.max")} (${r.f.unit}/t)`}><input type="number" min="0" dir="ltr" value={bMax} onChange={(e) => setBMax(e.target.value)} className={input} /></Field>
            </div>
            {r.mb.evaluated ? (
              <>
                <p className="mt-4 font-mono text-sm" dir="ltr">{fmt(qty, 0)} {r.f.unit} ÷ {fmt(tonnes, 0)} t = <b>{fmt(r.mb.intensity)} {r.mb.intensityUnit}</b></p>
                <p className={`mt-3 rounded-control px-3 py-2 text-sm font-medium ${r.mb.outOfRange ? "bg-anomaly-soft text-anomaly" : "bg-verified-soft text-verified"}`}>
                  {r.mb.outOfRange ? `${t("calc.s6.flag")} (${r.mb.deviationPct > 0 ? "+" : ""}${fmt(r.mb.deviationPct, 1)}%)` : t("calc.s6.ok")}
                </p>
              </>
            ) : (
              <p className="mt-4 text-sm text-muted">—</p>
            )}
          </Step>
          <p className="border-t border-line pt-6 text-sm text-muted">{t("calc.source")}</p>
        </Container>
      </main>
      <Footer />
    </>
  );
}
