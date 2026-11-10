import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { usePageMeta } from "../lib/usePageMeta.js";
import Nav from "../components/Nav.jsx";
import LandmarkSkyline from "../components/LandmarkSkyline.jsx";
import { buttonClass, Container, useReveal } from "../components/ui.jsx";

export default function NotFound() {
  usePageMeta("notFound");
  const { t } = useLanguage();
  useReveal([]);
  return (
    <>
      <Nav />
      <main id="main" tabIndex={-1} className="flex min-h-screen flex-col justify-center pt-16">
        <Container>
          <p className="font-mono text-sm text-gold-700">404</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.02em]">{t("notFound.title")}</h1>
          <Link to="/" className={buttonClass("primary", "mt-8")}>{t("notFound.back")}</Link>
          <LandmarkSkyline className="mt-20 opacity-70" />
        </Container>
      </main>
    </>
  );
}
