import { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { Container, CountUp, SectionHeading } from "../ui.jsx";

// Default-value mark-ups by year [F3][F4], Implementing Regulation (EU) 2025/2621.
const MARKUPS = { metals: [10, 20, 30], fertilisers: [1, 1, 1], electricity: [0, 0, 0] };
const TAG_STYLE = {
  0: "bg-verified-soft text-verified", // in force
  1: "bg-verified-soft text-verified",
  2: "bg-sand text-nile", // legislated (UK)
  3: "bg-sand text-text-2", // scheduled
  4: "bg-sand text-text-2",
  5: "bg-review-soft text-review", // proposed
};

export default function Timeline() {
  const { t } = useLanguage();
  const [sector, setSector] = useState("metals");
  const items = t("timeline.items");
  const years = t("timeline.markup.years");
  const values = MARKUPS[sector];

  return (
    <section id="mandate" className="scroll-mt-20 py-24">
      <Container>
        <SectionHeading kicker={t("timeline.kicker")} title={t("timeline.title")} intro={t("timeline.intro")} />

        <ol className="mt-14 grid gap-px overflow-hidden rounded-panel border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <li key={it.date} className="reveal group bg-card p-6 transition-colors duration-300 hover:bg-cream" style={{ transitionDelay: `${i * 50}ms` }}>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-sm text-gold-700" dir="ltr">{it.date}</span>
                <span className={`rounded-tag px-2 py-0.5 text-xs font-medium ${TAG_STYLE[i]}`}>{it.tag}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-text">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-2">{it.body}</p>
            </li>
          ))}
        </ol>

        <div className="reveal mt-10 grid gap-8 rounded-panel bg-nile-deep p-6 text-on-nile sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <h3 className="text-2xl font-medium tracking-[-0.01em]">{t("timeline.markup.title")}</h3>
            <p className="mt-3 text-on-nile-2">{t("timeline.markup.body")}</p>
            <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label={t("timeline.markup.title")}>
              {Object.keys(MARKUPS).map((k) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={sector === k}
                  onClick={() => setSector(k)}
                  className={`h-9 rounded-control px-3 text-sm transition-colors ${sector === k ? "bg-gold text-nile-deep" : "border border-on-nile/20 text-on-nile-2 hover:bg-white/5"}`}
                >
                  {t(`timeline.markup.sectors.${k}`)}
                </button>
              ))}
            </div>
            <p className="mt-6 text-xs text-on-nile-2">{t("timeline.markup.note")}</p>
          </div>
          <div className="flex h-64 items-end justify-around gap-6 border-b border-on-nile/20 px-2" dir="ltr">
            {values.map((v, i) => (
              <div key={years[i]} className="flex h-full flex-1 flex-col items-center justify-end gap-3">
                <span className="text-3xl font-medium text-gold">
                  <CountUp key={`${sector}-${i}`} value={v} suffix="%" />
                </span>
                <div
                  className="w-full max-w-24 rounded-t-control bg-gold transition-[height] duration-700 ease-daman"
                  style={{ height: `${Math.max(2, (v / 30) * 100)}%`, opacity: 0.55 + i * 0.2 }}
                />
                <span className="pb-3 font-mono text-sm text-on-nile-2">{years[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
