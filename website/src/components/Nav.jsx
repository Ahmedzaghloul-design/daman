import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { buttonClass, Container, Wordmark } from "./ui.jsx";

export const APP_URL = import.meta.env.VITE_APP_URL || "http://localhost:5174";

export default function Nav({ dark = false }) {
  const { t, toggle } = useLanguage();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Over the dark hero the bar is transparent; once scrolled it becomes solid.
  const solid = scrolled || !dark || open;
  const link = `text-sm transition-colors ${solid ? "text-text-2 hover:text-text" : "text-on-nile-2 hover:text-on-nile"}`;
  const items = [
    { to: "/#how-it-works", label: t("nav.product") },
    { to: "/how-we-calculate", label: t("nav.calculate") },
    { to: "/story", label: t("nav.story") },
    { to: "/#pricing", label: t("nav.pricing") },
  ];

  return (
    <header className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${solid ? "border-b border-line bg-cream/95 backdrop-blur-sm" : "bg-transparent"}`}>
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link to="/" aria-label="Daman home">
          <Wordmark dark={!solid} />
        </Link>
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
          {items.map((i) =>
            i.to.includes("#") ? (
              <a key={i.to} href={i.to} className={link}>
                {i.label}
              </a>
            ) : (
              <NavLink key={i.to} to={i.to} className={({ isActive }) => `${link} ${isActive ? (solid ? "text-text" : "text-on-nile") : ""}`}>
                {i.label}
              </NavLink>
            ),
          )}
        </nav>
        <div className="flex items-center gap-2">
          <button type="button" onClick={toggle} className={`h-9 rounded-control px-3 text-sm ${solid ? "text-text-2 hover:bg-sand" : "text-on-nile-2 hover:bg-white/5"}`}>
            {t("langSwitch")}
          </button>
          <a href={APP_URL} className={`hidden h-9 items-center rounded-control px-3 text-sm sm:inline-flex ${solid ? "text-text-2 hover:bg-sand" : "text-on-nile-2 hover:bg-white/5"}`}>
            {t("nav.login")}
          </a>
          {/* Wrapper controls visibility: the button's own inline-flex would override `hidden`. */}
          <span className="hidden sm:inline-flex">
            <a href="/#demo" className={buttonClass(solid ? "primary" : "gold", "h-9 whitespace-nowrap")}>
              {t("nav.demo")}
            </a>
          </span>
          <button
            type="button"
            className={`inline-flex h-9 items-center rounded-control px-3 text-sm lg:hidden ${solid ? "text-text hover:bg-sand" : "text-on-nile hover:bg-white/5"}`}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? t("nav.close") : t("nav.menu")}
          </button>
        </div>
      </Container>
      {open && (
        <nav id="mobile-menu" className="border-t border-line bg-cream lg:hidden" aria-label="Main">
          <Container className="flex flex-col gap-1 py-4">
            {items.map((i) => (
              <a key={i.to} href={i.to} className="rounded-control px-3 py-3 text-base text-text hover:bg-sand">
                {i.label}
              </a>
            ))}
            <a href={APP_URL} className="rounded-control px-3 py-3 text-base text-text hover:bg-sand">
              {t("nav.login")}
            </a>
            <a href="/#demo" className={buttonClass("primary", "mt-2")}>
              {t("nav.demo")}
            </a>
          </Container>
        </nav>
      )}
    </header>
  );
}
