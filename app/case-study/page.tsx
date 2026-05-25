"use client";

import Link from "next/link";
import LandingNav from "@/components/portfolio/LandingNav";
import PortfolioFooter from "@/components/portfolio/PortfolioFooter";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { siteConfig } from "@/lib/site-config";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function CaseStudyPage() {
  const { t } = useLocale();

  const metrics = [
    { label: t.caseStudy.metrics.pages, value: "25+" },
    { label: t.caseStudy.metrics.endpoints, value: "40+" },
    { label: t.caseStudy.metrics.roles, value: "3" },
    { label: t.caseStudy.metrics.currencies, value: "2" },
    { label: t.caseStudy.metrics.duration, value: t.caseStudy.duration },
    { label: t.caseStudy.metrics.stack, value: "8+" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <LandingNav />

      <main className="pt-24 pb-16">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center mb-20">
          <AnimatedSection>
            <span className="text-primary-500 text-sm font-semibold uppercase tracking-wider">Case Study</span>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mt-4 mb-6">{t.caseStudy.title}</h1>
            <p className="text-xl text-slate-600 dark:text-slate-400">{t.caseStudy.subtitle}</p>
            <div className="flex flex-wrap gap-3 justify-center mt-8">
              <Link href="/login" className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-500 transition">
                {t.caseStudy.tryDemo}
              </Link>
              <a href={siteConfig.github} target="_blank" rel="noopener noreferrer" className="px-6 py-3 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-100 dark:hover:bg-white/5 transition">
                {t.nav.github}
              </a>
            </div>
          </AnimatedSection>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-20">
          <AnimatedSection>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {metrics.map((m) => (
                <div key={m.label} className="glass-card rounded-2xl p-5 text-center bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08]">
                  <div className="text-2xl font-black text-primary-600 dark:text-primary-400">{m.value}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{m.label}</div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-20 grid md:grid-cols-2 gap-8">
          <AnimatedSection>
            <div className="rounded-2xl p-8 bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 h-full">
              <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-4">❌ {t.caseStudy.problem.title}</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">{t.caseStudy.problem.description}</p>
              <ul className="space-y-2">
                {t.caseStudy.problem.points.map((p: string) => (
                  <li key={p} className="flex gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="text-red-400 shrink-0">•</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <div className="rounded-2xl p-8 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 h-full">
              <h2 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-4">✅ {t.caseStudy.solution.title}</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">{t.caseStudy.solution.description}</p>
              <ul className="space-y-2">
                {t.caseStudy.solution.points.map((p: string) => (
                  <li key={p} className="flex gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="text-emerald-400 shrink-0">✓</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedSection>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-20">
          <AnimatedSection className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">{t.caseStudy.challengesTitle}</h2>
          </AnimatedSection>
          <div className="grid md:grid-cols-2 gap-6">
            {t.caseStudy.challenges.map((c, i) => (
              <AnimatedSection key={c.title} delay={i * 0.1}>
                <div className="glass-card rounded-2xl p-6 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] h-full">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{c.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">{c.description}</p>
                  <span className="inline-block px-3 py-1 bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs rounded-lg font-mono">{c.tech}</span>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="rounded-2xl p-8 bg-gradient-to-br from-primary-500/10 to-violet-500/10 border border-primary-500/20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">💡 {t.caseStudy.lessonsTitle}</h2>
              <ul className="space-y-3">
                {t.caseStudy.lessons.map((l) => (
                  <li key={l} className="flex gap-3 text-slate-600 dark:text-slate-300">
                    <span className="text-primary-500 shrink-0">→</span>{l}
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedSection>
        </section>
      </main>

      <PortfolioFooter />
    </div>
  );
}
