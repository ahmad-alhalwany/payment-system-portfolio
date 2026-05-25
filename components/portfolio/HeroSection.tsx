"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { siteConfig } from "@/lib/site-config";
import { useLocale } from "@/components/providers/LocaleProvider";
import ApiStatusBadge from "./ApiStatusBadge";

const FEATURE_ICONS = ["💸", "👥", "📊", "🧾", "🔔", "🏦"];

export default function HeroSection() {
  const { t } = useLocale();

  const stats = [
    { value: "3", label: t.stats.roles },
    { value: "25+", label: t.stats.pages },
    { value: "2", label: t.stats.currencies },
    { value: "100%", label: t.stats.bilingual },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950 transition-colors" />
      <div className="absolute inset-0 bg-grid-pattern opacity-20 dark:opacity-40" />
      <div className="absolute top-1/4 end-0 translate-x-1/3 w-96 h-96 bg-primary-500/10 dark:bg-primary-500/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 start-0 -translate-x-1/3 w-96 h-96 bg-violet-500/10 dark:bg-violet-500/20 rounded-full blur-3xl animate-float-delayed" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-3 mb-8 flex-wrap justify-center"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-200/80 dark:bg-white/5 border border-slate-300/50 dark:border-white/10 text-sm text-slate-600 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {t.site.badge}
          </span>
          <ApiStatusBadge />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-primary-500/30 shadow-2xl shadow-primary-500/20">
            <Image src="/payment-system.jpg" alt={t.site.name} fill className="object-cover" priority />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 leading-tight"
        >
          <span className="bg-gradient-to-l from-slate-900 via-primary-700 to-primary-500 dark:from-white dark:via-primary-200 dark:to-primary-400 bg-clip-text text-transparent">
            {t.site.name}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          {t.site.tagline}
          <br className="hidden sm:block" />
          <span className="text-slate-500"> {t.site.builtWith}</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap gap-4 justify-center mb-16"
        >
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-l from-primary-500 to-primary-600 text-white rounded-2xl text-lg font-bold shadow-xl shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-105 transition-all duration-300"
          >
            ⚡ {t.hero.startDemo}
          </Link>
          <a
            href="#preview"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white rounded-2xl text-lg font-semibold hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300"
          >
            👁️ {t.hero.previewDashboards}
          </a>
          <Link
            href="/case-study"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-2xl text-lg font-semibold hover:text-slate-900 dark:hover:text-white transition-all duration-300"
          >
            📖 {t.hero.caseStudy}
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.05 }}
              className="glass-card rounded-2xl p-5 text-center bg-white/80 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08]"
            >
              <div className="text-3xl sm:text-4xl font-black text-primary-600 dark:text-primary-400 mb-1">{stat.value}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-8 start-1/2 -translate-x-1/2 animate-bounce">
        <a href="#preview" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </a>
      </div>
    </section>
  );
}
