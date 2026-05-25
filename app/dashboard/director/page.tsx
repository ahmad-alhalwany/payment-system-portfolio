"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Building2,
  Users,
  Banknote,
  DollarSign,
  UserPlus,
  GitBranchPlus,
  ArrowLeftRight,
  BarChart3,
  Loader2,
} from "lucide-react";
import EmployeeFormModal from "@/components/employee/EmployeeFormModal";
import BranchModal from "@/components/branch/BranchModal";
import BranchForm from "@/components/branch/BranchForm";
import axiosInstance from "@/app/api/axios";
import DirectorTour from "@/components/onboarding/DirectorTour";
import { useLocale } from "@/components/providers/LocaleProvider";
import { getStatusBadgeClass, translateActivityStatus } from "@/lib/dashboard-utils";

interface Activity {
  id: number;
  time: string;
  type: string;
  details: string;
  status: string;
}

interface Branch {
  id: number;
  name: string;
}

interface DashboardStats {
  branches: number;
  employees: number;
  totalBalanceSYP: number;
  totalBalanceUSD: number;
}

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

export default function DirectorDashboard() {
  const { t } = useLocale();
  const d = t.dashboard.director;

  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    branches: 0,
    employees: 0,
    totalBalanceSYP: 0,
    totalBalanceUSD: 0,
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityPage, setActivityPage] = useState(1);
  const activitiesPerPage = 10;

  const quickActions = useMemo(
    () => [
      {
        label: d.actions.addEmployee,
        onClick: () => setShowEmployeeModal(true),
        icon: UserPlus,
        color: "from-emerald-500 to-teal-600",
      },
      {
        label: d.actions.addBranch,
        onClick: () => setShowAddBranchModal(true),
        icon: GitBranchPlus,
        color: "from-amber-500 to-orange-600",
      },
      {
        label: d.actions.newTransfer,
        href: "/money-transfer?role=director",
        icon: ArrowLeftRight,
        color: "from-blue-500 to-cyan-600",
      },
      {
        label: d.actions.reports,
        href: "/dashboard/reports",
        icon: BarChart3,
        color: "from-violet-500 to-purple-600",
      },
    ],
    [d.actions]
  );

  const statsCards = useMemo(
    () => [
      { label: d.stats.branches, value: stats.branches, icon: Building2, accent: "text-blue-600 dark:text-blue-400" },
      { label: d.stats.employees, value: stats.employees, icon: Users, accent: "text-violet-600 dark:text-violet-400" },
      { label: d.stats.balanceSyp, value: stats.totalBalanceSYP, icon: Banknote, accent: "text-emerald-600 dark:text-emerald-400" },
      { label: d.stats.balanceUsd, value: stats.totalBalanceUSD, icon: DollarSign, accent: "text-amber-600 dark:text-amber-400" },
    ],
    [d.stats, stats]
  );

  const totalActivityPages = Math.ceil(activities.length / activitiesPerPage);
  const paginatedActivities = activities.slice(
    (activityPage - 1) * activitiesPerPage,
    activityPage * activitiesPerPage
  );

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [branchesResponse, employeesResponse, financialResponse, activitiesResponse] = await Promise.all([
        axiosInstance.get("/branches/"),
        axiosInstance.get("/users/"),
        axiosInstance.get("/financial/total/"),
        axiosInstance.get("/activity/"),
      ]);
      setStats({
        branches: branchesResponse.data.branches?.length ?? branchesResponse.data.length ?? 0,
        employees: employeesResponse.data.items?.length ?? employeesResponse.data.length ?? 0,
        totalBalanceSYP: financialResponse.data.total_balance_syp ?? 0,
        totalBalanceUSD: financialResponse.data.total_balance_usd ?? 0,
      });
      setBranches(branchesResponse.data.branches || branchesResponse.data);
      setActivities(activitiesResponse.data.activities || activitiesResponse.data);
    } catch {
      toast.error(d.errors.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSubmit = async (data: Parameters<NonNullable<React.ComponentProps<typeof EmployeeFormModal>["onSubmit"]>>[0]) => {
    try {
      setLoading(true);
      await axiosInstance.post("/users/", data);
      setShowEmployeeModal(false);
      toast.success(d.success.employeeAdded);
      await fetchDashboardData();
    } catch {
      toast.error(d.errors.addEmployeeFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranchSubmit = async (data: Parameters<NonNullable<React.ComponentProps<typeof BranchForm>["onSubmit"]>>[0]) => {
    try {
      setLoading(true);
      await axiosInstance.post("/branches/", data);
      setShowAddBranchModal(false);
      toast.success(d.success.branchAdded);
      await fetchDashboardData();
    } catch {
      toast.error(d.errors.addBranchFailed);
    } finally {
      setLoading(false);
    }
  };

  if (loading && stats.branches === 0 && stats.employees === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        <p className="text-slate-500 dark:text-slate-400">{d.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <DirectorTour ready={!loading} />

      <div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{d.pageTitle}</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{d.pageSubtitle}</p>
      </div>

      <div id="tour-stats" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {statsCards.map(({ label, value, icon: Icon, accent }) => (
          <div
            key={label}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <div className="absolute top-0 end-0 w-24 h-24 bg-gradient-to-br from-primary-500/10 to-transparent rounded-full blur-2xl" />
            <div className={`inline-flex p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 mb-4 ${accent}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
              <AnimatedNumber value={value} />
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      <div id="tour-actions" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              disabled={loading}
              className={className}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>

      <EmployeeFormModal
        open={showEmployeeModal}
        onClose={() => setShowEmployeeModal(false)}
        onSubmit={handleEmployeeSubmit}
        initialData={undefined}
        branches={Array.from(branches, (b) => b.name)}
      />

      <BranchModal open={showAddBranchModal} onClose={() => setShowAddBranchModal(false)} title={d.addBranchModal}>
        <BranchForm onSubmit={handleAddBranchSubmit} onCancel={() => setShowAddBranchModal(false)} />
      </BranchModal>

      <div
        id="tour-activities"
        className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-slate-200/80 dark:border-white/10">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{d.activity.title}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                <th className="py-3 px-6 text-start font-semibold">{d.activity.time}</th>
                <th className="py-3 px-6 text-start font-semibold">{d.activity.type}</th>
                <th className="py-3 px-6 text-start font-semibold">{d.activity.details}</th>
                <th className="py-3 px-6 text-start font-semibold">{d.activity.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    {d.activity.loading}
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    {d.activity.empty}
                  </td>
                </tr>
              ) : (
                paginatedActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-300 whitespace-nowrap font-mono text-xs">
                      {activity.time}
                    </td>
                    <td className="py-4 px-6 text-slate-900 dark:text-white font-medium">{activity.type}</td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-300 max-w-md truncate">{activity.details}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(activity.status)}`}>
                        {translateActivityStatus(activity.status, t)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalActivityPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-slate-200/80 dark:border-white/10">
            {Array.from({ length: totalActivityPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setActivityPage(page)}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors
                  ${activityPage === page
                    ? "bg-primary-600 text-white"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                  }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-dashed border-primary-500/30 bg-primary-500/5 p-8 text-center">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{d.newTransferCta}</h3>
        <Link
          href="/money-transfer?role=director"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-violet-600 text-white font-semibold shadow-lg shadow-primary-500/25 hover:opacity-95 transition-opacity"
        >
          <ArrowLeftRight className="w-5 h-5" />
          {d.actions.newTransfer}
        </Link>
      </div>
    </div>
  );
}
