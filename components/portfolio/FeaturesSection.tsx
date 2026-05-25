"use client";

import AnimatedSection from "@/components/ui/AnimatedSection";
import { useLocale } from "@/components/providers/LocaleProvider";

const FEATURE_ICONS = ["💸", "👥", "📊", "🧾", "🔔", "🏦"];

export default function FeaturesSection() {
  const { t } = useLocale();

  return (
    <section id="features" className="py-24 bg-white dark:bg-slate-950 relative transition-colors">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 dark:opacity-20" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-16">
          <span className="text-primary-500 text-sm font-semibold tracking-wider uppercase">{t.features.label}</span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-3 mb-4">{t.features.title}</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">{t.features.subtitle}</p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.features.items.map((feature, i) => (
            <AnimatedSection key={feature.title} delay={i * 0.08}>
              <div className="group glass-card rounded-2xl p-8 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] hover:border-primary-500/30 transition-all duration-300 hover:-translate-y-1 h-full">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {FEATURE_ICONS[i]}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
