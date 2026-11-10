import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import LandmarkSkyline from "./LandmarkSkyline.jsx";
import { APP_URL } from "./Nav.jsx";
import { Container, Wordmark } from "./ui.jsx";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-nile-deep text-on-nile-2">
      <Container className="pt-16">
        <LandmarkSkyline tone="dark" className="h-auto opacity-90" />
      </Container>
      <Container className="grid gap-10 py-12 md:grid-cols-[1.2fr_1fr]">
        <div>
          <Wordmark dark />
          <p className="mt-4 max-w-sm text-on-nile">{t("footer.tagline")}</p>
          <p className="mt-6 max-w-md text-sm">{t("footer.disclaimer")}</p>
        </div>
        <div className="flex flex-col gap-3 text-sm md:items-end">
          <Link to="/story" className="hover:text-on-nile">{t("footer.links.story")}</Link>
          <Link to="/how-we-calculate" className="hover:text-on-nile">{t("footer.links.calculate")}</Link>
          <a href={APP_URL} className="hover:text-on-nile">{t("footer.links.app")}</a>
          <p className="mt-6">{t("footer.built")}</p>
          <p>{t("footer.rights")}</p>
        </div>
      </Container>
    </footer>
  );
}
