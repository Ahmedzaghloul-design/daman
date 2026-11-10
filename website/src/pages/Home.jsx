import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import Nav from "../components/Nav.jsx";
import Footer from "../components/Footer.jsx";
import Globe from "../components/Globe.jsx";
import LandmarkSkyline from "../components/LandmarkSkyline.jsx";
import Timeline from "../components/home/Timeline.jsx";
import Pipeline from "../components/home/Pipeline.jsx";
import LiveDemo from "../components/home/LiveDemo.jsx";
import Photo from "../components/Photo.jsx";
import { Button, buttonClass, Container, Mark, SectionHeading, useReveal } from "../components/ui.jsx";

function Hero() {
  const { t } = useLanguage();
  return (
    <section className="relative overflow-hidden bg-nile-deep pt-16 text-on-nile">
      <Container className="grid items-center gap-8 pb-10 pt-12 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
        <div className="reveal in">
          <p className="inline-flex rounded-tag border border-on-nile/20 px-2.5 py-1 font-mono text-xs text-on-nile-2">{t("hero.eyebrow")}</p>
          <h1 className="mt-6 text-4xl font-medium leading-[1.06] tracking-[-0.03em] sm:text-5xl lg:text-6xl">{t("hero.title")}</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-on-nile-2">{t("hero.subtitle")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#demo" className={buttonClass("gold", "h-12 px-6")}>{t("hero.primary")}</a>
            <Link to="/how-we-calculate" className={buttonClass("ghostDark", "h-12 px-6")}>{t("hero.secondary")}</Link>
          </div>
        </div>
        <div className="relative">
          <Globe className="aspect-square w-full max-w-[620px] justify-self-center" />
          <p className="pointer-events-none absolute bottom-2 start-1/2 -translate-x-1/2 font-mono text-xs text-on-nile-2 rtl:translate-x-1/2">{t("hero.globeHint")}</p>
        </div>
      </Container>
      <Container className="pb-10">
        <ul className="flex flex-wrap gap-x-8 gap-y-3 border-t border-on-nile/10 pt-6 text-sm text-on-nile-2">
          <li className="flex items-center gap-2"><span className="h-0.5 w-6 bg-gold" />{t("hero.legend.now")}</li>
          <li className="flex items-center gap-2"><span className="h-0.5 w-6 bg-on-nile" />{t("hero.legend.uk")}</li>
          <li className="flex items-center gap-2"><span className="h-0.5 w-6 border-t border-dashed border-on-nile-2" />{t("hero.legend.next")}</li>
        </ul>
      </Container>
    </section>
  );
}

function Problem() {
  const { t } = useLanguage();
  return (
    <section className="border-y border-line bg-card py-24">
      <Container>
        <SectionHeading kicker={t("problem.kicker")} title={t("problem.title")} />
        <Photo name="receiptBook" className="mt-12" aspect="aspect-[21/9]" />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {t("problem.items").map((it, i) => (
            <article key={it.title} className="reveal rounded-card border border-line bg-cream p-6" style={{ transitionDelay: `${i * 60}ms` }}>
              <p className="font-mono text-xs text-anomaly">RISK 0{i + 1}</p>
              <h3 className="mt-3 text-lg font-semibold">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-2">{it.body}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

function O3ci() {
  const { t } = useLanguage();
  return (
    <section className="py-24">
      <Container className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading kicker={t("o3ci.kicker")} title={t("o3ci.title")} intro={t("o3ci.body")} />
          <p className="reveal mt-4 text-sm text-muted">{t("o3ci.note")}</p>
        </div>
        <div className="grid gap-6">
        <Photo name="suezShip" aspect="aspect-[16/9]" />
        <ul className="reveal grid gap-3">
          {t("o3ci.points").map((p, i) => (
            <li key={p} className="flex items-center gap-4 rounded-card border border-line bg-card p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-nile font-mono text-sm text-white">{i + 1}</span>
              <span className="text-text">{p}</span>
            </li>
          ))}
        </ul>
        </div>
      </Container>
    </section>
  );
}

function AnyFactory() {
  const { t } = useLanguage();
  const chip = "rounded-control border px-3 py-1.5 text-sm";
  return (
    <section className="border-y border-line bg-card py-24">
      <Container>
        <SectionHeading kicker={t("anyFactory.kicker")} title={t("anyFactory.title")} intro={t("anyFactory.body")} />
        <div className="reveal mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-card border border-line bg-cream p-6">
            <p className="text-sm font-semibold text-verified">{t("anyFactory.cbam")}</p>
            <div className="mt-4 flex flex-wrap gap-2">{t("anyFactory.cbamSectors").map((s) => <span key={s} className={`${chip} border-verified/30 bg-verified-soft text-verified`}>{s}</span>)}</div>
          </div>
          <div className="rounded-card border border-line bg-cream p-6">
            <p className="text-sm font-semibold text-nile">{t("anyFactory.other")}</p>
            <div className="mt-4 flex flex-wrap gap-2">{t("anyFactory.otherSectors").map((s) => <span key={s} className={`${chip} border-line bg-card text-text-2`}>{s}</span>)}</div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Trust() {
  const { t } = useLanguage();
  return (
    <section className="py-24">
      <Container>
        <SectionHeading kicker={t("trust.kicker")} title={t("trust.title")} />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {t("trust.items").map((it, i) => (
            <article key={it.title} className="reveal" style={{ transitionDelay: `${i * 60}ms` }}>
              <div className="h-px w-full bg-gold" />
              <h3 className="mt-5 font-semibold">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-2">{it.body}</p>
            </article>
          ))}
        </div>
        <Link to="/how-we-calculate" className={buttonClass("primary", "reveal mt-10")}>{t("trust.cta")}</Link>
      </Container>
    </section>
  );
}

function Pricing() {
  const { t } = useLanguage();
  return (
    <section id="pricing" className="scroll-mt-20 bg-nile-deep py-24 text-on-nile">
      <Container>
        <SectionHeading dark kicker={t("pricing.kicker")} title={t("pricing.title")} intro={t("pricing.subtitle")} />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {t("pricing.tiers").map((tier, i) => (
            <article key={tier.name} className={`reveal flex flex-col rounded-panel p-8 ${i === 1 ? "bg-cream text-text" : "border border-on-nile/15 bg-nile"}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{tier.name}</h3>
                {i === 1 && <span className="rounded-tag bg-gold px-2 py-0.5 text-xs font-medium text-nile-deep">{t("pricing.recommended")}</span>}
              </div>
              <p className={`mt-2 text-sm ${i === 1 ? "text-text-2" : "text-on-nile-2"}`}>{tier.desc}</p>
              <p className="mt-8">
                <span dir="ltr" className="font-mono text-5xl font-medium">{tier.price}</span>
                <span className={`ms-2 text-sm ${i === 1 ? "text-text-2" : "text-on-nile-2"}`}>{t("pricing.perMonth")}</span>
              </p>
              <ul className={`mt-8 flex-1 space-y-3 border-t pt-8 text-sm ${i === 1 ? "border-line" : "border-on-nile/15"}`}>
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />{f}</li>
                ))}
              </ul>
              <a href="#demo" className={buttonClass(i === 1 ? "primary" : "ghostDark", "mt-8")}>{t("pricing.cta")}</a>
            </article>
          ))}
        </div>
        <p className="mt-6 text-sm text-on-nile-2">{t("pricing.note")}</p>
      </Container>
    </section>
  );
}

function Faq() {
  const { t } = useLanguage();
  return (
    <section className="py-24">
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <SectionHeading kicker={t("faq.kicker")} title={t("faq.title")} />
          <p className="reveal mt-6 text-sm text-muted">{t("faq.disclaimer")}</p>
        </div>
        <div className="reveal divide-y divide-line border-y border-line">
          {t("faq.items").map((it) => (
            <details key={it.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-start font-medium [&::-webkit-details-marker]:hidden">
                {it.q}
                <span className="shrink-0 font-mono text-gold-700 transition-transform duration-200 group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 leading-relaxed text-text-2">{it.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

function DemoForm() {
  const { t } = useLanguage();
  const [sent, setSent] = useState(false);
  const input = "mt-1.5 block h-11 w-full rounded-control border border-line bg-card px-3 text-sm text-text focus:border-nile focus:outline-none";
  return (
    <section id="demo" className="scroll-mt-20 border-t border-line bg-card py-24">
      <Container className="grid gap-12 lg:grid-cols-2">
        <div>
          <SectionHeading title={t("form.title")} intro={t("form.body")} />
          <LandmarkSkyline className="reveal mt-12 hidden opacity-70 lg:block" />
        </div>
        {sent ? (
          <div role="status" className="flex items-start gap-4 self-start rounded-card border border-verified/30 bg-verified-soft p-6 text-verified">
            <div className="seal-press"><Mark size={40} /></div>
            <p>{t("form.success")}</p>
          </div>
        ) : (
          // Prototype: nothing is sent. Connect a CRM or inbox (with a privacy notice) before launch.
          <form className="reveal grid gap-4 rounded-panel border border-line bg-cream p-6 sm:p-8" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
            <label className="text-sm font-medium">{t("form.name")}<input required name="name" autoComplete="name" className={input} /></label>
            <label className="text-sm font-medium">{t("form.company")}<input required name="company" autoComplete="organization" className={input} /></label>
            <label className="text-sm font-medium">{t("form.email")}<input required type="email" name="email" autoComplete="email" dir="ltr" className={input} /></label>
            <label className="text-sm font-medium">{t("form.sector")}
              <select name="sector" className={input}>{t("form.sectors").map((s) => <option key={s}>{s}</option>)}</select>
            </label>
            <Button type="submit" className="mt-2 h-12">{t("form.submit")}</Button>
          </form>
        )}
      </Container>
    </section>
  );
}

export default function Home() {
  useReveal([]);
  return (
    <>
      <Nav dark />
      <main>
        <Hero />
        <Timeline />
        <Problem />
        <O3ci />
        <Pipeline />
        <LiveDemo />
        <AnyFactory />
        <Trust />
        <Pricing />
        <Faq />
        <DemoForm />
      </main>
      <Footer />
    </>
  );
}

