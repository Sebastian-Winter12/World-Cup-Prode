import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Language, Translations, translations } from "./translations";

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
  teamName: (name: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "es",
  setLang: () => {},
  t: translations.en,
  teamName: (name) => name,
});

function getInitialLang(): Language {
  try {
    const stored = localStorage.getItem("prode-lang");
    if (stored === "en" || stored === "es") return stored;
  } catch {}
  return "es";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(getInitialLang);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem("prode-lang", newLang);
    } catch {}
  }, []);

  const t = translations[lang];

  const teamName = useCallback((name: string): string => {
  const teams = translations[lang].teams as Record<string, string>;
  return teams[name] ?? name;
}, [lang]);

return (
  <I18nContext.Provider value={{ lang, setLang, t, teamName }}>
    {children}
  </I18nContext.Provider>
);
}

export function useI18n() {
  return useContext(I18nContext);
}
