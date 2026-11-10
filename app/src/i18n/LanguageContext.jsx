import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { energyLabels, strings } from "./strings.js";

const LanguageContext = createContext(null);
const STORAGE_KEY = "daman.lang";

function readStoredLang() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "ar" ? "ar" : "en";
  } catch {
    return "en";
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(readStoredLang);

  useEffect(() => {
    // Switching dir on <html> flips every Tailwind logical utility
    // (ms-/me-/ps-/pe-/start-/end-/text-start) automatically.
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* storage unavailable: language still works for this visit */
    }
  }, [lang]);

  const t = useCallback(
    (key, vars) => {
      let value = strings[lang][key] ?? strings.en[key] ?? key;
      if (typeof value === "string" && vars) {
        value = value.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
      }
      return value;
    },
    [lang],
  );

  const energyLabel = useCallback((type) => energyLabels[lang]?.[type] ?? type, [lang]);

  const value = useMemo(
    () => ({ lang, isRtl: lang === "ar", t, energyLabel, toggle: () => setLang((l) => (l === "en" ? "ar" : "en")) }),
    [lang, t, energyLabel],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
