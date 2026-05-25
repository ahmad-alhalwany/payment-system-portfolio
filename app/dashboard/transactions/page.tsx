"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowLeftRight,
  Eye,
  Pencil,
  Printer,
  RefreshCw,
  Loader2,
  Search,
  CheckCircle2,
  Clock,
} from "lucide-react";
import TransactionDetailsModal from "@/components/transaction/TransactionDetailsModal";
import TransactionEditModal from "@/components/transaction/TransactionEditModal";
import TransactionStatusModal from "@/components/transaction/TransactionStatusModal";
import TransactionReceiptModal from "@/components/transaction/TransactionReceiptModal";
import axiosInstance from "@/app/api/axios";
import type { Transaction } from "@/app/api/transactions";
import { useLocale } from "@/components/providers/LocaleProvider";
import { getStatusBadgeClass, translateActivityStatus } from "@/lib/dashboard-utils";

interface Branch {
  id: number;
  name: string;
}

type StatusFilter = "all" | "processing" | "completed" | "cancelled" | "rejected" | "pending";

function normalizeCurrency(currency: string): string {
  if (!currency) return "—";
  const c = currency.toLowerCase();
  if (c.includes("usd") || c === "$") return "USD";
  if (c.includes("syp") || c.includes("ليرة")) return "SYP";
  return currency;
}

export default function TransactionsPage() {
  const { t } = useLocale();
  const tx = t.dashboard.transactions;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const selected = transactions.find((x) => x.id === selectedId);

  const fetchData = async (page = currentPage) => {
    setLoading(true);
    try {
      const [transactionsRes, branchesRes] = await Promise.all([
        axiosInstance.get("/transactions/", {
          params: {
            page,
            per_page: 15,
            status: statusFilter !== "all" ? statusFilter : undefined,
            branch_id: branchFilter !== "all" ? Number(branchFilter) : undefined,
            sender: searchTerm || undefined,
          },
        }),
        axiosInstance.get("/branches/"),
      ]);
      setTransactions(Array.isArray(transactionsRes.data.items) ? transactionsRes.data.items : []);
      setBranches(Array.isArray(branchesRes.data.branches) ? branchesRes.data.branches : []);
      setCurrentPage(transactionsRes.data.page || 1);
      setTotalPages(transactionsRes.data.total_pages || 1);
    } catch {
      toast.error(tx.errors.load);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, statusFilter, branchFilter]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return transactions;
    const q = searchTerm.toLowerCase();
    return transactions.filter(
      (tr) =>
        tr.id.toLowerCase().includes(q) ||
        tr.sender?.toLowerCase().includes(q) ||
        tr.receiver?.toLowerCase().includes(q) ||
        tr.employee_name?.toLowerCase().includes(q)
    );
  }, [transactions, searchTerm]);

  const summary = useMemo(
    () => ({
      total: transactions.length,
      processing: transactions.filter((x) => x.status === "processing" || x.status === "pending").length,
      completed: transactions.filter((x) => x.status === "completed").length,
      volume: transactions.reduce((s, x) => s + (x.amount || 0), 0),
    }),
    [transactions]
  );

  const branchLabel = (name?: string | null) => name || tx.mainBranch;

  const handleEdit = async (data: Record<string, string>) => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const response = await axiosInstance.put(`/transactions/${selected.id}/`, data);
      setTransactions((prev) => prev.map((tr) => (tr.id === selected.id ? { ...tr, ...response.data } : tr)));
      toast.success(tx.success.update);
      setShowEdit(false);
    } catch {
      toast.error(tx.errors.update);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const response = await axiosInstance.patch(`/transactions/${selected.id}/status/`, { status: newStatus });
      const updated = response.data.transaction;
      setTransactions((prev) => prev.map((tr) => (tr.id === selected.id ? { ...tr, ...updated } : tr)));
      toast.success(tx.success.status);
      setShowStatus(false);
    } catch {
      toast.error(tx.errors.status);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{tx.title}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{tx.subtitle}</p>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {selected ? `${tx.selected}: ${selected.short_id || selected.id.slice(0, 8)}` : tx.noSelection}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={tx.stats.total} value={summary.total} icon={ArrowLeftRight} color="blue" />
        <StatCard label={tx.stats.processing} value={summary.processing} icon={Clock} color="amber" />
        <StatCard label={tx.stats.completed} value={summary.completed} icon={CheckCircle2} color="emerald" />
        <StatCard label={tx.stats.volume} value={summary.volume.toLocaleString()} icon={ArrowLeftRight} color="violet" />
      </div>

      <div className="flex flex-wrap gap-2">
        <ActionButton icon={Eye} label={tx.actions.details} onClick={() => setShowDetails(true)} disabled={!selected} color="blue" />
        <ActionButton icon={Pencil} label={tx.actions.edit} onClick={() => setShowEdit(true)} disabled={!selected} color="violet" />
        <ActionButton icon={RefreshCw} label={tx.actions.status} onClick={() => setShowStatus(true)} disabled={!selected} color="emerald" />
        <ActionButton icon={Printer} label={tx.actions.print} onClick={() => setShowReceipt(true)} disabled={!selected} color="slate" />
        <ActionButton icon={RefreshCw} label={tx.actions.refresh} onClick={() => fetchData(currentPage)} color="amber" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={tx.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-10 pe-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white"
          />
        </div>
        <select
          value={branchFilter}
          onChange={(e) => { setBranchFilter(e.target.value); setCurrentPage(1); }}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white"
        >
          <option value="all">{tx.filterAllBranches}</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setCurrentPage(1); }}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white"
        >
          <option value="all">{tx.filterAllStatuses}</option>
          {(["processing", "completed", "cancelled", "rejected", "pending"] as const).map((s) => (
            <option key={s} value={s}>{t.dashboard.status[s]}</option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            <p className="text-slate-500">{tx.loading}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <ArrowLeftRight className="w-12 h-12 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500 dark:text-slate-400">{tx.empty}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                  {[tx.columns.id, tx.columns.sender, tx.columns.receiver, tx.columns.amount, tx.columns.currency, tx.columns.date, tx.columns.status, tx.columns.sendingBranch, tx.columns.receivingBranch, tx.columns.employee, tx.columns.actions].map((col) => (
                    <th key={col} className="py-3 px-3 text-start font-semibold whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filtered.map((tr) => (
                  <tr
                    key={tr.id}
                    onClick={() => setSelectedId(tr.id)}
                    className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]
                      ${selectedId === tr.id ? "bg-primary-500/10 ring-1 ring-inset ring-primary-500/30" : ""}`}
                  >
                    <td className="py-3 px-3 font-mono text-xs text-primary-600 dark:text-primary-400" title={tr.id}>
                      {tr.short_id || `${tr.id.slice(0, 8)}…`}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">{tr.sender}</td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{tr.receiver}</td>
                    <td className="py-3 px-3 tabular-nums font-semibold">{tr.amount?.toLocaleString()}</td>
                    <td className="py-3 px-3">{normalizeCurrency(tr.currency)}</td>
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600 dark:text-slate-400">{tr.date || tx.notAssigned}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(tr.status)}`}>
                        {translateActivityStatus(tr.status, t)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{branchLabel(tr.sending_branch_name)}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{branchLabel(tr.destination_branch_name)}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{tr.employee_name || tx.notAssigned}</td>
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <IconBtn icon={Eye} title={tx.actions.details} onClick={() => { setSelectedId(tr.id); setShowDetails(true); }} />
                        <IconBtn icon={Pencil} title={tx.actions.edit} onClick={() => { setSelectedId(tr.id); setShowEdit(true); }} />
                        <IconBtn icon={RefreshCw} title={tx.actions.status} onClick={() => { setSelectedId(tr.id); setShowStatus(true); }} />
                        <IconBtn icon={Printer} title={tx.actions.print} onClick={() => { setSelectedId(tr.id); setShowReceipt(true); }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">{tx.page} {currentPage} {tx.of} {totalPages}</p>
          <div className="flex gap-2">
            <button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 disabled:opacity-40 text-sm font-medium">
              {tx.prev}
            </button>
            <button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 disabled:opacity-40 text-sm font-medium">
              {tx.next}
            </button>
          </div>
        </div>
      )}

      <TransactionDetailsModal open={showDetails} onClose={() => setShowDetails(false)} transaction={selected} />
      <TransactionEditModal open={showEdit} onClose={() => setShowEdit(false)} transaction={selected} onSubmit={handleEdit} loading={actionLoading} />
      <TransactionStatusModal open={showStatus} onClose={() => setShowStatus(false)} transaction={selected} onSubmit={handleStatusUpdate} loading={actionLoading} />
      {showReceipt && selected && (
        <TransactionReceiptModal transfer={selected} onClose={() => setShowReceipt(false)} />
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; color: "blue" | "emerald" | "amber" | "violet" }) {
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

function ActionButton({ icon: Icon, label, onClick, disabled, color }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; disabled?: boolean; color: "blue" | "emerald" | "violet" | "slate" | "amber" }) {
  const colors = { blue: "bg-blue-600 hover:bg-blue-500", emerald: "bg-emerald-600 hover:bg-emerald-500", violet: "bg-violet-600 hover:bg-violet-500", slate: "bg-slate-600 hover:bg-slate-500", amber: "bg-amber-600 hover:bg-amber-500" };
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 ${colors[color]}`}>
      <Icon className="w-4 h-4" />{label}
    </button>
  );
}

function IconBtn({ icon: Icon, title, onClick }: { icon: React.ComponentType<{ className?: string }>; title: string; onClick: () => void }) {
  return (
    <button type="button" title={title} onClick={onClick} className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-500/10 transition-colors">
      <Icon className="w-4 h-4" />
    </button>
  );
}
