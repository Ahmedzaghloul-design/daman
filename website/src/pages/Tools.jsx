import { useState } from "react";
import { benchmarkOptions, CBAM_DATA, defaultFor, defaultValueCost, distinctBenchmarks, findGood } from "@daman/core/cbamCost.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { usePageMeta } from "../lib/usePageMeta.js";
import Nav, { APP_URL } from "../components/Nav.jsx";
import Footer from "../components/Footer.jsx";
import { buttonClass, Container, Kicker, useReveal } from "../components/ui.jsx";

// The website keeps a quick estimate; the full calculator and sector checker live in the app.
// Each product here resolves to exactly one benchmark (checked against the official files).
const GOODS = ["2523100090", "25232900", "31021019", "7601", "72071114"];
const PRICE = CBAM_DATA.prices2026.Q3.eur;
const YEARS = [2026, 2027, 2028];
const fmt = (n, d = 0) => (Number.isFinite(n) ? n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }) : "—");

export default function Tools() {
  usePageMeta("tools");
  const { t } = useLanguage();
  useReveal([]);
  const [code, setCode] = useState(GOODS[0]);
  const [tonnes, setTonnes] = useState(10000);
  const [year, setYear] = useState(2026);
  const good = findGood(code);
  const dv = defaultFor(good);
  const benchmark = distinctBenchmarks(benchmarkOptions(good, year, dv.route))[0];
  const r = defaultValueCost({ good, year, tonnes: Number(tonnes), price: PRICE, benchmark });

  const input = "mt-1.5 h-12 w-full rounded-control border border-line bg-card px-3 text-base text-text focus:border-nile focus:outline-none";
  return (
    <>
      <Nav />
      <main id="main" tabIndex={-1} className="pt-16">
        <section className="bg-nile-deep text-on-nile">
          <Container className="grid gap-10 py-16 lg:grid-cols-[1fr_1fr] lg:items-center lg:py-24">
            <div>
              <Kicker dark>{t("teaser.kicker")}</Kicker>
              <h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-[-0.03em] sm:text-5xl">{t("teaser.title")}</h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-on-nile-2">{t("teaser.lead")}</p>
            </div>
            <div className="rounded-[20px] bg-cream p-6 text-text shadow-float sm:p-8">
              <div className="grid gap-4">
                <label className="text-sm font-medium text-text-2">
                  {t("teaser.product")}
                  <select className={input} value={code} onChange={(e) => setCode(e.target.value)}>
                    {GOODS.map((c) => <option key={c} value={c}>{t(`teaser.goods.${c}`)} · {findGood(c).codeDisplay}</option>)}
                  </select>
                </label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.4fr_1fr]">
                  <label className="text-sm font-medium text-text-2">
                    {t("teaser.tonnes")}
                    <input type="number" min="0" dir="ltr" value={tonnes} onChange={(e) => setTonnes(e.target.value)} className={`${input} tabular-nums`} />
                  </label>
                  <label className="text-sm font-medium text-text-2">
                    {t("teaser.year")}
                    <select className={`${input} tabular-nums`} value={year} onChange={(e) => setYear(Number(e.target.value))}>{YEARS.map((y) => <option key={y}>{y}</option>)}</select>
                  </label>
                </div>
              </div>
              {r.ok && (
                <div className="mt-6 rounded-card bg-nile-deep p-5 text-on-nile">
                  <p className="text-sm text-on-nile-2">{t("teaser.result")}</p>
                  <p className="mt-1 text-4xl font-bold tabular-nums tracking-[-0.02em]" dir="ltr">€{fmt(r.cost)}</p>
                  <p className="mt-1 text-sm tabular-nums text-gold" dir="ltr">{t("teaser.perTonne", { value: fmt(r.costPerTonne, 2) })}</p>
                </div>
              )}
              <a href={`${APP_URL}/calculator`} className={buttonClass("primary", "mt-5 h-12 w-full")}>{t("teaser.open")}</a>
              {r.ok && (
                <p className="mt-4 text-xs leading-relaxed text-muted">
                  {t("teaser.basis", {
                    table: t(`teaser.tables.${r.table === "Egypt" ? "egypt" : "other"}`),
                    markup: `${Math.round(r.markup * 100)}%`,
                    factor: `${r.cbamFactor * 100}%`,
                    benchmark: r.benchmark,
                    price: PRICE,
                  })}
                </p>
              )}
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
