"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import EmployeeFormModal from "@/components/employee/EmployeeFormModal";
import ResetPasswordModal from "@/components/shared/ResetPasswordModal";
import axiosInstance from "@/app/api/axios";
import { useLocale } from "@/components/providers/LocaleProvider";

interface Employee {
  id: number;
  username: string;
  role: string;
  branch_id: number | null;
  branch_name: string | null;
  created_at?: string;
  is_active?: boolean;
}

type RoleFilter = "all" | "director" | "branch_manager" | "employee";

export default function EmployeesPage() {
  const { t, locale } = useLocale();
  const e = t.dashboard.employees;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resetTarget, setResetTarget] = useState<Employee | null>(null);

  const selectedEmployee = employees.find((x) => x.id === selectedId);

  const roleLabel = (role: string) =>
    e.roles[role as keyof typeof e.roles] ?? role;

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/users/", {
        params: { per_page: 200, role: roleFilter !== "all" ? roleFilter : undefined, search: searchTerm || undefined },
      });
      setEmployees(Array.isArray(response.data.items) ? response.data.items : []);
    } catch {
      toast.error(e.errors.load);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [roleFilter]);

  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees;
    const q = searchTerm.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.username.toLowerCase().includes(q) ||
        (emp.branch_name ?? "").toLowerCase().includes(q) ||
        roleLabel(emp.role).toLowerCase().includes(q)
    );
  }, [employees, searchTerm, e]);

  const summary = useMemo(
    () => ({
      total: employees.length,
      managers: employees.filter((x) => x.role === "branch_manager").length,
      staff: employees.filter((x) => x.role === "employee").length,
      withBranch: employees.filter((x) => x.branch_id).length,
    }),
    [employees]
  );

  const formatDate = (value?: string) => {
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

  const openAdd = () => {
    setEditEmployee(null);
    setShowModal(true);
  };

  const openEdit = (emp: Employee) => {
    setSelectedId(emp.id);
    setEditEmployee(emp);
    setShowModal(true);
  };

  const openDelete = (emp: Employee) => {
    if (emp.role === "director") {
      toast.error(e.errors.cannotDeleteDirector);
      return;
    }
    setSelectedId(emp.id);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      if (editEmployee) {
        await axiosInstance.put(`/users/${editEmployee.id}`, data);
        toast.success(e.success.update);
      } else {
        await axiosInstance.post("/users/", data);
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{e.title}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{e.subtitle}</p>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {selectedEmployee ? `${e.selected}: ${selectedEmployee.username}` : e.noSelection}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={e.stats.total} value={summary.total} icon={Users} color="blue" />
        <StatCard label={e.stats.managers} value={summary.managers} icon={UserCheck} color="violet" />
        <StatCard label={e.stats.employees} value={summary.staff} icon={Users} color="emerald" />
        <StatCard label={e.stats.withBranch} value={summary.withBranch} icon={UserPlus} color="amber" />
      </div>

      <div className="flex flex-wrap gap-2">
        <ActionButton icon={UserPlus} label={e.actions.add} onClick={openAdd} color="emerald" />
        <ActionButton icon={Pencil} label={e.actions.edit} onClick={() => selectedEmployee && openEdit(selectedEmployee)} disabled={!selectedEmployee} color="blue" />
        <ActionButton icon={Trash2} label={e.actions.delete} onClick={() => selectedEmployee && openDelete(selectedEmployee)} disabled={!selectedEmployee || selectedEmployee.role === "director"} color="red" />
        <ActionButton icon={RefreshCw} label={e.actions.refresh} onClick={fetchEmployees} color="slate" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          value={roleFilter}
          onChange={(ev) => setRoleFilter(ev.target.value as RoleFilter)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white"
        >
          <option value="all">{e.filterAll}</option>
          <option value="director">{e.roles.director}</option>
          <option value="branch_manager">{e.roles.branch_manager}</option>
          <option value="employee">{e.roles.employee}</option>
        </select>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            <p className="text-slate-500">{e.loading}</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500 dark:text-slate-400">{e.empty}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                  {[e.columns.username, e.columns.role, e.columns.branch, e.columns.createdAt, e.columns.status, e.columns.actions].map((col) => (
                    <th key={col} className="py-3 px-4 text-start font-semibold whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredEmployees.map((employee) => (
                  <tr
                    key={employee.id}
                    onClick={() => setSelectedId(employee.id)}
                    className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]
                      ${selectedId === employee.id ? "bg-primary-500/10 ring-1 ring-inset ring-primary-500/30" : ""}`}
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{employee.username}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-700 dark:text-slate-300">
                        {roleLabel(employee.role)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {employee.branch_name || e.notAssigned}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatDate(employee.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold
                        ${employee.is_active
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : "bg-slate-500/15 text-slate-600 dark:text-slate-400"}`}>
                        {employee.is_active ? t.dashboard.status.active : t.dashboard.status.inactive}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1" onClick={(ev) => ev.stopPropagation()}>
                        <IconButton icon={Pencil} title={e.actions.edit} onClick={() => openEdit(employee)} color="blue" />
                        <IconButton icon={Key} title={e.actions.resetPassword} onClick={() => setResetTarget(employee)} color="emerald" />
                        {employee.role !== "director" && (
                          <IconButton icon={Trash2} title={e.actions.delete} onClick={() => openDelete(employee)} color="red" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EmployeeFormModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditEmployee(null); }}
        onSubmit={handleSubmit}
        initialData={editEmployee ? {
          id: editEmployee.id,
          username: editEmployee.username,
          role: editEmployee.role,
          branch_id: editEmployee.branch_id ?? undefined,
        } : undefined}
      />

      {showDeleteModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{e.modals.deleteTitle}</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">{e.modals.deleteMessage}</p>
            <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-4 mb-6 text-sm space-y-1">
              <p><strong>{e.columns.username}:</strong> {selectedEmployee.username}</p>
              <p><strong>{e.columns.role}:</strong> {roleLabel(selectedEmployee.role)}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowDeleteModal(false)} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5">
                {e.modals.cancel}
              </button>
              <button type="button" onClick={handleDelete} className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500">
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
  value: string | number;
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
  color: "emerald" | "blue" | "red" | "slate";
}) {
  const colors = {
    emerald: "bg-emerald-600 hover:bg-emerald-500",
    blue: "bg-blue-600 hover:bg-blue-500",
    red: "bg-red-600 hover:bg-red-500",
    slate: "bg-slate-600 hover:bg-slate-500",
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

function IconButton({
  icon: Icon,
  title,
  onClick,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  onClick: () => void;
  color: "blue" | "emerald" | "red";
}) {
  const colors = {
    blue: "text-blue-600 hover:bg-blue-500/10 dark:text-blue-400",
    emerald: "text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400",
    red: "text-red-600 hover:bg-red-500/10 dark:text-red-400",
  };
  return (
    <button type="button" title={title} onClick={onClick} className={`p-2 rounded-lg transition-colors ${colors[color]}`}>
      <Icon className="w-4 h-4" />
    </button>
  );
}
