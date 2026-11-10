import { useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const setMeta = (selector, attr, value) => {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
};

/**
 * Page title and description in the current language (for search engines that
 * run the page, and for the browser tab). Link previews on WhatsApp/LinkedIn
 * use the fixed tags in index.html, because those apps don't run the page.
 */
export function usePageMeta(key) {
  const { t, lang } = useLanguage();
  useEffect(() => {
    const title = t(`meta.${key}.title`);
    const description = t(`meta.${key}.description`);
    document.title = title;
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
  }, [key, lang, t]);
}
