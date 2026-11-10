import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { en } from "./en.js";
import { ar } from "./ar.js";

const STRINGS = { en, ar };
const LanguageContext = createContext(null);
const KEY = "daman.site.lang";

function readStored() {
  try {
    return localStorage.getItem(KEY) === "ar" ? "ar" : "en";
  } catch {
    return "en";
  }
}

/** Looks up "a.b.c" in the dictionary; arrays/objects are returned as-is. */
function lookup(dict, key) {
  return key.split(".").reduce((o, k) => (o == null ? o : o[k]), dict);
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(readStored);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      /* storage unavailable */
    }
  }, [lang]);

  const t = useCallback(
    (key, vars) => {
      let v = lookup(STRINGS[lang], key) ?? lookup(STRINGS.en, key) ?? key;
      if (typeof v === "string" && vars) v = v.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
      return v;
    },
    [lang],
  );

  const value = useMemo(
    () => ({ lang, isRtl: lang === "ar", t, toggle: () => setLang((l) => (l === "en" ? "ar" : "en")) }),
    [lang, t],
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
