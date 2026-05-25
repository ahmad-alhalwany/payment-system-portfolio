"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { useLocale } from "@/components/providers/LocaleProvider";

const previewMeta = [
  { id: "director", color: "from-violet-500 to-purple-600", login: "/login?username=director" },
  { id: "manager", color: "from-blue-500 to-cyan-600", login: "/login?username=manager" },
  { id: "employee", color: "from-emerald-500 to-teal-600", login: "/login?username=employee" },
] as const;

function DirectorMock({ en }: { en: boolean }) {
  const actions = en
    ? ["➕ Employee", "🏢 Branch", "🔄 Transfer", "📊 Reports"]
    : ["➕ موظف", "🏢 فرع", "🔄 حوالة", "📊 تقارير"];
  const rows = en
    ? [{ t: "Transfer #1042", s: "Done" }, { t: "Aleppo Branch", s: "New" }, { t: "Ahmad", s: "Active" }]
    : [{ t: "حوالة #1042", s: "مكتمل" }, { t: "فرع حلب", s: "جديد" }, { t: "موظف أحمد", s: "نشط" }];
  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {["🏢 5", "👥 12", "💰 2.4M", "💵 45K"].map((s) => (
          <div key={s} className="bg-primary-50 dark:bg-white/5 rounded-xl p-3 text-center text-xs font-bold text-primary-800 dark:text-primary-300">
            {s}
          </div>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        {actions.map((a) => (
          <span key={a} className="px-3 py-1.5 bg-green-500/90 text-white text-xs rounded-lg">{a}</span>
        ))}
      </div>
      <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3">
        <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">{en ? "Recent Activity" : "النشاطات الأخيرة"}</div>
        {rows.map((row) => (
          <div key={row.t} className="flex justify-between text-xs py-1.5 border-b border-slate-200/50 dark:border-white/5 last:border-0">
            <span className="text-slate-700 dark:text-slate-300">{row.t}</span>
            <span className="text-emerald-600 dark:text-emerald-400">{row.s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ManagerMock({ en }: { en: boolean }) {
  const stats = en
    ? [{ l: "Today's Transfers", v: "23" }, { l: "Profit", v: "125K" }, { l: "Staff", v: "4" }]
    : [{ l: "حوالات اليوم", v: "23" }, { l: "الأرباح", v: "125K" }, { l: "الموظفون", v: "4" }];
  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.l} className="bg-blue-50 dark:bg-white/5 rounded-xl p-3 text-center">
            <div className="text-lg font-black text-blue-700 dark:text-blue-400">{s.v}</div>
            <div className="text-[10px] text-slate-500">{s.l}</div>
          </div>
        ))}
      </div>
      <div className="h-24 bg-gradient-to-t from-blue-500/20 to-transparent rounded-xl flex items-end justify-around px-2 pb-2">
        {[40, 65, 45, 80, 55, 70].map((h, i) => (
          <div key={i} className="w-4 bg-blue-500 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="text-xs text-slate-500 text-center">{en ? "📈 Weekly Profit" : "📈 أرباح الأسبوع"}</div>
    </div>
  );
}

function EmployeeMock({ en }: { en: boolean }) {
  const fields = en
    ? ["Sender: Mohammed Ali", "Receiver: Sara Ahmad", "Amount: 500,000 SYP"]
    : ["المرسل: محمد علي", "المستلم: سارة أحمد", "المبلغ: 500,000 ل.س"];
  return (
    <div className="p-4 space-y-3">
      <div className="bg-emerald-50 dark:bg-white/5 rounded-xl p-3">
        <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2">{en ? "New Transfer" : "حوالة جديدة"}</div>
        <div className="space-y-2">
          {fields.map((f) => (
            <div key={f} className="text-xs bg-white dark:bg-white/5 rounded-lg px-3 py-2 text-slate-600 dark:text-slate-300">{f}</div>
          ))}
        </div>
        <button className="w-full mt-3 py-2 bg-emerald-600 text-white text-xs rounded-lg font-bold">{en ? "Send Transfer" : "إرسال الحوالة"}</button>
      </div>
      <div className="flex gap-2">
        <span className="flex-1 text-center py-2 bg-white dark:bg-white/5 rounded-lg text-xs text-slate-600 dark:text-slate-400">{en ? "📤 Out (8)" : "📤 صادرة (8)"}</span>
        <span className="flex-1 text-center py-2 bg-white dark:bg-white/5 rounded-lg text-xs text-slate-600 dark:text-slate-400">{en ? "📥 In (3)" : "📥 واردة (3)"}</span>
      </div>
    </div>
  );
}

const mockComponents = {
  director: DirectorMock,
  manager: ManagerMock,
  employee: EmployeeMock,
};

export default function DashboardPreviewSection() {
  const [active, setActive] = useState<string>("director");
  const { t, locale } = useLocale();
  const en = locale === "en";

  const previews = [
    { ...previewMeta[0], label: t.preview.director },
    { ...previewMeta[1], label: t.preview.manager },
    { ...previewMeta[2], label: t.preview.employee },
  ];

  const ActiveMock = mockComponents[active as keyof typeof mockComponents];
  const activePreview = previews.find((p) => p.id === active)!;

  return (
    <section id="preview" className="py-24 bg-slate-100 dark:bg-slate-900/50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-12">
          <span className="text-primary-500 text-sm font-semibold tracking-wider uppercase">{t.preview.label}</span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-3 mb-4">{t.preview.title}</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">{t.preview.subtitle}</p>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {previews.map((p) => (
              <button
                key={p.id}
                onClick={() => setActive(p.id)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  active === p.id
                    ? `bg-gradient-to-l ${p.color} text-white shadow-lg scale-105`
                    : "bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:border-primary-500/30"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Browser mockup */}
          <div className="max-w-4xl mx-auto">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900">
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-white/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 mx-4 px-4 py-1 bg-white dark:bg-slate-900 rounded-lg text-xs text-slate-400 text-center">
                  payment-system.app/{active === "director" ? "dashboard" : active === "manager" ? "branch" : "transfer"}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="min-h-[280px] bg-white dark:bg-slate-900"
                >
                  <ActiveMock en={en} />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="text-center mt-6">
              <Link
                href={activePreview.login}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-l ${activePreview.color} text-white font-semibold hover:opacity-90 transition-opacity shadow-lg`}
              >
                {t.preview.tryDashboard} {activePreview.label}
                <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
