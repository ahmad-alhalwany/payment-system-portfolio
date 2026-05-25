"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getTranslations, LOCALE_KEY, localeConfig, type Locale, type Translations } from "@/lib/i18n";

interface LocaleContextValue {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  dir: "rtl" | "ltr";
  isRtl: boolean;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "ar",
  t: getTranslations("ar"),
  setLocale: () => {},
  toggleLocale: () => {},
  dir: "rtl",
  isRtl: true,
});

function applyDocumentLocale(locale: Locale) {
  const { dir } = localeConfig[locale];
  document.documentElement.lang = locale;
  document.documentElement.dir = dir;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LOCALE_KEY) as Locale | null;
    const initial: Locale = saved === "en" ? "en" : "ar";
    setLocaleState(initial);
    applyDocumentLocale(initial);
    setMounted(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(LOCALE_KEY, next);
    applyDocumentLocale(next);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const next: Locale = prev === "ar" ? "en" : "ar";
      localStorage.setItem(LOCALE_KEY, next);
      applyDocumentLocale(next);
      return next;
    });
  }, []);

  const value: LocaleContextValue = {
    locale,
    t: getTranslations(locale),
    setLocale,
    toggleLocale,
    dir: localeConfig[locale].dir,
    isRtl: locale === "ar",
  };

  if (!mounted) {
    return (
      <LocaleContext.Provider value={{ ...value, locale: "ar", t: getTranslations("ar") }}>
        {children}
      </LocaleContext.Provider>
    );
  }

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
