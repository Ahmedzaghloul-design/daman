import { useLanguage } from "../i18n/LanguageContext.jsx";
import Nav from "../components/Nav.jsx";
import Footer from "../components/Footer.jsx";
import Globe from "../components/Globe.jsx";
import LandmarkSkyline from "../components/LandmarkSkyline.jsx";
import Photo from "../components/Photo.jsx";
import { buttonClass, Container, Kicker, Mark, SectionHeading, useReveal } from "../components/ui.jsx";

export default function Story() {
  const { t } = useLanguage();
  useReveal([]);
  const roadmap = t("story.roadmap");

  return (
    <>
      <Nav />
      <main className="pt-16">
        {/* Opening */}
        <section className="border-b border-line bg-card">
          <Container className="py-20 sm:py-28">
            <Kicker>{t("story.kicker")}</Kicker>
            <h1 className="reveal in mt-4 max-w-4xl text-4xl font-medium leading-[1.08] tracking-[-0.03em] sm:text-6xl">{t("story.title")}</h1>
            <p className="reveal in mt-6 max-w-2xl text-lg leading-relaxed text-text-2">{t("story.lead")}</p>
            <LandmarkSkyline className="mt-16" />
          </Container>
        </section>

        {/* Three chapters */}
        <section className="py-24">
          <Container className="flex flex-col gap-20">
            <Photo name="cementPlant" aspect="aspect-[21/9]" />
            {t("story.chapters").map((c, i) => (
              <article key={c.title} className="reveal grid gap-6 md:grid-cols-[120px_1fr] md:gap-12">
                <span className="font-mono text-6xl font-medium text-gold" dir="ltr">0{i + 1}</span>
                <div className="max-w-2xl">
                  <h2 className="text-2xl font-semibold tracking-[-0.01em] sm:text-3xl">{c.title}</h2>
                  <p className="mt-4 text-lg leading-relaxed text-text-2">{c.body}</p>
                </div>
              </article>
            ))}
          </Container>
        </section>

        {/* Principles */}
        <section className="border-y border-line bg-card py-20">
          <Container>
            <SectionHeading title={t("story.principlesTitle")} />
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {t("story.principles").map((p) => (
                <li key={p} className="reveal flex items-start gap-3 rounded-card border border-line bg-cream p-5">
                  <Mark size={28} />
                  <span className="font-medium">{p}</span>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        {/* Expansion roadmap with the globe */}
        <section className="bg-nile-deep py-24 text-on-nile">
          <Container className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <SectionHeading dark kicker={t("story.roadmapKicker")} title={t("story.roadmapTitle")} intro={t("story.roadmapBody")} />
              <ol className="mt-10 grid gap-3">
                {roadmap.map((r, i) => (
                  <li key={r.title} className="reveal grid grid-cols-[96px_1fr] gap-4 rounded-card border border-on-nile/10 bg-nile p-5" style={{ transitionDelay: `${i * 60}ms` }}>
                    <span className={`font-mono text-sm ${i === 0 ? "text-gold" : "text-on-nile-2"}`}>{r.stage}</span>
                    <div>
                      <p className="font-semibold">{r.title}</p>
                      <p className="mt-1 text-sm text-on-nile-2">{r.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-sm text-on-nile-2">{t("story.roadmapNote")}</p>
            </div>
            <Globe className="aspect-square w-full max-w-[560px] justify-self-center" />
          </Container>
        </section>

        {/* Team */}
        <section className="py-24">
          <Container className="max-w-3xl">
            <SectionHeading title={t("story.teamTitle")} intro={t("story.teamBody")} />
            <a href="/#demo" className={buttonClass("primary", "reveal mt-8")}>{t("nav.demo")}</a>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
