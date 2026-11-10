import { useMemo, useState } from "react";
import {
  benchmarkOptions,
  CBAM_DATA,
  defaultFor,
  defaultValueCost,
  distinctBenchmarks,
  actualDataGap,
  SUPPORTED_YEARS,
} from "@daman/core/cbamCost.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import Nav from "../components/Nav.jsx";
import Footer from "../components/Footer.jsx";
import { Container, Kicker, Num, useReveal } from "../components/ui.jsx";

const GOODS = CBAM_DATA.goods;
const PRICES = CBAM_DATA.prices2026;
const LATEST = { q: "Q3", ...PRICES.Q3 }; // latest official price (Q4 2026 not yet published)
const fmt = (n, d = 2) => (Number.isFinite(n) ? n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }) : "—");
const pct = (n) => `${fmt(n * 100, n * 100 % 1 ? 1 : 0)}%`;
const input = "h-11 w-full rounded-control border border-line bg-cream px-3 text-sm text-text focus:border-nile focus:outline-none";
const clean = (s) => s.replace(/\D/g, "");

// Chapters containing steel/aluminium articles in the downstream extension proposal
// COM(2025) 989 (examples in its annex: 7320, 8419, 8421, 8424, 9018, 9027, 9403, 9406).
const PROPOSAL_CHAPTERS = ["73", "76", "84", "85", "86", "87", "90", "94"];
const ELECTRICITY = "27160000";

// ---------------------------------------------------------------------------
// Sector checker
// ---------------------------------------------------------------------------
function SectorChecker() {
  const { t } = useLanguage();
  const [code, setCode] = useState("");
  const [industry, setIndustry] = useState(null);
  const digits = clean(code);

  const result = useMemo(() => {
    if (industry) {
      if (industry === "other") return { kind: "notCovered" };
      const matches = industry === "electricity" ? [] : GOODS.filter((g) => g.sector === industry);
      return { kind: "covered", matches, count: industry === "electricity" ? null : matches.length };
    }
    if (!digits) return null;
    if (digits.length < 4) return { kind: "short" };
    if (ELECTRICITY.startsWith(digits) || digits.startsWith("2716")) return { kind: "covered", matches: [], electricity: true };
    // Covered if a listed good's code is a prefix of the input, or the input is a prefix of listed goods.
    const matches = GOODS.filter((g) => digits.startsWith(g.code) || g.code.startsWith(digits));
    if (matches.length) return { kind: "covered", matches };
    if (PROPOSAL_CHAPTERS.includes(digits.slice(0, 2))) return { kind: "proposed" };
    return { kind: "notCovered" };
  }, [digits, industry]);

  const tone = { covered: "border-verified/30 bg-verified-soft text-verified", proposed: "border-review/30 bg-review-soft text-review", notCovered: "border-line bg-sand text-text" };

  return (
    <section className="rounded-panel border border-line bg-card p-6 sm:p-8">
      <h2 className="text-2xl font-semibold tracking-[-0.01em]">{t("tools.checker.title")}</h2>
      <p className="mt-2 text-text-2">{t("tools.checker.body")}</p>
      <label className="mt-6 block text-sm font-medium text-text-2">
        {t("tools.checker.input")}
        <input
          dir="ltr"
          inputMode="numeric"
          value={code}
          placeholder={t("tools.checker.placeholder")}
          onChange={(e) => {
            setCode(e.target.value);
            setIndustry(null);
          }}
          className={`${input} mt-1.5 font-mono text-base`}
        />
      </label>
      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(t("tools.checker.industries")).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setIndustry(k);
              setCode("");
            }}
            className={`h-9 rounded-control px-3 text-sm transition-colors ${industry === k ? "bg-nile text-white" : "border border-line bg-cream text-text-2 hover:bg-sand"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div aria-live="polite" className="mt-6">
        {result?.kind === "short" && <p className="text-sm text-muted">{t("tools.checker.tooShort")}</p>}
        {result && result.kind !== "short" && (
          <div className={`rounded-card border p-5 ${tone[result.kind]}`}>
            <p className="font-semibold">{t(`tools.checker.${result.kind}`)}</p>
            <p className="mt-1 text-sm text-text-2">{t(`tools.checker.${result.kind}Body`)}</p>
            {result.kind === "covered" && result.matches.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-text-2">
                  {t("tools.checker.matches")} · <Num>{result.matches.length}</Num>
                </p>
                <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto pe-2 text-sm text-text">
                  {result.matches.slice(0, 40).map((g) => (
                    <li key={g.code} className="flex gap-3">
                      <Num className="shrink-0 text-nile">{g.codeDisplay}</Num>
                      <span dir="ltr" className="truncate text-start">{g.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.kind === "covered" && <p className="mt-4 text-xs text-text-2">{t("tools.checker.threshold")}</p>}
          </div>
        )}
      </div>
      <p className="mt-4 text-xs text-muted">{t("tools.checker.basis")}</p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Cost calculator
// ---------------------------------------------------------------------------
function pickBenchmark(good, year, route, chosen) {
  const opts = benchmarkOptions(good, year, route);
  const values = distinctBenchmarks(opts);
  if (values.length === 1) return { value: values[0], opts };
  if (chosen) {
    const match = opts.find((o) => o.cn === chosen.cn && o.route === chosen.route);
    if (match) return { value: match.b, opts };
  }
  return { value: undefined, opts };
}

function CostCalculator() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [goodCode, setGoodCode] = useState("2523100090"); // grey clinker
  const [choice, setChoice] = useState(null); // { cn, route } when several benchmarks apply
  const [year, setYear] = useState(2026);
  const [quarter, setQuarter] = useState("Q3");
  const [assumedPrice, setAssumedPrice] = useState(LATEST.eur);
  const [tonnes, setTonnes] = useState(10000);
  const [actual, setActual] = useState("");

  const good = GOODS.find((g) => g.code === goodCode);
  const dv = defaultFor(good);
  const price = year === 2026 ? PRICES[quarter].eur : Number(assumedPrice);
  const { value: benchmark, opts } = pickBenchmark(good, year, dv.route, choice);
  const r = defaultValueCost({ good, year, tonnes: Number(tonnes), price, benchmark });
  const gap = r.ok && actual !== "" ? actualDataGap({ embeddedDefault: r.embedded, actualPerTonne: Number(actual), tonnes: Number(tonnes), price }) : null;

  const results = query.trim()
    ? GOODS.filter((g) => g.code.includes(clean(query) || "§") || g.description.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];
  const choiceOpts = distinctBenchmarks(opts).length > 1 ? opts.filter((o, i, a) => a.findIndex((x) => x.cn === o.cn && x.route === o.route) === i) : [];

  const series = SUPPORTED_YEARS.map((y) => {
    const p = y === 2026 ? PRICES[quarter].eur : Number(assumedPrice);
    const b = pickBenchmark(good, y, dv.route, choice).value;
    const c = defaultValueCost({ good, year: y, tonnes: Number(tonnes), price: p, benchmark: b });
    return { year: y, cost: c.ok ? c.cost : null };
  });
  const maxCost = Math.max(1, ...series.map((s) => s.cost ?? 0));

  const row = (label, value, strong) => (
    <div className={`grid grid-cols-[1fr_auto] gap-4 border-b border-line py-2.5 text-sm ${strong ? "font-semibold text-text" : "text-text-2"}`}>
      <span>{label}</span>
      <span dir="ltr" className="font-mono tabular-nums text-text">{value}</span>
    </div>
  );

  return (
    <section className="rounded-panel border border-line bg-card p-6 sm:p-8">
      <h2 className="text-2xl font-semibold tracking-[-0.01em]">{t("tools.calc.title")}</h2>
      <p className="mt-2 max-w-2xl text-text-2">{t("tools.calc.body")}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.15fr]">
        {/* Inputs */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-2">
              {t("tools.calc.product")}
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("tools.calc.search")} className={`${input} mt-1.5`} />
            </label>
            {results.length > 0 && (
              <ul className="mt-1 overflow-hidden rounded-control border border-line bg-cream" role="listbox">
                {results.map((g) => (
                  <li key={g.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={g.code === goodCode}
                      onClick={() => {
                        setGoodCode(g.code);
                        setChoice(null);
                        setQuery("");
                      }}
                      className="flex w-full gap-3 px-3 py-2 text-start text-sm hover:bg-sand"
                    >
                      <Num className="shrink-0 text-nile">{g.codeDisplay}</Num>
                      <span dir="ltr" className="truncate text-start text-text-2">{g.description}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 rounded-control bg-sand p-3 text-sm">
              <Num className="text-nile">{good.codeDisplay}</Num>
              <p dir="ltr" className="mt-1 text-start text-text">{good.description}</p>
              <p className="mt-1 text-xs text-text-2">{dv.table === "Egypt" ? t("tools.calc.notes.egypt") : t("tools.calc.notes.other")}</p>
            </div>
          </div>

          {choiceOpts.length > 0 && (
            <label className="block text-sm font-medium text-text-2">
              {t("tools.calc.cnChoice")}
              <select
                className={`${input} mt-1.5 font-mono`}
                value={choice ? `${choice.cn}|${choice.route}` : ""}
                onChange={(e) => {
                  const [cn, route] = e.target.value.split("|");
                  setChoice({ cn, route: route === "null" ? null : route });
                }}
              >
                <option value="">—</option>
                {choiceOpts.map((o) => (
                  <option key={`${o.cn}|${o.route}`} value={`${o.cn}|${o.route}`}>
                    {o.cn.replace(/(\d{4})(\d{2})(\d{2})/, "$1 $2 $3")} {o.route ? `· ${o.route} ${CBAM_DATA.routes[o.route] ?? ""}` : ""} · {o.b}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-text-2">
              {t("tools.calc.year")}
              <select className={`${input} mt-1.5 font-mono`} value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {SUPPORTED_YEARS.map((y) => <option key={y}>{y}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-text-2">
              {t("tools.calc.tonnes")}
              <input type="number" min="0" dir="ltr" value={tonnes} onChange={(e) => setTonnes(e.target.value)} className={`${input} mt-1.5 font-mono`} />
            </label>
          </div>

          {year === 2026 ? (
            <label className="block text-sm font-medium text-text-2">
              {t("tools.calc.quarter")}
              <select className={`${input} mt-1.5 font-mono`} value={quarter} onChange={(e) => setQuarter(e.target.value)}>
                {Object.entries(PRICES).filter(([, p]) => p).map(([q, p]) => <option key={q} value={q}>{q} · {p.eur} EUR</option>)}
              </select>
              <span className="mt-1.5 block text-xs text-muted">{t("tools.calc.priceOfficial", { q: quarter, date: PRICES[quarter].published })}</span>
            </label>
          ) : (
            <label className="block text-sm font-medium text-text-2">
              {t("tools.calc.price")}
              <input type="number" min="0" step="0.01" dir="ltr" value={assumedPrice} onChange={(e) => setAssumedPrice(e.target.value)} className={`${input} mt-1.5 font-mono`} />
              <span className="mt-1.5 block text-xs text-review">{t("tools.calc.priceAssumed", { year, price: LATEST.eur })}</span>
            </label>
          )}

          <label className="block text-sm font-medium text-text-2">
            {t("tools.calc.actual")}
            <input type="number" min="0" step="0.001" dir="ltr" value={actual} onChange={(e) => setActual(e.target.value)} className={`${input} mt-1.5 font-mono`} />
            <span className="mt-1.5 block text-xs text-muted">{t("tools.calc.actualHint")}</span>
          </label>
        </div>

        {/* Result and working */}
        <div>
          {r.ok ? (
            <>
              <div className="rounded-card bg-nile-deep p-6 text-on-nile">
                <p className="text-sm text-on-nile-2">{t("tools.calc.result")}</p>
                <p className="mt-2 font-mono text-4xl font-medium tabular-nums" dir="ltr">€{fmt(r.cost, 0)}</p>
                <p className="mt-1 text-sm text-on-nile-2"><Num>{t("tools.calc.perTonne", { value: fmt(r.costPerTonne) })}</Num></p>
              </div>
              <h3 className="mt-6 text-sm font-semibold">{t("tools.calc.working")}</h3>
              <div className="mt-2">
                {row(t("tools.calc.rows.table"), t(`tools.calc.tables.${r.table === "Egypt" ? "egypt" : "other"}`))}
                {row(t("tools.calc.rows.dv"), `${fmt(r.defaultValue, 3)} ${t("tools.calc.units.perT")}`)}
                {row(t("tools.calc.rows.markup", { year }), `+${pct(r.markup)}`)}
                {row(t("tools.calc.rows.embedded"), `${fmt(r.embedded, 4)} ${t("tools.calc.units.perT")}`)}
                {row(t("tools.calc.rows.factor", { year }), pct(r.cbamFactor))}
                {row(t("tools.calc.rows.cscf"), pct(r.cscf))}
                {row(t("tools.calc.rows.benchmark"), `${fmt(r.benchmark, 3)} ${t("tools.calc.units.perT")}`)}
                {row(t("tools.calc.rows.free"), `−${fmt(r.freeAllocation, 4)} ${t("tools.calc.units.perT")}`)}
                {row(t("tools.calc.rows.perTonne"), fmt(r.perTonne, 4))}
                {row(t("tools.calc.rows.certs"), `${fmt(r.certificates, 0)} ${t("tools.calc.units.certs")}`)}
                {row(t("tools.calc.rows.cost"), `€${fmt(r.cost, 0)}`, true)}
              </div>
              <p dir="ltr" className="mt-3 text-start font-mono text-xs text-muted">{t("tools.calc.formula")}</p>
            </>
          ) : (
            <p className="rounded-card border border-review/30 bg-review-soft p-5 text-sm text-review">{t(`tools.calc.unavailable.${r.reason}`)}</p>
          )}

          {gap && (
            <div className="mt-6 rounded-card border border-verified/30 bg-verified-soft p-5">
              <p className="font-semibold text-verified">{t("tools.calc.gapTitle")}</p>
              <p className="mt-1 text-sm text-text">
                {gap.gapPerTonne > 0
                  ? t("tools.calc.gapBody", { gap: fmt(gap.gapPerTonne, 3), value: fmt(gap.value, 0) })
                  : t("tools.calc.gapHigher")}
              </p>
              <p className="mt-2 text-xs text-text-2">{t("tools.calc.gapNote")}</p>
            </div>
          )}

          {/* Cost by year */}
          <h3 className="mt-8 text-sm font-semibold">{t("tools.calc.byYear")}</h3>
          <div className="mt-3 flex h-40 items-end gap-3 border-b border-line" dir="ltr">
            {series.map((s) => (
              <button
                key={s.year}
                type="button"
                onClick={() => setYear(s.year)}
                className="group flex h-full flex-1 flex-col items-center justify-end gap-1"
                aria-label={`${s.year}: €${fmt(s.cost, 0)}`}
              >
                <span className="font-mono text-[11px] text-text-2">{s.cost == null ? "—" : `€${fmt(s.cost / 1000, 0)}k`}</span>
                <span
                  className={`w-full rounded-t-tag transition-[height,background-color] duration-500 ease-daman ${s.year === year ? "bg-nile" : "bg-gold/70 group-hover:bg-gold"}`}
                  style={{ height: `${s.cost == null ? 2 : Math.max(2, (s.cost / maxCost) * 100)}%` }}
                />
              </button>
            ))}
          </div>
          <div className="mt-1 flex gap-3 font-mono text-xs text-muted" dir="ltr">
            {series.map((s) => <span key={s.year} className="flex-1 text-center">{s.year}</span>)}
          </div>
        </div>
      </div>

      <Sources />
      <p className="mt-6 text-xs leading-relaxed text-muted">{t("tools.calc.disclaimer")}</p>
    </section>
  );
}

function Sources() {
  const { t } = useLanguage();
  const s = CBAM_DATA.meta.sources;
  const items = [
    ["Default values", s.defaultValues.version, s.defaultValues.law],
    ["Benchmarks", s.benchmarks.version, s.benchmarks.law],
    ["Certificate prices", `${s.prices.law}; Q1 ${PRICES.Q1.eur}, Q2 ${PRICES.Q2.eur}, Q3 ${PRICES.Q3.eur} EUR`, s.prices.url],
    ["CBAM factor", s.cbamFactor.law, s.cbamFactor.url],
    ["Cross-sectoral correction factor", `${s.cscf.law} (100% for 2026–2030)`, s.cscf.url],
    ["Mark-ups", s.markups.law, s.markups.url],
  ];
  return (
    <details className="mt-8 rounded-card border border-line bg-cream p-5">
      <summary className="cursor-pointer text-sm font-semibold">{t("tools.calc.sources")}</summary>
      <ul dir="ltr" className="mt-3 space-y-2 text-start text-xs text-text-2">
        {items.map(([name, desc, url]) => (
          <li key={name}>
            <span className="font-medium text-text">{name}:</span> {desc} ·{" "}
            <a href={url} target="_blank" rel="noreferrer" className="text-nile underline underline-offset-2">source</a>
          </li>
        ))}
        <li>Checked {CBAM_DATA.meta.checked}. {CBAM_DATA.meta.legalNote}</li>
      </ul>
    </details>
  );
}

export default function Tools() {
  const { t } = useLanguage();
  useReveal([]);
  return (
    <>
      <Nav />
      <main className="pt-16">
        <section className="border-b border-line bg-card">
          <Container className="py-16">
            <Kicker>{t("tools.kicker")}</Kicker>
            <h1 className="reveal in mt-4 max-w-3xl text-4xl font-medium tracking-[-0.03em] sm:text-5xl">{t("tools.title")}</h1>
            <p className="reveal in mt-5 max-w-2xl text-lg text-text-2">{t("tools.lead")}</p>
          </Container>
        </section>
        <Container className="grid gap-8 py-12">
          <SectorChecker />
          <CostCalculator />
        </Container>
      </main>
      <Footer />
    </>
  );
}
