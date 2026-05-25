"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  FiMenu,
  FiX,
  FiHome,
  FiUsers,
  FiBarChart2,
  FiTrendingUp,
  FiSettings,
  FiPlusCircle,
} from "react-icons/fi";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function BranchManagerSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { t, isRtl } = useLocale();
  const ms = t.dashboard.managerSidebar;

  const navItems = [
    { href: "/branch-dashboard", label: ms.home, icon: FiHome },
    { href: "/branch-dashboard/employees", label: ms.employees, icon: FiUsers },
    { href: "/branch-dashboard/reports", label: ms.reports, icon: FiBarChart2 },
    { href: "/branch-dashboard/profit", label: ms.profit, icon: FiTrendingUp },
    {
      href: "/money-transfer?role=branch_manager",
      label: ms.newTransfer,
      icon: FiPlusCircle,
      accent: true,
    },
    { href: "/branch-dashboard/settings", label: ms.settings, icon: FiSettings },
  ];

  const slideClosed = isRtl ? "translate-x-full" : "-translate-x-full";

  return (
    <>
      <button
        type="button"
        className="fixed top-4 start-4 z-50 md:hidden p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-lg border border-slate-200 dark:border-white/10"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? ms.closeMenu : ms.openMenu}
      >
        {open ? <FiX size={22} /> : <FiMenu size={22} />}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed top-0 start-0 h-full w-72 z-40 transition-transform duration-300 ease-out
          ${open ? "translate-x-0" : slideClosed}
          md:translate-x-0 md:static md:block shrink-0`}
      >
        <div className="h-full flex flex-col m-3 md:my-4 md:ms-4 md:me-0 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl overflow-hidden">
          <div className="px-6 py-8 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl mb-4">
              🏦
            </div>
            <p className="font-bold text-lg">{t.dashboard.shell.branchManagerTitle}</p>
            <p className="text-emerald-100 text-sm mt-1">{t.dashboard.shell.welcome} 👋</p>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {navItems.map(({ href, label, icon: Icon, accent }) => {
              const base = href.split("?")[0];
              const isActive = pathname === base || (base !== "/branch-dashboard" && pathname.startsWith(base));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                    ${isActive
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30"
                      : accent
                        ? "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                    }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-emerald-600 dark:text-emerald-400" : ""}`} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
