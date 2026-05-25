"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Loader2,
  Plus,
  Search,
  User,
} from "lucide-react";
import NewTransferForm from "./employee-dashboard/NewTransferForm";
import OutgoingTransfersTable from "./employee-dashboard/OutgoingTransfersTable";
import IncomingTransfersTable from "./employee-dashboard/IncomingTransfersTable";
import TransferGuidePanel from "@/components/money-transfer/TransferGuidePanel";
import TransactionReceiptModal from "@/components/transaction/TransactionReceiptModal";
import UserSearchModal from "@/components/ui/UserSearchModal";
import { useTransactions } from "@/app/hooks/useTransactions";
import { useBranches } from "@/app/hooks/useBranches";
import { useAuth } from "@/app/hooks/useAuth";
import axiosInstance from "@/app/api/axios";
import type { Transaction } from "@/app/api/transactions";
import { useLocale } from "@/components/providers/LocaleProvider";

type TabKey = "dashboard" | "new" | "outgoing" | "incoming";

interface Summary {
  outgoing_count: number;
  incoming_count: number;
  branch_name: string | null;
  username: string;
  role: string;
}

export default function MoneyTransferPage() {
  const { t } = useLocale();
  const m = t.dashboard.moneyTransfer;

  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [outgoingPage, setOutgoingPage] = useState(1);
  const [incomingPage, setIncomingPage] = useState(1);
  const perPage = 10;

  const [searchId, setSearchId] = useState("");
  const [searchSender, setSearchSender] = useState("");
  const [searchReceiver, setSearchReceiver] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [searchStartDate, setSearchStartDate] = useState("");
  const [searchEndDate, setSearchEndDate] = useState("");

  const [printData, setPrintData] = useState<Transaction | null>(null);

  const { loading: transactionsLoading, error: transactionsError, transactions, getTransactions, createTransaction, getTransaction, updateStatus, totalPages } = useTransactions();
  const { branches, currentBranch, getBranches, getBranch } = useBranches();
  const { user } = useAuth();

  const branchId = user?.branch_id ?? currentBranch?.id;

  const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "dashboard", label: m.tabs.home, icon: Building2 },
    { key: "new", label: m.tabs.new, icon: Plus },
    { key: "outgoing", label: m.tabs.outgoing, icon: ArrowUpRight },
    { key: "incoming", label: m.tabs.incoming, icon: ArrowDownLeft },
  ];

  const roleLabel = (role: string) =>
    t.dashboard.employees.roles[role as keyof typeof t.dashboard.employees.roles] ?? role;

  const branchDisplay = summary?.branch_name
    ?? (user?.role === "director" ? m.stats.allBranches : m.stats.mainBranch);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/money-transfer/summary/");
      setSummary(res.data);
    } catch {
      setSummary(null);
    }
  }, []);

  const buildParams = useCallback(
    (type: "outgoing" | "incoming", page: number) => {
      const params: Record<string, string | number | undefined> = { page, per_page: perPage };
      if (searchId) params.id = searchId;
      if (searchSender) params.sender = searchSender;
      if (searchReceiver) params.receiver = searchReceiver;
      if (searchStatus && searchStatus !== "all") params.status = searchStatus;
      if (searchStartDate) params.start_date = searchStartDate;
      if (searchEndDate) params.end_date = searchEndDate;
      if (user?.role !== "director" && branchId) {
        if (type === "outgoing") params.branch_id = branchId;
        if (type === "incoming") params.destination_branch_id = branchId;
      }
      return params;
    },
    [searchId, searchSender, searchReceiver, searchStatus, searchStartDate, searchEndDate, user?.role, branchId, perPage]
  );

  useEffect(() => {
    getBranches();
    fetchSummary();
  }, [getBranches, fetchSummary]);

  useEffect(() => {
    if (user?.branch_id) getBranch(user.branch_id);
  }, [user?.branch_id, getBranch]);

  useEffect(() => {
    if (activeTab === "outgoing" && (user?.role === "director" || branchId)) {
      getTransactions(buildParams("outgoing", outgoingPage));
    }
  }, [activeTab, outgoingPage, buildParams, getTransactions, user?.role, branchId]);

  useEffect(() => {
    if (activeTab === "incoming" && (user?.role === "director" || branchId)) {
      getTransactions(buildParams("incoming", incomingPage));
    }
  }, [activeTab, incomingPage, buildParams, getTransactions, user?.role, branchId]);

  useEffect(() => {
    if (transactionsError) toast.error(transactionsError);
  }, [transactionsError]);

  const handleAddTransfer = async (transfer: {
    sender: { name: string; mobile?: string; governorate?: string; location?: string; id?: string; address?: string };
    receiver: { name: string; mobile?: string; governorate?: string };
    amount: number;
    benefitAmount?: number;
    currency: string;
    branch: string;
    message?: string;
    resetForm?: () => void;
  }) => {
    try {
      const result = await createTransaction({
        sender: transfer.sender.name,
        sender_mobile: transfer.sender.mobile || "",
        sender_governorate: transfer.sender.governorate || "",
        sender_location: transfer.sender.location || "",
        sender_id: transfer.sender.id || "",
        sender_address: transfer.sender.address || "",
        receiver: transfer.receiver.name,
        receiver_mobile: transfer.receiver.mobile || "",
        receiver_governorate: transfer.receiver.governorate || "",
        amount: transfer.amount,
        base_amount: transfer.amount,
        benefited_amount: transfer.benefitAmount || transfer.amount,
        tax_rate: 0,
        tax_amount: 0,
        currency: transfer.currency,
        message: transfer.message || "",
        employee_name: user?.username || "",
        branch_governorate: currentBranch?.governorate || "",
        destination_branch_id: parseInt(transfer.branch, 10),
        branch_id: user?.role === "director" ? 0 : currentBranch?.id,
        date: new Date().toISOString(),
        status: "processing",
        is_received: false,
      });
      toast.success(m.success.created);
      transfer.resetForm?.();
      setActiveTab("outgoing");
      setOutgoingPage(1);
      fetchSummary();
      if (result?.transaction_id) {
        const full = await getTransaction(result.transaction_id);
        setPrintData(full as Transaction);
      }
    } catch {
      toast.error(m.errors.create);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus({ transaction_id: id, status });
      toast.success(t.dashboard.transactions.success.status);
      if (activeTab === "outgoing") getTransactions(buildParams("outgoing", outgoingPage));
      if (activeTab === "incoming") getTransactions(buildParams("incoming", incomingPage));
      fetchSummary();
    } catch {
      toast.error(m.errors.status);
    }
  };

  const clearFilters = () => {
    setSearchId("");
    setSearchSender("");
    setSearchReceiver("");
    setSearchStatus("");
    setSearchStartDate("");
    setSearchEndDate("");
  };

  const outgoingList =
    user?.role === "director" || !branchId
      ? transactions
      : transactions.filter((tr) => tr.branch_id === branchId);

  const incomingList =
    user?.role === "director" || !branchId
      ? transactions
      : transactions.filter((tr) => tr.destination_branch_id === branchId);

  const TransferSectionHeader = ({ type }: { type: "outgoing" | "incoming" }) => {
    const isOut = type === "outgoing";
    const Icon = isOut ? ArrowUpRight : ArrowDownLeft;
    const title = isOut ? m.sections.outgoingTitle : m.sections.incomingTitle;
    const desc = isOut ? m.sections.outgoingDesc : m.sections.incomingDesc;
    const count = isOut ? summary?.outgoing_count : summary?.incoming_count;
    const color = isOut ? "text-blue-600 dark:text-blue-400" : "text-emerald-600 dark:text-emerald-400";
    const bg = isOut ? "bg-blue-500/10 border-blue-500/20" : "bg-emerald-500/10 border-emerald-500/20";
    return (
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl border ${bg} mb-6`}>
        <div className="flex gap-3">
          <div className={`p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/50 ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
          </div>
        </div>
        {count !== undefined && (
          <span className={`inline-flex self-start sm:self-center px-3 py-1 rounded-full text-sm font-bold ${color} bg-white/80 dark:bg-slate-900/50`}>
            {count.toLocaleString()}
          </span>
        )}
      </div>
    );
  };

  const FilterBar = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10">
      <FilterInput label={m.filters.id} value={searchId} onChange={setSearchId} />
      <FilterInput label={m.filters.sender} value={searchSender} onChange={setSearchSender} />
      <FilterInput label={m.filters.receiver} value={searchReceiver} onChange={setSearchReceiver} />
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">{m.filters.status}</label>
        <select value={searchStatus} onChange={(e) => setSearchStatus(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 text-sm">
          <option value="all">{m.filters.all}</option>
          {(["pending", "processing", "completed", "cancelled", "rejected"] as const).map((s) => (
            <option key={s} value={s}>{t.dashboard.status[s]}</option>
          ))}
        </select>
      </div>
      <FilterInput label={m.filters.fromDate} value={searchStartDate} onChange={setSearchStartDate} type="date" />
      <FilterInput label={m.filters.toDate} value={searchEndDate} onChange={setSearchEndDate} type="date" />
      <div className="flex items-end">
        <button type="button" onClick={clearFilters} className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15">
          {m.actions.clearFilters}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-6">
        <div className="text-center md:text-start">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{m.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{m.subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  if (tab.key === "outgoing") setOutgoingPage(1);
                  if (tab.key === "incoming") setIncomingPage(1);
                }}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
                  ${activeTab === tab.key
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-500/25"
                    : "bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-primary-500/40"}`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm p-4 md:p-8 min-h-[420px]">
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={ArrowUpRight} label={m.stats.outgoing} value={summary?.outgoing_count ?? 0} color="blue" />
                <StatCard icon={ArrowDownLeft} label={m.stats.incoming} value={summary?.incoming_count ?? 0} color="emerald" />
                <StatCard icon={User} label={m.stats.employee} value={summary?.username || user?.username || "—"} color="violet" />
                <StatCard icon={Building2} label={m.stats.branch} value={branchDisplay} color="amber" sub={user?.role ? roleLabel(user.role) : undefined} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <QuickAction icon={Plus} label={m.actions.newTransfer} onClick={() => setActiveTab("new")} color="primary" />
                <QuickAction icon={ArrowUpRight} label={m.actions.viewOutgoing} onClick={() => setActiveTab("outgoing")} color="blue" />
                <QuickAction icon={ArrowDownLeft} label={m.actions.viewIncoming} onClick={() => setActiveTab("incoming")} color="emerald" />
                <QuickAction icon={Search} label={m.actions.search} onClick={() => setShowSearchModal(true)} color="violet" />
              </div>
            </div>
          )}

          {activeTab === "new" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <NewTransferForm
                  onSubmit={handleAddTransfer}
                  branches={branches.filter((b) => b.id !== currentBranch?.id)}
                  currentBranch={currentBranch}
                />
              </div>
              <TransferGuidePanel />
            </div>
          )}

          {activeTab === "outgoing" && (
            <>
              <TransferSectionHeader type="outgoing" />
              <FilterBar />
              <div className="flex justify-end mb-4">
                <button type="button" onClick={() => getTransactions(buildParams("outgoing", outgoingPage))} disabled={transactionsLoading} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">
                  {transactionsLoading ? "..." : m.actions.refresh}
                </button>
              </div>
              {transactionsLoading ? (
                <LoadingState label={t.dashboard.transactions.loading} />
              ) : (
                <OutgoingTransfersTable transfers={outgoingList} onStatusChange={handleStatusChange} currentPage={outgoingPage} totalPages={totalPages} onPageChange={setOutgoingPage} loading={false} emptyHint={m.sections.outgoingDesc} />
              )}
            </>
          )}

          {activeTab === "incoming" && (
            <>
              <TransferSectionHeader type="incoming" />
              <FilterBar />
              <div className="flex justify-end mb-4">
                <button type="button" onClick={() => getTransactions(buildParams("incoming", incomingPage))} disabled={transactionsLoading} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">
                  {transactionsLoading ? "..." : m.actions.refresh}
                </button>
              </div>
              {transactionsLoading ? (
                <LoadingState label={t.dashboard.transactions.loading} />
              ) : (
                <IncomingTransfersTable transfers={incomingList} onStatusChange={handleStatusChange} currentPage={incomingPage} totalPages={totalPages} onPageChange={setIncomingPage} loading={false} emptyHint={m.sections.incomingDesc} />
              )}
            </>
          )}
        </div>
      </div>

      {showSearchModal && (
        <UserSearchModal open={showSearchModal} onClose={() => setShowSearchModal(false)} onSelect={() => setShowSearchModal(false)} />
      )}
      {printData && (
        <TransactionReceiptModal transfer={printData} onClose={() => setPrintData(null)} />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; color: "blue" | "emerald" | "violet" | "amber"; sub?: string }) {
  const colors = {
    blue: "from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-600 dark:text-blue-400",
    emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    violet: "from-violet-500/20 to-violet-600/5 border-violet-500/20 text-violet-600 dark:text-violet-400",
    amber: "from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-600 dark:text-amber-400",
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2 opacity-80">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-black text-slate-900 dark:text-white truncate">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick, color }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; color: "primary" | "blue" | "emerald" | "violet" }) {
  const colors = { primary: "bg-primary-600 hover:bg-primary-500", blue: "bg-blue-600 hover:bg-blue-500", emerald: "bg-emerald-600 hover:bg-emerald-500", violet: "bg-violet-600 hover:bg-violet-500" };
  return (
    <button type="button" onClick={onClick} className={`flex items-center gap-3 p-5 rounded-2xl text-white font-semibold transition-colors ${colors[color]}`}>
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );
}

function FilterInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 text-sm" />
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center py-16 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      <p className="text-slate-500">{label}</p>
    </div>
  );
}
