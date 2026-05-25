"use client";

import { useEffect, useState } from "react";
import BranchModal from "../branch/BranchModal";
import axiosInstance from "@/app/api/axios";
import { useAuth } from "@/app/hooks/useAuth";
import { useLocale } from "@/components/providers/LocaleProvider";

interface Branch {
  id: number;
  name: string;
  governorate: string;
}

export interface EmployeeFormData {
  id?: number;
  username: string;
  password?: string;
  role: string;
  branch_id?: number;
}

interface EmployeeFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EmployeeFormData) => void | Promise<void>;
  initialData?: {
    id?: number;
    username?: string;
    role?: string;
    branch_id?: number;
  };
}

const FORM_ROLES = ["branch_manager", "employee"] as const;

export default function EmployeeFormModal({ open, onClose, onSubmit, initialData }: EmployeeFormModalProps) {
  const { t } = useLocale();
  const m = t.dashboard.employees.modals;
  const roles = t.dashboard.employees.roles;
  const isEdit = !!initialData?.id;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("employee");
  const [branchId, setBranchId] = useState<number>(0);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { user } = useAuth();
  const userRole = user?.role || "";
  const userBranchId = user?.branch_id || null;

  useEffect(() => {
    if (!open) return;
    const fetchBranches = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/branches/");
        let branchesData: Branch[] = Array.isArray(response.data.branches)
          ? response.data.branches
          : Array.isArray(response.data)
            ? response.data
            : [];
        if (userRole === "branch_manager" && userBranchId) {
          branchesData = branchesData.filter((b) => Number(b.id) === Number(userBranchId));
        }
        setBranches(branchesData);
        if (!initialData?.branch_id && branchesData.length > 0) {
          setBranchId(branchesData[0].id);
        }
      } catch {
        setError(t.dashboard.employees.errors.branches);
      } finally {
        setLoading(false);
      }
    };
    fetchBranches();
  }, [open, userRole, userBranchId, initialData?.branch_id, t.dashboard.employees.errors.branches]);

  useEffect(() => {
    if (!open) return;
    setUsername(initialData?.username || "");
    setRole(initialData?.role && FORM_ROLES.includes(initialData.role as typeof FORM_ROLES[number])
      ? initialData.role
      : "employee");
    setBranchId(initialData?.branch_id || 0);
    setPassword("");
    setError("");
  }, [open, initialData]);

  const handleSave = () => {
    if (!username || (!isEdit && !password) || !role || !branchId) {
      setError(m.required);
      return;
    }
    setError("");
    onSubmit({
      id: initialData?.id,
      username,
      password: isEdit ? undefined : password,
      role,
      branch_id: Number(branchId),
    });
  };

  if (!open) return null;

  return (
    <BranchModal open={open} onClose={onClose} title={isEdit ? m.editTitle : m.addTitle}>
      <div className="space-y-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">{m.username}</label>
          <input
            type="text"
            value={username}
            onChange={(ev) => setUsername(ev.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50"
            disabled={loading}
          />
        </div>
        {!isEdit && (
          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">{m.password}</label>
            <input
              type="password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50"
              disabled={loading}
            />
          </div>
        )}
        <div>
          <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">{m.role}</label>
          <select
            value={role}
            onChange={(ev) => setRole(ev.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50"
            disabled={loading || userRole === "branch_manager"}
          >
            {FORM_ROLES.map((r) => (
              <option key={r} value={r}>{roles[r]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">{m.branch}</label>
          <select
            value={branchId || ""}
            onChange={(ev) => setBranchId(Number(ev.target.value))}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50"
            disabled={loading || userRole === "branch_manager"}
          >
            <option value="">{m.selectBranch}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name} — {b.governorate}</option>
            ))}
          </select>
        </div>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5">
            {m.cancel}
          </button>
          <button type="button" onClick={handleSave} disabled={loading} className="px-4 py-2 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-500 disabled:opacity-50">
            {loading ? "..." : m.save}
          </button>
        </div>
      </div>
    </BranchModal>
  );
}
