export type Locale = "ar" | "en";

export const LOCALE_KEY = "locale";

export const localeConfig: Record<Locale, { dir: "rtl" | "ltr"; label: string; flag: string }> = {
  ar: { dir: "rtl", label: "العربية", flag: "🇸🇾" },
  en: { dir: "ltr", label: "English", flag: "🇬🇧" },
};

export type { Translations } from "./locales/ar";
