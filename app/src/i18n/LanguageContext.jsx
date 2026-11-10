import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LanguageContext } from "./context.js";
import { en } from "./en.js";
import { ar } from "./ar.js";

const STRINGS = { en, ar };
const ENERGY_AR = { Diesel: "سولار", Electricity: "كهرباء", "Natural Gas": "غاز طبيعي", "Heavy Fuel Oil": "مازوت", Coal: "فحم", Petcoke: "بتروكوك" };
const KEY = "daman.app.lang";

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

  const energyLabel = useCallback((type) => (lang === "ar" ? ENERGY_AR[type] ?? type : type), [lang]);
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
