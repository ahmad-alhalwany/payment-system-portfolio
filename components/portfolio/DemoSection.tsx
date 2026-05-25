"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { siteConfig } from "@/lib/site-config";
import { getDashboardForRole } from "@/lib/demo-auth";
import { useAuth } from "@/app/hooks/useAuth";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function DemoSection() {
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const { demoLogin } = useAuth();
  const router = useRouter();
  const { t } = useLocale();

  const roleLabels: Record<string, string> = {
    director: t.demo.roles.director,
    branch_manager: t.demo.roles.branch_manager,
    employee: t.demo.roles.employee,
  };

  const handleDemoLogin = async (account: (typeof siteConfig.demoAccounts)[number]) => {
    setLoadingRole(account.role);
    try {
      const response = await demoLogin(account.role);
      router.push(getDashboardForRole(response.role));
    } catch {
      toast.error(t.demo.loginFailed);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <section id="demo" className="py-24 bg-slate-100 dark:bg-slate-950 relative overflow-hidden transition-colors">
      <div className="absolute top-0 start-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary-500/10 rounded-full blur-3xl" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-primary-500 text-sm font-semibold tracking-wider uppercase">{t.demo.label}</span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-3 mb-4">{t.demo.title}</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">{t.demo.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {siteConfig.demoAccounts.map((account) => (
            <div
              key={account.role}
              className="glass-card rounded-2xl p-8 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] hover:border-primary-500/30 transition-all duration-300 group flex flex-col"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${account.color} flex items-center justify-center text-2xl mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                {account.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{roleLabels[account.role]}</h3>
              <p className="text-sm text-slate-500 mb-6 flex-1">
                {t.demo.roleHint[account.role as keyof typeof t.demo.roleHint] ?? ""}
              </p>

              <button
                type="button"
                onClick={() => handleDemoLogin(account)}
                disabled={loadingRole !== null}
                className={`w-full py-3 rounded-xl bg-gradient-to-l ${account.color} text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60`}
              >
                {loadingRole === account.role ? t.demo.entering : `${t.demo.loginAs} ${roleLabels[account.role]}`}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-500 font-semibold">
            {t.demo.goToLogin}
            <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
