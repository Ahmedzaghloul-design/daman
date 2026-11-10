import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { Container, Mark, SectionHeading } from "../ui.jsx";

const STEP_MS = 3600;

// One small visual per step, all drawn in code.
function Stage({ step }) {
  const receipt = (
    <div dir="rtl" lang="ar" className="w-64 -rotate-2 rounded-tag bg-paper px-5 py-4 font-receipt text-lg leading-loose text-nile-deep shadow-float">
      <p className="border-b border-nile-deep/20">مصنع الفراعنة للأسمنت</p>
      <p className="border-b border-nile-deep/20">١٥٠٠٠ لتر سولار</p>
      <p>التاريخ ١٥ مارس ٢٠٢٦</p>
    </div>
  );
  const views = [
    <div key="0" className="relative p-6">
      {receipt}
      {/* camera viewfinder corners */}
      <svg className="absolute inset-0 h-full w-full text-gold" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="1.2" vectorEffect="non-scaling-stroke">
        <path d="M2 14V2h12 M86 2h12v12 M98 86v12H86 M14 98H2V86" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>,
    <div key="1" className="flex flex-col gap-3">
      {receipt}
      <p dir="rtl" className="rounded-control bg-nile-raised px-4 py-2 font-mono text-sm text-on-nile">مصنع الفراعنة للأسمنت - ١٥٠٠٠ لتر سولار - التاريخ ١٥ مارس ٢٠٢٦</p>
    </div>,
    <dl key="2" className="grid w-72 grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-card bg-nile-raised p-5 font-mono text-sm" dir="ltr">
      {[["factory_name", "Pharaohs Cement Factory"], ["energy_type", "Diesel"], ["volume", "15000"], ["unit", "L"], ["date", "2026-03-15"], ["confidence", "0.95"]].map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-on-nile-2">{k}</dt>
          <dd className="text-on-nile">{v}</dd>
        </div>
      ))}
    </dl>,
    <div key="3" className="relative w-72 rounded-card bg-nile-raised p-5 text-sm text-on-nile">
      <p className="font-mono text-xs text-gold">12.50 L/t · benchmark 1–6 L/t</p>
      <p className="mt-2">Reviewer: M. Hassan</p>
      <p className="mt-1 text-on-nile-2">Justification recorded</p>
      <div className="seal-press absolute -bottom-6 -end-6"><Mark size={72} theme="dark" /></div>
    </div>,
    <div key="4" className="w-80 overflow-hidden rounded-card bg-cream font-mono text-xs text-text shadow-float" dir="ltr">
      <div className="grid grid-cols-4 gap-2 bg-sand px-4 py-2 text-muted"><span>Entry</span><span>Energy</span><span className="text-end">Qty</span><span className="text-end">tCO2e</span></div>
      <div className="grid grid-cols-4 gap-2 px-4 py-3"><span>DMN-0004</span><span>Diesel</span><span className="text-end">15,000 L</span><span className="text-end text-verified">40.200</span></div>
    </div>,
  ];
  return (
    <div key={step} className="reveal in flex min-h-80 items-center justify-center p-8" aria-hidden="true">
      {views[step]}
    </div>
  );
}

export default function Pipeline() {
  const { t } = useLanguage();
  const steps = t("pipeline.steps");
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (paused || !inView || reduce) return;
    const id = setTimeout(() => setActive((a) => (a + 1) % steps.length), STEP_MS);
    return () => clearTimeout(id);
  }, [active, paused, inView, steps.length]);

  return (
    <section id="how-it-works" ref={ref} className="scroll-mt-20 bg-nile-deep py-24 text-on-nile">
      <Container>
        <SectionHeading dark kicker={t("pipeline.kicker")} title={t("pipeline.title")} />
        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.1fr]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <ol className="flex flex-col gap-2">
            {steps.map((s, i) => (
              <li key={s.title}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-current={active === i ? "step" : undefined}
                  className={`relative w-full overflow-hidden rounded-card p-5 text-start transition-colors duration-300 ${active === i ? "bg-nile-raised" : "hover:bg-white/5"}`}
                >
                  <div className="flex items-baseline gap-4">
                    <span className={`font-mono text-sm ${active === i ? "text-gold-300" : "text-on-nile-2"}`}>0{i + 1}</span>
                    <div>
                      <p className="font-semibold">{s.title}</p>
                      {active === i && <p className="mt-1 text-sm leading-relaxed text-on-nile-2">{s.body}</p>}
                    </div>
                  </div>
                  {active === i && !paused && inView && (
                    <span key={`bar-${active}`} className="absolute bottom-0 start-0 h-0.5 bg-gold" style={{ animation: `grow ${STEP_MS}ms linear forwards` }} />
                  )}
                </button>
              </li>
            ))}
          </ol>
          <div className="rounded-panel border border-on-nile/10 bg-nile">
            <Stage step={active} />
          </div>
        </div>
        <p className="mt-6 text-sm text-on-nile-2">{t("pipeline.status")}</p>
      </Container>
      <style>{`@keyframes grow { from { width: 0 } to { width: 100% } }`}</style>
    </section>
  );
}
