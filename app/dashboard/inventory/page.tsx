"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  BarChart3,
  Download,
  Loader2,
  Percent,
  Printer,
  RefreshCw,
  Table2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import InventoryGuidePanel from "@/components/inventory/InventoryGuidePanel";
import { inventoryApi, type InventoryBranchRow, type InventoryResponse, type InventoryTransactionRow } from "@/app/api/inventory";
import axiosInstance from "@/app/api/axios";
import { useLocale } from "@/components/providers/LocaleProvider";
import { getStatusBadgeClass, translateActivityStatus } from "@/lib/dashboard-utils";

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30";

export default function InventoryPage() {
  const { t } = useLocale();
  const inv = t.dashboard.inventory;
  const today = new Date().toISOString().slice(0, 10);

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [branchId, setBranchId] = useState("all");
  const [currency, setCurrency] = useState("all");
  const [status, setStatus] = useState("completed");
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InventoryResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"tables" | "charts">("tables");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axiosInstance.get("/branches/").then((res) => {
      const list = res.data?.branches ?? res.data ?? [];
      setBranches(Array.isArray(list) ? list.map((b: { id: number; name: string }) => ({ id: b.id, name: b.name })) : []);
    }).catch(() => setBranches([]));
  }, []);

  const buildParams = useCallback(
    () => ({
      from_date: fromDate,
      to_date: toDate,
      branch_id: branchId !== "all" ? Number(branchId) : undefined,
      currency: currency !== "all" ? currency : undefined,
      status: status !== "all" ? status : undefined,
    }),
    [fromDate, toDate, branchId, currency, status]
  );

  const fetchData = useCallback(async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate) || !/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
      toast.error(inv.errors.invalidDate);
      return;
    }
    setLoading(true);
    try {
      const res = await inventoryApi.summary(buildParams());
      setData(res.data);
    } catch {
      toast.error(inv.errors.load, { id: "inventory-load-error" });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [buildParams, fromDate, toDate, inv.errors]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportCsv = async () => {
    try {
      const res = await inventoryApi.exportCsv(buildParams());
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventory-${today}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(inv.errors.export);
    }
  };

  const handlePrint = () => window.print();

  const summary = data?.summary;
  const byBranch = data?.by_branch ?? [];
  const transactions = data?.transactions ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{inv.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{inv.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {summary && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <StatCard icon={Wallet} label={inv.stats.taxCollected} value={summary.tax_collected.toLocaleString()} color="blue" />
              <StatCard icon={TrendingUp} label={inv.stats.transactionsCount} value={summary.transactions_count} color="violet" />
              <StatCard icon={BarChart3} label={inv.stats.totalProfit} value={summary.total_profit.toLocaleString()} color="emerald" />
              <StatCard icon={Percent} label={inv.stats.avgTaxRate} value={`${summary.avg_tax_rate}%`} color="amber" />
              <StatCard icon={Wallet} label={inv.stats.totalBenefited} value={summary.total_benefited_amount.toLocaleString()} color="slate" />
            </div>
          )}

          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 p-5 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <Field label={inv.filters.fromDate}>
                <input type="date" className={inputClass} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </Field>
              <Field label={inv.filters.toDate}>
                <input type="date" className={inputClass} value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </Field>
              <Field label={inv.filters.branch}>
                <select className={inputClass} value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                  <option value="all">{inv.filters.allBranches}</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </Field>
              <Field label={inv.filters.currency}>
                <select className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="all">{t.dashboard.reports.filters.all}</option>
                  <option value="SYP">SYP</option>
                  <option value="USD">USD</option>
                </select>
              </Field>
              <Field label={inv.filters.status}>
                <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="all">{t.dashboard.reports.filters.all}</option>
                  <option value="completed">{t.dashboard.status.completed}</option>
                  <option value="processing">{t.dashboard.status.processing}</option>
                  <option value="pending">{t.dashboard.status.pending}</option>
                  <option value="cancelled">{t.dashboard.status.cancelled}</option>
                  <option value="rejected">{t.dashboard.status.rejected}</option>
                </select>
              </Field>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <button type="button" onClick={fetchData} disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-500 disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {inv.filters.apply}
              </button>
              <button type="button" onClick={fetchData} disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-300 dark:hover:bg-white/15 disabled:opacity-50">
                <RefreshCw className="w-4 h-4" />
                {inv.filters.refresh}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <button type="button" onClick={handleExportCsv} disabled={loading || !data} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50">
              <Download className="w-4 h-4" />
              {inv.actions.exportCsv}
            </button>
            <button type="button" onClick={handlePrint} disabled={!data} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 disabled:opacity-50">
              <Printer className="w-4 h-4" />
              {inv.actions.print}
            </button>
          </div>

          <div ref={printRef} className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 overflow-hidden">
            <div className="flex gap-2 p-4 border-b border-slate-200 dark:border-white/10">
              <TabBtn active={activeTab === "tables"} onClick={() => setActiveTab("tables")} icon={Table2} label={inv.tabs.tables} />
              <TabBtn active={activeTab === "charts"} onClick={() => setActiveTab("charts")} icon={BarChart3} label={inv.tabs.charts} />
            </div>

            {loading ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                <p className="text-slate-500">{inv.filters.refresh}...</p>
              </div>
            ) : activeTab === "charts" ? (
              <div className="p-6 min-h-[320px]">
                {byBranch.length === 0 ? (
                  <p className="text-center text-slate-500 py-12">{inv.charts.noData}</p>
                ) : (
                  <>
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4">{inv.charts.taxVsProfit}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={byBranch}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="branch_name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="tax_amount" name={inv.columns.tax} fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="profit" name={inv.columns.profit} fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                )}
              </div>
            ) : byBranch.length === 0 && transactions.length === 0 ? (
              <p className="text-center text-slate-500 py-16">{inv.empty}</p>
            ) : (
              <div className="p-4 space-y-8">
                {byBranch.length > 0 && (
                  <section>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">{inv.tables.byBranch}</h3>
                    <DataTable
                      columns={[
                        { key: "branch_name", label: inv.columns.branch },
                        { key: "tax_rate", label: inv.columns.taxRate, fmt: (v) => `${Number(v).toFixed(2)}%` },
                        { key: "transaction_count", label: inv.columns.count },
                        { key: "total_amount", label: inv.columns.totalAmount, fmt: (v) => Number(v).toLocaleString() },
                        { key: "benefited_amount", label: inv.columns.benefited, fmt: (v) => Number(v).toLocaleString() },
                        { key: "tax_amount", label: inv.columns.tax, fmt: (v) => Number(v).toLocaleString() },
                        { key: "profit", label: inv.columns.profit, fmt: (v) => Number(v).toLocaleString() },
                        { key: "currency", label: inv.columns.currency },
                      ]}
                      rows={byBranch}
                    />
                  </section>
                )}
                {transactions.length > 0 && (
                  <section>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">{inv.tables.transactions}</h3>
                    <DataTable
                      columns={[
                        { key: "id", label: inv.columns.id },
                        { key: "date", label: inv.columns.date, fmt: (v) => String(v).split("T")[0] },
                        { key: "amount", label: inv.columns.totalAmount, fmt: (v) => Number(v).toLocaleString() },
                        { key: "benefited_amount", label: inv.columns.benefited, fmt: (v) => Number(v).toLocaleString() },
                        { key: "tax_rate", label: inv.columns.taxRate, fmt: (v) => `${Number(v).toFixed(2)}%` },
                        { key: "tax_amount", label: inv.columns.tax, fmt: (v) => Number(v).toLocaleString() },
                        { key: "profit", label: inv.columns.profit, fmt: (v) => Number(v).toLocaleString() },
                        { key: "sending_branch_name", label: inv.columns.sendingBranch },
                        { key: "destination_branch_name", label: inv.columns.receivingBranch },
                        { key: "status", label: inv.columns.status, status: true },
                      ]}
                      rows={transactions}
                      t={t}
                    />
                  </section>
                )}
              </div>
            )}
          </div>
        </div>

        <InventoryGuidePanel />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: "blue" | "emerald" | "violet" | "amber" | "slate";
}) {
  const colors = {
    blue: "from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-600 dark:text-blue-400",
    emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    violet: "from-violet-500/20 to-violet-600/5 border-violet-500/20 text-violet-600 dark:text-violet-400",
    amber: "from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-600 dark:text-amber-400",
    slate: "from-slate-500/20 to-slate-600/5 border-slate-500/20 text-slate-600 dark:text-slate-400",
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-4 ${colors[color]}`}>
      <div className="flex items-center gap-1.5 mb-1 opacity-80">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl font-black text-slate-900 dark:text-white truncate">{value}</p>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors
        ${active ? "bg-primary-600 text-white" : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300"}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function DataTable({
  columns,
  rows,
  t,
}: {
  columns: { key: string; label: string; fmt?: (v: unknown) => string; status?: boolean }[];
  rows: InventoryBranchRow[] | InventoryTransactionRow[];
  t?: ReturnType<typeof useLocale>["t"];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10">
            {columns.map((col) => (
              <th key={col.key} className="px-3 py-2.5 text-start font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
              {columns.map((col) => {
                const raw = (row as unknown as Record<string, unknown>)[col.key];
                if (col.status && t && typeof raw === "string") {
                  return (
                    <td key={col.key} className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-semibold ${getStatusBadgeClass(raw)}`}>
                        {translateActivityStatus(raw, t)}
                      </span>
                    </td>
                  );
                }
                return (
                  <td key={col.key} className="px-3 py-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {col.fmt ? col.fmt(raw) : String(raw ?? "—")}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
