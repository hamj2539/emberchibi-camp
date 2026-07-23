import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createTranslator, readStoredLanguage, writeStoredLanguage, type Language, type TranslationValues } from "./core";
import { en, th } from "./translations";

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, values?: TranslationValues, fallback?: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => readStoredLanguage(typeof window === "undefined" ? undefined : window.localStorage));
  const t = useMemo(() => createTranslator(language, en, language === "th" ? th : en), [language]);
  useEffect(() => {
    writeStoredLanguage(language, window.localStorage);
    document.documentElement.lang = language;
  }, [language]);
  return <I18nContext.Provider value={{ language, setLanguage, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}

export { LANGUAGE_STORAGE_KEY, createTranslator, interpolate, readStoredLanguage, resolveLanguage } from "./core";
export type { Language } from "./core";
