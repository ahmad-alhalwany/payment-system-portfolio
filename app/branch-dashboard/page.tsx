"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Building2,
  Users,
  Banknote,
  DollarSign,
  UserPlus,
  ArrowLeftRight,
  Search,
  BarChart3,
  Settings,
  TrendingUp,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  CalendarDays,
  Receipt,
  MapPin,
} from "lucide-react";
import UserSearchModal from "@/components/ui/UserSearchModal";
import EmployeeFormModal from "@/components/employee/EmployeeFormModal";
import ManagerGuidePanel from "@/components/branch-manager/ManagerGuidePanel";
import OutgoingTransfersTable from "../money-transfer/employee-dashboard/OutgoingTransfersTable";
import IncomingTransfersTable from "../money-transfer/employee-dashboard/IncomingTransfersTable";
import { useAuth } from "@/app/hooks/useAuth";
import axiosInstance from "@/app/api/axios";
import { branchManagerApi, type BranchManagerDashboard } from "@/app/api/branch-manager";
import { useTransactions } from "../hooks/useTransactions";
import { useLocale } from "@/components/providers/LocaleProvider";
import { getStatusBadgeClass, translateActivityStatus } from "@/lib/dashboard-utils";

type TabId = "overview" | "transfers" | "reports";

function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    let current = 0;
    const step = Math.max(1, Math.ceil(value / 40));
    const interval = setInterval(() => {
      current += step;
      if (current >= value) {
        current = value;
        clearInterval(interval);
      }
      if (ref.current) ref.current.textContent = current.toLocaleString();
    }, 20);
    return () => clearInterval(interval);
  }, [value]);
  return <span ref={ref}>{value.toLocaleString()}</span>;
}

export default function BranchManagerDashboard() {
  const { t } = useLocale();
  const m = t.dashboard.manager;
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState<BranchManagerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [outgoingPage, setOutgoingPage] = useState(1);
  const [incomingPage, setIncomingPage] = useState(1);
  const perPage = 10;

  const {
    transactions: outgoingTransfers,
    getTransactions: getOutgoingTransfers,
    updateStatus: updateOutgoingStatus,
    totalPages: outgoingTotalPages,
    loading: outgoingLoading,
  } = useTransactions();

  const {
    transactions: incomingTransfers,
    getTransactions: getIncomingTransfers,
    updateStatus: updateIncomingStatus,
    totalPages: incomingTotalPages,
    loading: incomingLoading,
  } = useTransactions();

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await branchManagerApi.dashboard();
      setDashboard(data);
    } catch {
      toast.error(m.errors.load);
    } finally {
      setLoading(false);
    }
  }, [m.errors.load]);

  useEffect(() => {
    if (user?.branch_id) fetchDashboard();
  }, [user?.branch_id, fetchDashboard]);

  useEffect(() => {
    if (user?.branch_id && activeTab === "transfers") {
      getOutgoingTransfers({ page: outgoingPage, per_page: perPage, branch_id: user.branch_id });
    }
  }, [user?.branch_id, outgoingPage, perPage, activeTab, getOutgoingTransfers]);

  useEffect(() => {
    if (user?.branch_id && activeTab === "transfers") {
      getIncomingTransfers({
        page: incomingPage,
        per_page: perPage,
        destination_branch_id: user.branch_id,
      });
    }
  }, [user?.branch_id, incomingPage, perPage, activeTab, getIncomingTransfers]);

  const handleEmployeeSubmit = async (
    data: Parameters<NonNullable<React.ComponentProps<typeof EmployeeFormModal>["onSubmit"]>>[0]
  ) => {
    try {
      setLoading(true);
      await axiosInstance.post("/users/", {
        ...data,
        role: "employee",
        branch_id: user?.branch_id ?? data.branch_id,
      });
      setShowEmployeeModal(false);
      toast.success(m.success.employeeAdded);
      await fetchDashboard();
    } catch {
      toast.error(m.errors.addEmployee);
    } finally {
      setLoading(false);
    }
  };

  const branch = dashboard?.branch;
  const stats = dashboard?.stats;

  const primaryStats = useMemo(
    () =>
      branch && stats
        ? [
            {
              label: m.stats.balanceSyp,
              value: branch.allocated_amount_syp,
              icon: Banknote,
              accent: "text-emerald-600 dark:text-emerald-400",
            },
            {
              label: m.stats.balanceUsd,
              value: branch.allocated_amount_usd,
              icon: DollarSign,
              accent: "text-amber-600 dark:text-amber-400",
            },
            {
              label: m.stats.employees,
              value: stats.employees,
              icon: Users,
              accent: "text-violet-600 dark:text-violet-400",
            },
            {
              label: m.stats.totalProfit,
              value: stats.total_profit,
              icon: TrendingUp,
              accent: "text-blue-600 dark:text-blue-400",
            },
          ]
        : [],
    [branch, stats, m.stats]
  );

  const activityStats = useMemo(
    () =>
      stats
        ? [
            { label: m.stats.outgoing, value: stats.outgoing_count, icon: ArrowUpRight },
            { label: m.stats.incoming, value: stats.incoming_count, icon: ArrowDownLeft },
            { label: m.stats.completed, value: stats.completed_outgoing + stats.completed_incoming, icon: CheckCircle2 },
            { label: m.stats.processing, value: stats.processing_outgoing, icon: Clock },
            {
              label: m.stats.todayActivity,
              value: stats.today_outgoing + stats.today_incoming,
              icon: CalendarDays,
            },
            { label: m.stats.totalTax, value: stats.total_tax, icon: Receipt },
          ]
        : [],
    [stats, m.stats]
  );

  const quickActions = useMemo(
    () => [
      {
        label: m.actions.addEmployee,
        onClick: () => setShowEmployeeModal(true),
        icon: UserPlus,
        color: "from-emerald-500 to-teal-600",
      },
      {
        label: m.actions.newTransfer,
        href: "/money-transfer",
        icon: ArrowLeftRight,
        color: "from-blue-500 to-cyan-600",
      },
      {
        label: m.actions.searchUser,
        onClick: () => setShowUserSearch(true),
        icon: Search,
        color: "from-orange-500 to-amber-600",
      },
    ],
    [m.actions]
  );

  const quickLinks = useMemo(
    () => [
      { label: m.actions.employees, href: "/branch-dashboard/employees", icon: Users },
      { label: m.actions.transfers, href: "/money-transfer", icon: ArrowLeftRight },
      { label: m.actions.reports, href: "/branch-dashboard/reports", icon: BarChart3 },
      { label: m.actions.profit, href: "/branch-dashboard/profit", icon: TrendingUp },
      { label: m.actions.settings, href: "/branch-dashboard/settings", icon: Settings },
    ],
    [m.actions]
  );

  const tabs = useMemo(
    () => [
      { id: "overview" as const, label: m.sections.recentTransfers },
      { id: "transfers" as const, label: m.sections.transfers },
      { id: "reports" as const, label: m.sections.reports },
    ],
    [m.sections]
  );

  if (loading && !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        <p className="text-slate-500 dark:text-slate-400">{m.loading}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{m.pageTitle}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{m.pageSubtitle}</p>
          </div>

          {branch && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex gap-4">
                  <div className="p-3 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{branch.name}</h2>
                    <p className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mt-1">
                      <MapPin className="w-4 h-4 shrink-0" />
                      {m.location}: {branch.location} · {m.governorate}: {branch.governorate}
                    </p>
                    {branch.tax_rate > 0 && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {m.taxRate}: {branch.tax_rate}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const className = `flex items-center gap-3 p-4 rounded-2xl text-white font-semibold shadow-lg bg-gradient-to-br ${action.color} hover:opacity-95 hover:scale-[1.02] transition-all disabled:opacity-50`;
              if (action.href) {
                return (
                  <Link key={action.label} href={action.href} className={className}>
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{action.label}</span>
                  </Link>
                );
              }
              return (
                <button key={action.label} type="button" onClick={action.onClick} disabled={loading} className={className}>
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {primaryStats.map(({ label, value, icon: Icon, accent }) => (
              <div
                key={label}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <div className={`inline-flex p-2 rounded-xl bg-slate-100 dark:bg-white/5 mb-3 ${accent}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  <AnimatedNumber value={value} />
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {activityStats.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 p-4 text-center"
              >
                <Icon className="w-4 h-4 mx-auto text-slate-400 mb-2" />
                <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{value.toLocaleString()}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{m.sections.quickLinks}</h3>
            <div className="flex flex-wrap gap-3">
              {quickLinks.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden">
            <div className="flex flex-wrap gap-2 p-4 border-b border-slate-200/80 dark:border-white/10">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === "overview" && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                        <th className="py-3 px-4 text-start font-semibold">{t.dashboard.transactions.columns.id}</th>
                        <th className="py-3 px-4 text-start font-semibold">{m.recent.direction}</th>
                        <th className="py-3 px-4 text-start font-semibold">{t.dashboard.transactions.columns.sender}</th>
                        <th className="py-3 px-4 text-start font-semibold">{t.dashboard.transactions.columns.receiver}</th>
                        <th className="py-3 px-4 text-start font-semibold">{t.dashboard.transactions.columns.amount}</th>
                        <th className="py-3 px-4 text-start font-semibold">{t.dashboard.transactions.columns.status}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {!dashboard?.recent_transfers?.length ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500">
                            {m.recent.empty}
                          </td>
                        </tr>
                      ) : (
                        dashboard.recent_transfers.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
                            <td className="py-3 px-4 font-mono text-xs text-primary-600">{String(tx.id).slice(0, 10)}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-semibold ${
                                  tx.direction === "outgoing" ? "text-blue-600" : "text-emerald-600"
                                }`}
                              >
                                {tx.direction === "outgoing" ? (
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowDownLeft className="w-3.5 h-3.5" />
                                )}
                                {tx.direction === "outgoing" ? m.recent.outgoing : m.recent.incoming}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-medium">{tx.sender}</td>
                            <td className="py-3 px-4">{tx.receiver}</td>
                            <td className="py-3 px-4 tabular-nums font-semibold">
                              {tx.amount?.toLocaleString()} {tx.currency}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(tx.status)}`}
                              >
                                {translateActivityStatus(tx.status, t)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "transfers" && user?.branch_id && (
                <div className="space-y-10">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{m.transfers.outgoing}</h3>
                    <OutgoingTransfersTable
                      transfers={outgoingTransfers}
                      onStatusChange={async (id, status) => {
                        await updateOutgoingStatus({ transaction_id: id, status });
                        setOutgoingPage(1);
                        getOutgoingTransfers({ page: 1, per_page: perPage, branch_id: user.branch_id });
                        fetchDashboard();
                      }}
                      currentPage={outgoingPage}
                      totalPages={outgoingTotalPages}
                      onPageChange={setOutgoingPage}
                      loading={outgoingLoading}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{m.transfers.incoming}</h3>
                    <IncomingTransfersTable
                      transfers={incomingTransfers}
                      onStatusChange={async (id, status) => {
                        await updateIncomingStatus({ transaction_id: id, status });
                        setIncomingPage(1);
                        getIncomingTransfers({
                          page: 1,
                          per_page: perPage,
                          destination_branch_id: user.branch_id,
                        });
                        fetchDashboard();
                      }}
                      currentPage={incomingPage}
                      totalPages={incomingTotalPages}
                      onPageChange={setIncomingPage}
                      loading={incomingLoading}
                    />
                  </div>
                </div>
              )}

              {activeTab === "reports" && stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activityStats.map(({ label, value, icon: Icon }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900/50">
                          <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                            {value.toLocaleString()}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Link
                    href="/branch-dashboard/reports"
                    className="sm:col-span-2 lg:col-span-3 flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-primary-500/30 bg-primary-500/5 text-primary-600 dark:text-primary-400 font-semibold hover:bg-primary-500/10 transition-colors"
                  >
                    <BarChart3 className="w-5 h-5" />
                    {m.actions.reports}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-1">
          <ManagerGuidePanel />
        </div>
      </div>

      <UserSearchModal
        open={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        onSelect={() => setShowUserSearch(false)}
      />

      <EmployeeFormModal
        open={showEmployeeModal}
        onClose={() => setShowEmployeeModal(false)}
        onSubmit={handleEmployeeSubmit}
      />
    </div>
  );
}
