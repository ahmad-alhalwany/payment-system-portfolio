"use client";

import AnimatedSection from "@/components/ui/AnimatedSection";
import { useLocale } from "@/components/providers/LocaleProvider";

const layerStyles = [
  { color: "border-blue-500/30 bg-blue-500/5", dot: "bg-blue-400", key: "frontend" as const },
  { color: "border-emerald-500/30 bg-emerald-500/5", dot: "bg-emerald-400", key: "backend" as const },
  { color: "border-violet-500/30 bg-violet-500/5", dot: "bg-violet-400", key: "database" as const },
];

export default function ArchitectureSection() {
  const { t } = useLocale();

  return (
    <section id="architecture" className="py-24 bg-white dark:bg-slate-900/50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-16">
          <span className="text-primary-500 text-sm font-semibold tracking-wider uppercase">{t.architecture.label}</span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-3 mb-4">{t.architecture.title}</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">{t.architecture.subtitle}</p>
        </AnimatedSection>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
          <div className="hidden lg:block absolute top-1/2 start-[33%] end-[33%] h-px bg-gradient-to-l from-blue-500/50 via-emerald-500/50 to-violet-500/50 -translate-y-1/2" />

          {layerStyles.map((style, i) => {
            const layer = t.architecture.layers[style.key];
            return (
              <AnimatedSection key={style.key} delay={i * 0.1}>
                <div className={`glass-card rounded-2xl p-8 border bg-white dark:bg-white/[0.03] ${style.color} h-full`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-3 h-3 rounded-full ${style.dot} animate-pulse`} />
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{layer.title}</h3>
                      <p className="text-sm text-slate-500">{layer.subtitle}</p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {layer.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                        <svg className="w-4 h-4 text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimatedSection>
            );
          })}
        </div>

        <AnimatedSection delay={0.3}>
          <div className="mt-16 glass-card rounded-2xl p-8 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08]">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 text-center">{t.architecture.roleFlow}</h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              {t.architecture.roles.map((item, i) => (
                <div key={item.role} className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="px-5 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
                      <div className="text-slate-900 dark:text-white font-semibold text-sm">{item.role}</div>
                      <div className="text-slate-500 text-xs mt-1">{item.desc}</div>
                    </div>
                  </div>
                  {i < t.architecture.roles.length - 1 && (
                    <svg className="w-5 h-5 text-slate-400 hidden sm:block rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
