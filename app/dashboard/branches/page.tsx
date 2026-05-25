"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Building2,
  GitBranchPlus,
  Pencil,
  Trash2,
  Wallet,
  Percent,
  History,
  Loader2,
  Search,
} from "lucide-react";
import BranchModal from "@/components/branch/BranchModal";
import BranchForm from "@/components/branch/BranchForm";
import BranchFundHistoryModal from "@/components/branch/BranchFundHistoryModal";
import BranchFundsModal from "@/components/branch/BranchFundsModal";
import BranchTaxModal from "@/components/branch/BranchTaxModal";
import axiosInstance from "@/app/api/axios";
import { useLocale } from "@/components/providers/LocaleProvider";

interface Branch {
  id: number;
  branch_id: string;
  name: string;
  location: string;
  governorate: string;
  phone_number?: string;
  employee_count: number;
  allocated_amount_syp: number;
  allocated_amount_usd: number;
  tax_rate: number;
  status: string;
}

export default function BranchesPage() {
  const { t } = useLocale();
  const b = t.dashboard.branches;

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFundsModal, setShowFundsModal] = useState(false);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const selectedBranch = branches.find((x) => x.id === selectedBranchId);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/branches/?include_employee_count=true");
      const list = response.data.branches ?? response.data;
      setBranches(Array.isArray(list) ? list : []);
    } catch {
      toast.error(b.errors.load);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const filteredBranches = useMemo(() => {
    let result = [...branches];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (branch) =>
          branch.name.toLowerCase().includes(q) ||
          branch.location.toLowerCase().includes(q) ||
          branch.governorate.toLowerCase().includes(q) ||
          branch.branch_id.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((branch) => branch.status === statusFilter);
    }
    return result;
  }, [branches, searchTerm, statusFilter]);

  const summary = useMemo(() => ({
    total: branches.length,
    active: branches.filter((b) => b.status === "active").length,
    totalSyp: branches.reduce((s, b) => s + (b.allocated_amount_syp ?? 0), 0),
    totalUsd: branches.reduce((s, b) => s + (b.allocated_amount_usd ?? 0), 0),
  }), [branches]);

  const handleAddBranch = async (data: Record<string, unknown>) => {
    try {
      await axiosInstance.post("/branches/", data);
      toast.success(b.success.add);
      setShowAddModal(false);
      await fetchBranches();
    } catch {
      toast.error(b.errors.add);
    }
  };

  const handleEditBranch = async (data: Record<string, unknown>) => {
    if (!selectedBranchId) return;
    try {
      await axiosInstance.put(`/branches/${selectedBranchId}`, data);
      toast.success(b.success.update);
      setShowEditModal(false);
      await fetchBranches();
    } catch {
      toast.error(b.errors.update);
    }
  };

  const handleDeleteBranch = async () => {
    if (!selectedBranchId) return;
    try {
      await axiosInstance.delete(`/branches/${selectedBranchId}/`);
      toast.success(b.success.delete);
      setShowDeleteModal(false);
      setSelectedBranchId(null);
      await fetchBranches();
    } catch {
      toast.error(b.errors.delete);
    }
  };

  const handleUpdateTaxRate = async (taxRate: number) => {
    if (!selectedBranchId) return;
    try {
      await axiosInstance.put(`/api/branches/${selectedBranchId}/tax_rate/`, { tax_rate: taxRate });
      toast.success(b.tax.updateSuccess);
      setShowTaxModal(false);
      await fetchBranches();
    } catch {
      toast.error(b.errors.tax);
    }
  };

  const handleClearTax = async () => {
    if (!selectedBranchId || !selectedBranch) return;
    if (selectedBranch.tax_rate === 0) return;
    const confirmed = window.confirm(b.tax.clearConfirm);
    if (!confirmed) return;
    try {
      await axiosInstance.delete(`/api/branches/${selectedBranchId}/tax_rate/`);
      toast.success(b.tax.clearSuccess);
      await fetchBranches();
    } catch {
      toast.error(b.errors.clearTax);
    }
  };

  const statusLabel = (status: string) =>
    status === "active" ? t.dashboard.status.active : t.dashboard.status.inactive;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{b.title}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{b.subtitle}</p>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {selectedBranch ? `${b.selected}: ${selectedBranch.name}` : b.noSelection}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={b.stats.total} value={summary.total} icon={Building2} color="blue" />
        <StatCard label={b.stats.active} value={summary.active} icon={GitBranchPlus} color="emerald" />
        <StatCard label={b.stats.balanceSyp} value={summary.totalSyp.toLocaleString()} icon={Wallet} color="amber" />
        <StatCard label={b.stats.balanceUsd} value={`$${summary.totalUsd.toLocaleString()}`} icon={Wallet} color="violet" />
      </div>

      <div className="flex flex-wrap gap-2">
        <ActionButton icon={GitBranchPlus} label={b.actions.add} onClick={() => setShowAddModal(true)} color="emerald" />
        <ActionButton icon={Pencil} label={b.actions.edit} onClick={() => setShowEditModal(true)} disabled={!selectedBranchId} color="blue" />
        <ActionButton icon={Trash2} label={b.actions.delete} onClick={() => setShowDeleteModal(true)} disabled={!selectedBranchId} color="red" />
        <ActionButton icon={Wallet} label={b.actions.funds} onClick={() => setShowFundsModal(true)} disabled={!selectedBranchId} color="amber" />
        <ActionButton icon={Percent} label={b.actions.setTax} onClick={() => setShowTaxModal(true)} disabled={!selectedBranchId} color="violet" />
        <ActionButton icon={Percent} label={b.actions.clearTax} onClick={handleClearTax} disabled={!selectedBranchId} color="slate" />
        <ActionButton icon={History} label={b.actions.history} onClick={() => setShowHistoryModal(true)} disabled={!selectedBranchId} color="cyan" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={b.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-10 pe-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white"
        >
          <option value="all">{b.filterAll}</option>
          <option value="active">{b.filterActive}</option>
          <option value="inactive">{b.filterInactive}</option>
        </select>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            <p className="text-slate-500">{b.loading}</p>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
            <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500 dark:text-slate-400">{b.empty}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                  {[b.columns.branchId, b.columns.name, b.columns.location, b.columns.governorate, b.columns.employees, b.columns.balanceSyp, b.columns.balanceUsd, b.columns.taxRate, b.columns.status, b.columns.phone].map((col) => (
                    <th key={col} className="py-3 px-4 text-start font-semibold whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredBranches.map((branch) => (
                  <tr
                    key={branch.id}
                    onClick={() => setSelectedBranchId(branch.id)}
                    className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]
                      ${selectedBranchId === branch.id ? "bg-primary-500/10 ring-1 ring-inset ring-primary-500/30" : ""}`}
                  >
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-300">{branch.branch_id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{branch.name}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{branch.location}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{branch.governorate}</td>
                    <td className="py-3 px-4 tabular-nums">{branch.employee_count ?? 0}</td>
                    <td className="py-3 px-4 tabular-nums font-medium">{(branch.allocated_amount_syp ?? 0).toLocaleString()}</td>
                    <td className="py-3 px-4 tabular-nums font-medium">{(branch.allocated_amount_usd ?? 0).toLocaleString()}</td>
                    <td className="py-3 px-4 tabular-nums">{branch.tax_rate ?? 0}%</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold
                        ${branch.status === "active"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : "bg-slate-500/15 text-slate-600 dark:text-slate-400"}`}>
                        {statusLabel(branch.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{branch.phone_number || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BranchModal open={showAddModal} onClose={() => setShowAddModal(false)} title={b.modals.addTitle}>
        <BranchForm onSubmit={handleAddBranch} onCancel={() => setShowAddModal(false)} />
      </BranchModal>

      {selectedBranch && (
        <>
          <BranchModal open={showEditModal} onClose={() => setShowEditModal(false)} title={b.modals.editTitle}>
            <BranchForm initialData={selectedBranch} onSubmit={handleEditBranch} onCancel={() => setShowEditModal(false)} />
          </BranchModal>

          <BranchFundsModal
            open={showFundsModal}
            onClose={() => setShowFundsModal(false)}
            branch={selectedBranch}
            onSuccess={fetchBranches}
          />

          <BranchTaxModal
            open={showTaxModal}
            onClose={() => setShowTaxModal(false)}
            branch={selectedBranch}
            onSubmit={handleUpdateTaxRate}
          />

          <BranchFundHistoryModal
            open={showHistoryModal}
            onClose={() => setShowHistoryModal(false)}
            branch={{ id: String(selectedBranch.id), name: selectedBranch.name }}
          />
        </>
      )}

      {showDeleteModal && selectedBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{b.modals.deleteTitle}</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">{b.modals.deleteMessage}</p>
            <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-4 mb-6 text-sm space-y-1">
              <p><strong>{b.columns.branchId}:</strong> {selectedBranch.branch_id}</p>
              <p><strong>{b.columns.name}:</strong> {selectedBranch.name}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowDeleteModal(false)} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5">
                {b.modals.cancel}
              </button>
              <button type="button" onClick={handleDeleteBranch} className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500">
                {b.modals.confirmDelete}
              </button>
            </div>
          </div>
        </div>
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
  color: "emerald" | "blue" | "red" | "amber" | "violet" | "slate" | "cyan";
}) {
  const colors = {
    emerald: "bg-emerald-600 hover:bg-emerald-500",
    blue: "bg-blue-600 hover:bg-blue-500",
    red: "bg-red-600 hover:bg-red-500",
    amber: "bg-amber-600 hover:bg-amber-500",
    violet: "bg-violet-600 hover:bg-violet-500",
    slate: "bg-slate-600 hover:bg-slate-500",
    cyan: "bg-cyan-600 hover:bg-cyan-500",
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
