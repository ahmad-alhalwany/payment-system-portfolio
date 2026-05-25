"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiExternalLink, FiLogOut } from "react-icons/fi";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageToggle from "@/components/ui/LanguageToggle";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useAuth } from "@/app/hooks/useAuth";

export default function BranchManagerTopBar() {
  const { t } = useLocale();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 px-4 md:px-8 py-4">
        <div>
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            {t.dashboard.shell.welcome}
          </p>
          <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
            {t.dashboard.shell.branchManagerTitle}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <FiExternalLink className="w-4 h-4" />
            {t.dashboard.shell.backToSite}
          </Link>
          <LanguageToggle />
          <ThemeToggle />
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 text-sm font-semibold transition-colors"
          >
            <FiLogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{t.dashboard.shell.signOut}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
