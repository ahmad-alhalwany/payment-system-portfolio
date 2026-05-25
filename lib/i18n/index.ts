import { ar } from "./locales/ar";
import { en } from "./locales/en";
import type { Locale, Translations } from "./types";

export const translations: Record<Locale, Translations> = { ar, en };

export function getTranslations(locale: Locale): Translations {
  return translations[locale];
}

/** Pick localized field from bilingual site config objects */
export function pickLocale<T>(locale: Locale, arVal: T, enVal: T): T {
  return locale === "ar" ? arVal : enVal;
}

export { type Locale, type Translations, localeConfig, LOCALE_KEY } from "./types";
