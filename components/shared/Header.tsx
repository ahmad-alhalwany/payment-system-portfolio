"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  FiHome,
  FiRepeat,
  FiUsers,
  FiGitBranch,
  FiBarChart2,
  FiSearch,
  FiLogOut,
  FiMenu,
  FiX,
  FiGrid,
} from "react-icons/fi";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageToggle from "@/components/ui/LanguageToggle";
import { useAuth } from "@/app/hooks/useAuth";
import { useLocale } from "@/components/providers/LocaleProvider";
import { getDashboardForRole } from "@/lib/demo-auth";

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("userRole");
  localStorage.removeItem("username");
  localStorage.removeItem("branchId");
  localStorage.removeItem("userId");
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const { t } = useLocale();

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/search?query=${encodeURIComponent(search.trim())}`);
  };

  type NavItem = { href: string; label: string; icon: React.ReactNode };
  const navItems: NavItem[] = [
    { href: "/", label: t.nav.home, icon: <FiHome className="w-4 h-4" /> },
    { href: "/money-transfer", label: t.nav.transfers, icon: <FiRepeat className="w-4 h-4" /> },
  ];
  if (user?.role === "director") {
    navItems.push({ href: "/dashboard/employees", label: t.nav.employees, icon: <FiUsers className="w-4 h-4" /> });
    navItems.push({ href: "/dashboard/branches", label: t.nav.branches, icon: <FiGitBranch className="w-4 h-4" /> });
    navItems.push({ href: "/dashboard/reports", label: t.nav.reports, icon: <FiBarChart2 className="w-4 h-4" /> });
  }
  if (user?.role === "branch_manager") {
    navItems.push({ href: "/branch-dashboard/employees", label: t.nav.employees, icon: <FiUsers className="w-4 h-4" /> });
    navItems.push({ href: "/branch-dashboard/reports", label: t.nav.reports, icon: <FiBarChart2 className="w-4 h-4" /> });
  }
  if (user?.role) {
    navItems.push({
      href: getDashboardForRole(user.role),
      label: t.nav.dashboard,
      icon: <FiGrid className="w-4 h-4" />,
    });
  }

  const roleLabel =
    t.dashboard.employees.roles[user?.role as keyof typeof t.dashboard.employees.roles] ?? user?.role;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-4">
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={t.nav.menu}
          >
            {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>

          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 p-0.5 shadow-lg shadow-primary-500/20">
              <img src="/payment-system.jpg" alt="" className="w-full h-full rounded-[10px] object-cover" />
            </div>
            <span className="hidden sm:block font-bold text-slate-900 dark:text-white text-sm md:text-base max-w-[140px] md:max-w-none truncate">
              {t.site.name}
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive(item.href)
                    ? "bg-primary-500/15 text-primary-600 dark:text-primary-400"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"}`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>

          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-xs lg:max-w-sm ms-auto">
            <div className="relative w-full">
              <FiSearch className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.nav.search}
                className="w-full ps-9 pe-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
          </form>

          <div className="flex items-center gap-1.5 shrink-0">
            {user && (
              <div className="hidden xl:flex flex-col items-end me-1">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">{user.username}</span>
                <span className="text-[10px] text-slate-500">{roleLabel}</span>
              </div>
            )}
            <LanguageToggle compact />
            <ThemeToggle className="border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300" />
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 text-sm font-semibold transition-colors"
              >
                <FiLogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t.nav.logout}</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-500 transition-colors"
              >
                {t.nav.login}
              </Link>
            )}
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-1 border-t border-slate-200 dark:border-white/10 pt-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium
                  ${isActive(item.href) ? "bg-primary-500/15 text-primary-600" : "text-slate-600 dark:text-slate-400"}`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
            <form onSubmit={handleSearch} className="pt-2">
              <div className="relative">
                <FiSearch className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.nav.search}
                  className="w-full ps-9 pe-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"
                />
              </div>
            </form>
          </div>
        )}
      </nav>
    </header>
  );
}
