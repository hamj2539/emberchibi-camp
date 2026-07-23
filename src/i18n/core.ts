export type Language = "en" | "th";
export type TranslationValues = Record<string, string | number>;
export type TranslationDictionary = Record<string, string>;
export type LanguageStorage = Pick<Storage, "getItem" | "setItem">;

export const LANGUAGE_STORAGE_KEY = "emberchibiCamp.language";

export function resolveLanguage(value: unknown): Language {
  return value === "th" ? "th" : "en";
}

export function readStoredLanguage(storage?: Pick<Storage, "getItem">): Language {
  return resolveLanguage(storage?.getItem(LANGUAGE_STORAGE_KEY));
}

export function writeStoredLanguage(language: Language, storage?: Pick<Storage, "setItem">): void {
  storage?.setItem(LANGUAGE_STORAGE_KEY, language);
}

export function interpolate(template: string, values?: TranslationValues): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => String(values[key] ?? match));
}

export function createTranslator(
  language: Language,
  english: TranslationDictionary,
  localized: Partial<TranslationDictionary>,
) {
  return (key: string, values?: TranslationValues, fallback?: string): string =>
    interpolate(localized[key] ?? english[key] ?? fallback ?? key, values);
}
