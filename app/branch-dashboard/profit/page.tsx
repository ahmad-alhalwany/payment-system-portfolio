"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  BarChart3,
  Building2,
  Download,
  Loader2,
  RefreshCw,
  Search,
  Table2,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import ProfitGuidePanel from "@/components/branch-manager/ProfitGuidePanel";
import { branchProfitsApi, type BranchProfitItem } from "@/app/api/branch-profits";
import { useLocale } from "@/components/providers/LocaleProvider";
import { getStatusBadgeClass, translateActivityStatus } from "@/lib/dashboard-utils";

type ProfitTab = "table" | "chart";

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30";

function exportToCSV(items: BranchProfitItem[], columns: { key: keyof BranchProfitItem; label: string }[], filename: string) {
  const header = columns.map((col) => col.label).join(",");
  const rows = items.map((row) =>
    columns.map((col) => {
      const val = row[col.key];
      return typeof val === "string" && val.includes(",") ? `"${val}"` : String(val ?? "");
    }).join(",")
  );
  const blob = new Blob([header, ...rows].join("\n"), { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function BranchProfitPage() {
  const { t, locale } = useLocale();
  const p = t.dashboard.manager.profit;

  const [tab, setTab] = useState<ProfitTab>("table");
  const [branchName, setBranchName] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currency, setCurrency] = useState("all");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BranchProfitItem[]>([]);
  const [stats, setStats] = useState({
    total_profits_syp: 0,
    total_profits_usd: 0,
    total_transactions: 0,
    avg_tax_rate: 0,
  });
  const [chart, setChart] = useState<{ currency: string; profit: number }[]>([]);

  const columns = useMemo(
    () => [
      { key: "id" as const, label: p.columns.id },
      { key: "date" as const, label: p.columns.date },
      { key: "benefited_amount" as const, label: p.columns.benefited },
      { key: "tax_rate" as const, label: p.columns.taxRate },
      { key: "tax_amount" as const, label: p.columns.taxAmount },
      { key: "profit" as const, label: p.columns.profit },
      { key: "currency" as const, label: p.columns.currency },
      { key: "status" as const, label: p.columns.status },
    ],
    [p.columns]
  );

  const fetchProfits = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await branchProfitsApi.list({
        start_date: fromDate || undefined,
        end_date: toDate || undefined,
        currency: currency === "all" ? undefined : currency,
        search: appliedSearch.trim() || undefined,
      });
      setBranchName(data.branch.name);
      setItems(data.items);
      setStats(data.stats);
      setChart(data.chart);
    } catch {
      toast.error(p.errors.load);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, currency, appliedSearch, p.errors.load]);

  useEffect(() => {
    fetchProfits();
  }, [fetchProfits]);

  const formatMoney = (value: number, cur?: string) => {
    const formatted = value.toLocaleString(locale === "ar" ? "ar-SY" : "en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    if (!cur) return formatted;
    const upper = cur.toUpperCase();
    if (upper.includes("USD") || cur.includes("$")) return `$${formatted}`;
    return `${formatted} ${locale === "ar" ? "ل.س" : "SYP"}`;
  };

  const chartData = chart.map((row) => ({
    currency: row.currency === "USD" ? (locale === "ar" ? "$" : "USD") : locale === "ar" ? "ل.س" : "SYP",
    profit: row.profit,
  }));

  const tabs: { key: ProfitTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "table", label: p.tabs.table, icon: Table2 },
    { key: "chart", label: p.tabs.chart, icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-emerald-600" />
            {p.title}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">{p.subtitle}</p>
          {branchName && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              {p.branchLabel}: {branchName}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 p-5 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">{p.stats.totalSyp}</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
            {formatMoney(stats.total_profits_syp)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 p-5 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">{p.stats.totalUsd}</p>
          <p className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">
            {formatMoney(stats.total_profits_usd, "USD")}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 p-5 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">{p.stats.transactions}</p>
          <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
            {stats.total_transactions.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 p-5 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">{p.stats.avgTax}</p>
          <p className="text-2xl font-bold mt-1 text-violet-600 dark:text-violet-400">
            {stats.avg_tax_rate}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/50">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${tab === key
                    ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 p-4 md:p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative sm:col-span-2">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="search"
                  placeholder={p.filters.search}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`${inputClass} ps-9`}
                />
              </div>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className={inputClass}
                aria-label={p.filters.fromDate}
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className={inputClass}
                aria-label={p.filters.toDate}
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={inputClass}
                aria-label={p.filters.currency}
              >
                <option value="all">{p.filters.all}</option>
                <option value="SYP">{locale === "ar" ? "ليرة سورية" : "SYP"}</option>
                <option value="USD">{locale === "ar" ? "دولار أمريكي" : "USD"}</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAppliedSearch(search.trim())}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {p.actions.apply}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                  setCurrency("all");
                  setSearch("");
                  setAppliedSearch("");
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5"
              >
                <RefreshCw className="w-4 h-4" />
                {p.actions.refresh}
              </button>
              <button
                type="button"
                onClick={() => exportToCSV(items, columns, "branch_profits.csv")}
                disabled={items.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm font-medium hover:bg-amber-500/10 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {p.actions.export}
              </button>
            </div>

            {tab === "table" && (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
                      {columns.map((col) => (
                        <th key={col.key} className="px-4 py-3 text-start font-semibold whitespace-nowrap">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                          {p.loading}
                        </td>
                      </tr>
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                          {p.empty}
                        </td>
                      </tr>
                    ) : (
                      items.map((row) => (
                        <tr
                          key={row.id}
                          className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50/80 dark:hover:bg-white/[0.02]"
                        >
                          <td className="px-4 py-3 font-mono text-xs">{row.id}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{row.date ?? "—"}</td>
                          <td className="px-4 py-3">{formatMoney(row.benefited_amount, row.currency)}</td>
                          <td className="px-4 py-3">{row.tax_rate}%</td>
                          <td className="px-4 py-3">{formatMoney(row.tax_amount, row.currency)}</td>
                          <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatMoney(row.profit, row.currency)}
                          </td>
                          <td className="px-4 py-3">{row.currency}</td>
                          <td className="px-4 py-3">
                            <span className={getStatusBadgeClass(row.status)}>
                              {translateActivityStatus(row.status, t)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "chart" && (
              <div className="pt-2">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{p.chartTitle}</h3>
                {chartData.every((d) => d.profit === 0) ? (
                  <p className="text-center text-slate-500 py-12">{p.empty}</p>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                      <XAxis dataKey="currency" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="profit" fill="#10b981" name={p.columns.profit} radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}
          </div>
        </div>

        <ProfitGuidePanel />
      </div>
    </div>
  );
}
