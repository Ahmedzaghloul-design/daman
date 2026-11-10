import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { Button, buttonClass, LanguageToggle, Logo } from "../components/ui.jsx";

const SECTORS = ["cement", "steel", "fertilizers", "aluminium"];

function Kicker({ children }) {
  return <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{children}</p>;
}

function GlobalNav() {
  const { t } = useLanguage();
  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" aria-label="Daman home">
          <Logo inverse />
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <a href="#product" className="hidden px-3 py-2 text-sm text-slate-300 hover:text-white sm:block">
            {t("nav.product")}
          </a>
          <a href="#pricing" className="hidden px-3 py-2 text-sm text-slate-300 hover:text-white sm:block">
            {t("nav.pricing")}
          </a>
          <Link to="/dashboard" className="px-3 py-2 text-sm text-slate-300 hover:text-white">
            {t("nav.login")}
          </Link>
          <LanguageToggle inverse />
          <a
            href="#demo"
            className="ms-1 hidden rounded-sm border border-white bg-white px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-gray-100 sm:inline-block"
          >
            {t("nav.requestDemo")}
          </a>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  const { t } = useLanguage();
  const stats = [1, 2, 3];
  return (
    <section className="border-b border-slate-300 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="inline-block rounded-sm border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-600">
          {t("hero.eyebrow")}
        </p>
        <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
          {t("hero.title")}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">{t("hero.subtitle")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#demo" className={buttonClass("primary", "px-5 py-2.5")}>
            {t("hero.ctaPrimary")}
          </a>
          <Link to="/dashboard" className={buttonClass("secondary", "px-5 py-2.5")}>
            {t("hero.ctaSecondary")}
          </Link>
        </div>

        <dl className="mt-14 grid grid-cols-1 divide-y divide-slate-300 border border-slate-300 sm:grid-cols-3 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse">
          {stats.map((n) => (
            <div key={n} className="px-5 py-4">
              <dt className="text-sm text-slate-600">{t(`hero.stat${n}.label`)}</dt>
              <dd className="mt-1 font-mono text-2xl font-semibold text-slate-900">{t(`hero.stat${n}.value`)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Mandate() {
  const { t } = useLanguage();
  return (
    <section id="product" className="border-b border-slate-300 bg-gray-50 scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Kicker>{t("mandate.kicker")}</Kicker>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">{t("mandate.title")}</h2>
        <p className="mt-4 max-w-3xl text-slate-600">{t("mandate.intro")}</p>
        <div className="mt-10 grid gap-px border border-slate-300 bg-slate-300 md:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <article key={n} className="bg-white p-6">
              <p className="font-mono text-xs text-red-700">RISK-0{n}</p>
              <h3 className="mt-2 font-semibold text-slate-900">{t(`mandate.p${n}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{t(`mandate.p${n}.body`)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pipeline() {
  const { t } = useLanguage();
  const steps = [1, 2, 3];
  return (
    <section className="border-b border-slate-300 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Kicker>{t("pipeline.kicker")}</Kicker>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">{t("pipeline.title")}</h2>
        <p className="mt-4 max-w-3xl text-slate-600">{t("pipeline.intro")}</p>

        <ol className="mt-10 flex flex-col items-stretch gap-4 md:flex-row md:items-center md:gap-0">
          {steps.map((n, i) => (
            <li key={n} className="flex flex-1 flex-col md:flex-row md:items-center">
              <div className="flex-1 rounded-sm border border-slate-300 bg-gray-50 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-slate-900 font-mono text-sm text-white">
                    {n}
                  </span>
                  <h3 className="font-semibold text-slate-900">{t(`pipeline.s${n}.title`)}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{t(`pipeline.s${n}.body`)}</p>
                {n === 3 && (
                  <p className="mt-3 font-mono text-xs text-emerald-700">STATUS: VERIFIED</p>
                )}
                {n === 2 && <p className="mt-3 font-mono text-xs text-amber-600">STATUS: HITL REVIEW</p>}
              </div>
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="flex justify-center py-1 font-mono text-slate-400 md:px-3 md:py-0"
                >
                  <span className="md:hidden">↓</span>
                  <span className="hidden md:inline rtl:rotate-180">→</span>
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Pricing() {
  const { t } = useLanguage();
  const tiers = [
    { key: "t1", highlight: false },
    { key: "t2", highlight: true },
  ];
  return (
    <section id="pricing" className="border-b border-slate-300 bg-gray-50 scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Kicker>{t("pricing.kicker")}</Kicker>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">{t("pricing.title")}</h2>
        <p className="mt-4 max-w-3xl text-slate-600">{t("pricing.subtitle")}</p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {tiers.map(({ key, highlight }) => (
            <article
              key={key}
              className={`flex flex-col rounded-sm border bg-white p-6 ${highlight ? "border-slate-900 border-2" : "border-slate-300"}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">{t(`pricing.${key}.name`)}</h3>
                {highlight && (
                  <span className="rounded-sm bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">
                    {t("pricing.recommended")}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-600">{t(`pricing.${key}.desc`)}</p>
              <p className="mt-6">
                <span dir="ltr" className="font-mono text-4xl font-semibold text-slate-900">
                  {t(`pricing.${key}.price`)}
                </span>
                <span className="ms-2 text-sm text-slate-600">{t("pricing.perMonth")}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-2 border-t border-slate-300 pt-6 text-sm text-slate-700">
                {t(`pricing.${key}.features`).map((f) => (
                  <li key={f} className="flex gap-2">
                    <span aria-hidden="true" className="font-mono text-emerald-700">
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <a href="#demo" className={buttonClass(highlight ? "primary" : "secondary", "mt-6 w-full")}>
                {t("pricing.cta")}
              </a>
            </article>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-500">{t("pricing.note")}</p>
      </div>
    </section>
  );
}

function RequestDemo() {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);

  // Prototype only: nothing is sent. Wire this to a CRM or email service
  // (with a privacy notice) before going live.
  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const input =
    "mt-1 block w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none";

  return (
    <section id="demo" className="bg-white scroll-mt-16">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">{t("demo.title")}</h2>
          <p className="mt-4 text-slate-600">{t("demo.body")}</p>
        </div>
        {submitted ? (
          <p role="status" className="self-start rounded-sm border border-emerald-700 bg-white p-4 text-sm text-emerald-700">
            {t("demo.success")}
          </p>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-4 rounded-sm border border-slate-300 p-6">
            <label className="text-sm font-medium text-slate-700">
              {t("demo.name")}
              <input required name="name" autoComplete="name" className={input} />
            </label>
            <label className="text-sm font-medium text-slate-700">
              {t("demo.company")}
              <input required name="company" autoComplete="organization" className={input} />
            </label>
            <label className="text-sm font-medium text-slate-700">
              {t("demo.email")}
              <input required type="email" name="email" autoComplete="email" className={input} dir="ltr" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              {t("demo.sector")}
              <select name="sector" className={input}>
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {t(`sector.${s}`)}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit">{t("demo.submit")}</Button>
          </form>
        )}
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <Logo inverse />
        <div className="max-w-xl text-sm text-slate-400">
          <p>{t("footer.disclaimer")}</p>
          <p className="mt-2">{t("footer.rights")}</p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <GlobalNav />
      <main>
        <Hero />
        <Mandate />
        <Pipeline />
        <Pricing />
        <RequestDemo />
      </main>
      <Footer />
    </div>
  );
}
