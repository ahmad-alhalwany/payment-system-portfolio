"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import { localeConfig, type Locale } from "@/lib/i18n";

interface LanguageToggleProps {
  className?: string;
  compact?: boolean;
}

export default function LanguageToggle({ className = "", compact = false }: LanguageToggleProps) {
  const { locale, setLocale } = useLocale();

  const options: Locale[] = ["ar", "en"];

  if (compact) {
    return (
      <button
        onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
        className={`px-2.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-primary-500/30 transition-all ${className}`}
        aria-label="Toggle language"
      >
        {locale === "ar" ? "EN" : "ع"}
      </button>
    );
  }

  return (
    <div className={`flex items-center rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden ${className}`}>
      {options.map((loc) => (
        <button
          key={loc}
          onClick={() => setLocale(loc)}
          className={`px-2.5 py-1.5 text-xs font-semibold transition-all ${
            locale === loc
              ? "bg-primary-600 text-white"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
          }`}
          aria-label={localeConfig[loc].label}
        >
          {loc === "ar" ? "ع" : "EN"}
        </button>
      ))}
    </div>
  );
}
