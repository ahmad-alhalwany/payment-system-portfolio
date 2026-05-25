"use client";

import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function PortfolioFooter() {
  const { t } = useLocale();

  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-white/5 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-start">
            <p className="text-slate-900 dark:text-white font-bold text-lg">{t.site.name}</p>
            <p className="text-slate-500 text-sm mt-1">
              {t.footer.builtBy} {siteConfig.author} — {t.footer.portfolio}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Link href="/case-study" className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 rounded-xl hover:text-primary-600 dark:hover:text-white transition-all">
              {t.nav.caseStudy}
            </Link>
            <a href={siteConfig.github} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 rounded-xl hover:text-slate-900 dark:hover:text-white transition-all">
              {t.nav.github}
            </a>
            <Link href="/login" className="px-4 py-2 text-sm text-white bg-primary-600 rounded-xl hover:bg-primary-500 transition-colors">
              {t.nav.tryDemo}
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/5 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} {siteConfig.author}. {t.footer.license}
        </div>
      </div>
    </footer>
  );
}
