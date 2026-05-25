"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Users,
  UserPlus,
  Pencil,
  Trash2,
  RefreshCw,
  Key,
  Loader2,
  Search,
  UserCheck,
  UserX,
  Building2,
} from "lucide-react";
import EmployeeFormModal, { type EmployeeFormData } from "@/components/employee/EmployeeFormModal";
import ResetPasswordModal from "@/components/shared/ResetPasswordModal";
import EmployeesGuidePanel from "@/components/branch-manager/EmployeesGuidePanel";
import axiosInstance from "@/app/api/axios";
import { branchEmployeesApi, type BranchEmployee } from "@/app/api/branch-employees";
import { useAuth } from "@/app/hooks/useAuth";
import { useLocale } from "@/components/providers/LocaleProvider";

type StatusFilter = "all" | "active" | "inactive";

export default function BranchEmployeesPage() {
  const { t, locale } = useLocale();
  const e = t.dashboard.manager.employees;
  const statusLabels = t.dashboard.status;
  const { user } = useAuth();

  const [employees, setEmployees] = useState<BranchEmployee[]>([]);
  const [branchName, setBranchName] = useState("");
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<BranchEmployee | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resetTarget, setResetTarget] = useState<BranchEmployee | null>(null);

  const selectedEmployee = employees.find((x) => x.id === selectedId);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await branchEmployeesApi.list({
        search: searchTerm.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setEmployees(data.items);
      setBranchName(data.branch.name);
      setStats(data.stats);
    } catch {
      toast.error(e.errors.load);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, e.errors.load]);

  useEffect(() => {
    if (user?.branch_id) fetchEmployees();
  }, [user?.branch_id, statusFilter, fetchEmployees]);

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleDateString(locale === "ar" ? "ar-SY" : "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return value;
    }
  };

  const statCards = useMemo(
    () => [
      { label: e.stats.total, value: stats.total, icon: Users, color: "blue" as const },
      { label: e.stats.active, value: stats.active, icon: UserCheck, color: "emerald" as const },
      { label: e.stats.inactive, value: stats.inactive, icon: UserX, color: "amber" as const },
    ],
    [e.stats, stats]
  );

  const openAdd = () => {
    setEditEmployee(null);
    setShowModal(true);
  };

  const openEdit = (emp: BranchEmployee) => {
    setSelectedId(emp.id);
    setEditEmployee(emp);
    setShowModal(true);
  };

  const openDelete = (emp: BranchEmployee) => {
    if (emp.id === user?.user_id) {
      toast.error(e.errors.cannotDeleteSelf);
      return;
    }
    setSelectedId(emp.id);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (data: EmployeeFormData) => {
    try {
      const payload: EmployeeFormData = {
        ...data,
        role: "employee",
        branch_id: user?.branch_id ?? data.branch_id,
      };
      if (editEmployee) {
        await axiosInstance.put(`/users/${editEmployee.id}`, payload);
        toast.success(e.success.update);
      } else {
        await axiosInstance.post("/users/", payload);
        toast.success(e.success.add);
      }
      setShowModal(false);
      setEditEmployee(null);
      await fetchEmployees();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : editEmployee ? e.errors.update : e.errors.add);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await axiosInstance.delete(`/users/${selectedId}`);
      toast.success(e.success.delete);
      setShowDeleteModal(false);
      setSelectedId(null);
      await fetchEmployees();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : e.errors.delete);
    }
  };

  const handleSearchSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    fetchEmployees();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{e.title}</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">{e.subtitle}</p>
              {branchName && (
                <p className="flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 mt-2 font-medium">
                  <Building2 className="w-4 h-4" />
                  {e.branchLabel}: {branchName}
                </p>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {selectedEmployee ? `${e.selected}: ${selectedEmployee.username}` : e.noSelection}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {statCards.map(({ label, value, icon: Icon, color }) => (
              <StatCard key={label} label={label} value={value} icon={Icon} color={color} />
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <ActionButton icon={UserPlus} label={e.actions.add} onClick={openAdd} color="emerald" />
            <ActionButton
              icon={Pencil}
              label={e.actions.edit}
              onClick={() => selectedEmployee && openEdit(selectedEmployee)}
              disabled={!selectedEmployee}
              color="blue"
            />
            <ActionButton
              icon={Key}
              label={e.actions.resetPassword}
              onClick={() => selectedEmployee && setResetTarget(selectedEmployee)}
              disabled={!selectedEmployee}
              color="violet"
            />
            <ActionButton
              icon={Trash2}
              label={e.actions.delete}
              onClick={() => selectedEmployee && openDelete(selectedEmployee)}
              disabled={!selectedEmployee || selectedEmployee.id === user?.user_id}
              color="red"
            />
            <ActionButton icon={RefreshCw} label={e.actions.refresh} onClick={fetchEmployees} color="slate" />
          </div>

          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={e.search}
                value={searchTerm}
                onChange={(ev) => setSearchTerm(ev.target.value)}
                className="w-full ps-10 pe-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(ev) => setStatusFilter(ev.target.value as StatusFilter)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white"
            >
              <option value="all">{e.filterAll}</option>
              <option value="active">{e.filterActive}</option>
              <option value="inactive">{e.filterInactive}</option>
            </select>
          </form>

          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                <p className="text-slate-500">{e.loading}</p>
              </div>
            ) : employees.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
                <Users className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                <p className="text-slate-500 dark:text-slate-400">{e.empty}</p>
                <button
                  type="button"
                  onClick={openAdd}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  {e.actions.add}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                      {[e.columns.username, e.columns.branch, e.columns.createdAt, e.columns.status, e.columns.actions].map(
                        (col) => (
                          <th key={col} className="py-3 px-4 text-start font-semibold whitespace-nowrap">
                            {col}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {employees.map((emp) => (
                      <tr
                        key={emp.id}
                        onClick={() => setSelectedId(emp.id)}
                        className={`cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.02] ${
                          selectedId === emp.id ? "bg-primary-500/5 ring-1 ring-inset ring-primary-500/20" : ""
                        }`}
                      >
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{emp.username}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{emp.branch_name ?? branchName}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {formatDate(emp.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                              emp.is_active
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/20"
                                : "bg-red-500/15 text-red-700 dark:text-red-400 ring-1 ring-red-500/20"
                            }`}
                          >
                            {emp.is_active ? statusLabels.active : statusLabels.inactive}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1" onClick={(ev) => ev.stopPropagation()}>
                            <RowBtn icon={Pencil} title={e.actions.edit} onClick={() => openEdit(emp)} />
                            <RowBtn icon={Key} title={e.actions.resetPassword} onClick={() => setResetTarget(emp)} />
                            <RowBtn
                              icon={Trash2}
                              title={e.actions.delete}
                              onClick={() => openDelete(emp)}
                              disabled={emp.id === user?.user_id}
                              danger
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-1">
          <EmployeesGuidePanel />
        </div>
      </div>

      <EmployeeFormModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditEmployee(null);
        }}
        onSubmit={handleSubmit}
        initialData={
          editEmployee
            ? {
                id: editEmployee.id,
                username: editEmployee.username,
                role: "employee",
                branch_id: editEmployee.branch_id ?? user?.branch_id ?? undefined,
              }
            : undefined
        }
      />

      {showDeleteModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{e.modals.deleteTitle}</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">{e.modals.deleteMessage}</p>
            <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-4 mb-6 text-sm">
              <p>
                <strong>{e.columns.username}:</strong> {selectedEmployee.username}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5"
              >
                {e.modals.cancel}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500"
              >
                {e.modals.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}

      {resetTarget && (
        <ResetPasswordModal
          isOpen={!!resetTarget}
          onClose={() => setResetTarget(null)}
          username={resetTarget.username}
          onSuccess={fetchEmployees}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: "blue" | "emerald" | "amber" | "violet";
}) {
  const colors = {
    blue: "from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-600 dark:text-blue-400",
    emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    amber: "from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-600 dark:text-amber-400",
    violet: "from-violet-500/20 to-violet-600/5 border-violet-500/20 text-violet-600 dark:text-violet-400",
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2 opacity-80">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{value}</p>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  color: "emerald" | "blue" | "red" | "slate" | "violet";
}) {
  const colors = {
    emerald: "bg-emerald-600 hover:bg-emerald-500",
    blue: "bg-blue-600 hover:bg-blue-500",
    red: "bg-red-600 hover:bg-red-500",
    slate: "bg-slate-600 hover:bg-slate-500",
    violet: "bg-violet-600 hover:bg-violet-500",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${colors[color]}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function RowBtn({
  icon: Icon,
  title,
  onClick,
  disabled,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${
        danger
          ? "text-slate-500 hover:text-red-600 hover:bg-red-500/10"
          : "text-slate-500 hover:text-primary-600 hover:bg-primary-500/10"
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
