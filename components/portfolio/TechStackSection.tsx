"use client";

import AnimatedSection from "@/components/ui/AnimatedSection";
import { siteConfig } from "@/lib/site-config";
import { useLocale } from "@/components/providers/LocaleProvider";

const categoryColors: Record<string, string> = {
  frontend: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  backend: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  realtime: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
};

export default function TechStackSection() {
  const { t } = useLocale();

  const categoryLabels: Record<string, string> = {
    frontend: t.tech.frontend,
    backend: t.tech.backend,
    realtime: t.tech.realtime,
  };

  const grouped = siteConfig.techStack.reduce(
    (acc, tech) => {
      if (!acc[tech.category]) acc[tech.category] = [];
      acc[tech.category].push(tech);
      return acc;
    },
    {} as Record<string, (typeof siteConfig.techStack)[number][]>
  );

  return (
    <section id="tech" className="py-24 bg-slate-50 dark:bg-slate-900/50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-16">
          <span className="text-primary-500 text-sm font-semibold tracking-wider uppercase">{t.tech.label}</span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-3 mb-4">{t.tech.title}</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">{t.tech.subtitle}</p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Object.entries(grouped).map(([category, techs]) => (
            <AnimatedSection key={category}>
              <div className="glass-card rounded-2xl p-6 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] h-full">
                <h3 className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold border mb-6 ${categoryColors[category]}`}>
                  {categoryLabels[category] || category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {techs.map((tech) => (
                    <span
                      key={tech.name}
                      className="px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-white hover:border-primary-500/30 transition-colors"
                    >
                      {tech.name}
                    </span>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
