"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { siteConfig } from "@/lib/site-config";
import { useLocale } from "@/components/providers/LocaleProvider";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageToggle from "@/components/ui/LanguageToggle";

export default function LandingNav() {
  const [open, setOpen] = useState(false);
  const { t } = useLocale();

  const navLinks = [
    { href: "#preview", label: t.nav.preview },
    { href: "#features", label: t.nav.features },
    { href: "#demo", label: t.nav.demo },
    { href: "/case-study", label: t.nav.caseStudy, isPage: true },
  ];

  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden ring-2 ring-primary-500/30 group-hover:ring-primary-400/60 transition-all">
              <Image src="/payment-system.jpg" alt="Logo" fill className="object-cover" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base hidden sm:block">
              {t.site.name}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) =>
              link.isPage ? (
                <Link key={link.href} href={link.href} className="text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-white transition-colors">
                  {link.label}
                </Link>
              ) : (
                <a key={link.href} href={link.href} className="text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-white transition-colors">
                  {link.label}
                </a>
              )
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle />
            <ThemeToggle />
            <a
              href={siteConfig.github}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 rounded-xl hover:border-primary-500/30 transition-all"
            >
              {t.nav.github}
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-l from-primary-500 to-primary-600 text-white text-sm font-semibold rounded-xl hover:from-primary-400 hover:to-primary-500 shadow-lg shadow-primary-500/25 transition-all hover:scale-105"
            >
              {t.nav.tryDemo}
            </Link>
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300"
              aria-label={t.nav.menu}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden pb-4 flex flex-col gap-2 animate-fade-in">
            {navLinks.map((link) =>
              link.isPage ? (
                <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg">
                  {link.label}
                </Link>
              ) : (
                <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg">
                  {link.label}
                </a>
              )
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
