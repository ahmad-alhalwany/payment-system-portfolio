"use client";

import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  BarChart3,
  Building2,
  Calendar,
  Download,
  FileText,
  Loader2,
  PieChart as PieChartIcon,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import ReportsGuidePanel from "@/components/reports/ReportsGuidePanel";
import { reportsApi, type ChartData, type ReportStats, type ReportTab } from "@/app/api/reports";
import { useLocale } from "@/components/providers/LocaleProvider";
import { getStatusBadgeClass, translateActivityStatus } from "@/lib/dashboard-utils";

const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30";

export default function ReportsPage() {
  const { t } = useLocale();
  const r = t.dashboard.reports;
  const today = new Date().toISOString().slice(0, 10);

  const [tab, setTab] = useState<ReportTab>("transactions");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("all");
  const [transferType, setTransferType] = useState("all");
  const [currency, setCurrency] = useState("all");
  const [employeeStatus, setEmployeeStatus] = useState("all");
  const [employeeRole, setEmployeeRole] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [dailySummary, setDailySummary] = useState<ReportStats | null>(null);
  const [generated, setGenerated] = useState(false);
  const [chartView, setChartView] = useState<"amounts" | "status">("amounts");

  const tabs: { key: ReportTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "transactions", label: r.tabs.transactions, icon: FileText },
    { key: "branches", label: r.tabs.branches, icon: Building2 },
    { key: "employees", label: r.tabs.employees, icon: Users },
    { key: "daily", label: r.tabs.daily, icon: Calendar },
    { key: "charts", label: r.tabs.charts, icon: BarChart3 },
  ];

  const statusOptions = [
    { value: "all", label: r.filters.all },
    { value: "processing", label: t.dashboard.status.processing },
    { value: "completed", label: t.dashboard.status.completed },
    { value: "pending", label: t.dashboard.status.pending },
    { value: "cancelled", label: t.dashboard.status.cancelled },
    { value: "rejected", label: t.dashboard.status.rejected },
  ];

  const buildParams = useCallback(() => {
    const params: Record<string, string | number | undefined> = {
      per_page: 100,
    };
    const from = tab === "daily" && !fromDate ? today : fromDate || undefined;
    const to = tab === "daily" && !toDate ? today : toDate || undefined;
    if (from) params.from_date = from;
    if (to) params.to_date = to;
    if (status !== "all") params.status = status;
    if (transferType !== "all") params.type = transferType;
    if (currency !== "all") params.currency = currency;
    if (employeeStatus !== "all") params.employee_status = employeeStatus;
    if (employeeRole !== "all") params.employee_role = employeeRole;
    if (search.trim()) params.search = search.trim();
    return params;
  }, [tab, fromDate, toDate, today, status, transferType, currency, employeeStatus, employeeRole, search]);

  const handleGenerate = async () => {
    setLoading(true);
    setGenerated(false);
    try {
      const params = buildParams();

      if (tab === "transactions" || tab === "charts") {
        const res = await reportsApi.transactions(params);
        setRows(res.data.items);
        setStats(res.data.stats);
        setCharts(res.data.charts);
        setDailySummary(null);
      } else if (tab === "branches") {
        const res = await reportsApi.branches(params);
        setRows(res.data.branch_stats);
        setStats(res.data.stats);
        setCharts(null);
        setDailySummary(null);
      } else if (tab === "employees") {
        const res = await reportsApi.employees(params);
        setRows(res.data.items);
        setStats(res.data.stats);
        setCharts(null);
        setDailySummary(null);
      } else if (tab === "daily") {
        const res = await reportsApi.daily(params);
        setDailySummary(res.data.summary);
        setRows(res.data.items || []);
        setStats(res.data.summary);
        setCharts(null);
      }
      setGenerated(true);
    } catch {
      toast.error(r.errors.load);
      setRows([]);
      setStats(null);
      setCharts(null);
      setDailySummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (next: ReportTab) => {
    setTab(next);
    setGenerated(false);
    setRows([]);
    setStats(null);
    setCharts(null);
    setDailySummary(null);
    if (next === "daily") {
      setFromDate(today);
      setToDate(today);
    }
  };

  const exportCsv = () => {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const header = keys.join(",");
    const body = rows
      .map((row) => keys.map((k) => JSON.stringify(row[k] ?? "")).join(","))
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${tab}-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const roleLabel = (role: string) =>
    t.dashboard.employees.roles[role as keyof typeof t.dashboard.employees.roles] ?? role;

  const columns = useMemo(() => {
    if (tab === "branches") {
      return [
        { key: "branch_id", label: r.columns.branchId },
        { key: "name", label: r.columns.branchName },
        { key: "governorate", label: r.columns.governorate },
        { key: "transaction_count", label: r.columns.transactionCount },
        { key: "outgoing_count", label: r.columns.outgoingCount },
        { key: "incoming_count", label: r.columns.incomingCount },
        { key: "total_amount", label: r.columns.totalAmount },
        { key: "total_tax", label: r.columns.totalTax },
        { key: "employee_count", label: r.columns.employeeCount },
      ];
    }
    if (tab === "employees") {
      return [
        { key: "id", label: r.columns.userId },
        { key: "username", label: r.columns.username },
        { key: "role", label: r.columns.role },
        { key: "branch_name", label: r.columns.branchName },
        { key: "created_at", label: r.columns.createdAt },
        { key: "is_active", label: r.columns.active },
      ];
    }
    return [
      { key: "id", label: r.columns.id },
      { key: "sender", label: r.columns.sender },
      { key: "receiver", label: r.columns.receiver },
      { key: "amount", label: r.columns.amount },
      { key: "currency", label: r.columns.currency },
      { key: "date", label: r.columns.date },
      { key: "status", label: r.columns.status },
      { key: "sending_branch_name", label: r.columns.sendingBranch },
      { key: "destination_branch_name", label: r.columns.receivingBranch },
      { key: "tax_amount", label: r.columns.tax },
    ];
  }, [tab, r.columns]);

  const renderCell = (key: string, value: unknown) => {
    if (key === "status" && typeof value === "string") {
      return (
        <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-semibold ${getStatusBadgeClass(value)}`}>
          {translateActivityStatus(value, t)}
        </span>
      );
    }
    if (key === "role" && typeof value === "string") return roleLabel(value);
    if (key === "is_active") return value ? r.yes : r.no;
    if (typeof value === "number") return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (typeof value === "string" && value.includes("T")) {
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return value;
      }
    }
    return String(value ?? "—");
  };

  const chartStatusData =
    charts?.status_counts.map((s) => ({
      name: translateActivityStatus(s.status, t),
      value: s.count,
    })) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{r.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{r.subtitle}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => handleTabChange(key)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${tab === key
                ? "bg-primary-600 text-white shadow-lg shadow-primary-500/25"
                : "bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-primary-500/40"}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 p-5 md:p-6 shadow-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGenerate();
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={r.filters.fromDate}>
                  <input type="date" className={inputClass} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </Field>
                <Field label={r.filters.toDate}>
                  <input type="date" className={inputClass} value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </Field>
              </div>

              {(tab === "transactions" || tab === "charts") && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label={r.filters.status}>
                    <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
                      {statusOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label={r.filters.transferType}>
                    <select className={inputClass} value={transferType} onChange={(e) => setTransferType(e.target.value)}>
                      <option value="all">{r.filters.all}</option>
                      <option value="outgoing">{r.transferTypes.outgoing}</option>
                      <option value="incoming">{r.transferTypes.incoming}</option>
                    </select>
                  </Field>
                  <Field label={r.filters.currency}>
                    <select className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                      <option value="all">{r.filters.all}</option>
                      <option value="SYP">SYP</option>
                      <option value="USD">USD</option>
                    </select>
                  </Field>
                </div>
              )}

              {tab === "employees" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label={r.filters.employeeStatus}>
                    <select className={inputClass} value={employeeStatus} onChange={(e) => setEmployeeStatus(e.target.value)}>
                      <option value="all">{r.filters.all}</option>
                      <option value="active">{r.employeeStatus.active}</option>
                      <option value="inactive">{r.employeeStatus.inactive}</option>
                    </select>
                  </Field>
                  <Field label={r.filters.employeeRole}>
                    <select className={inputClass} value={employeeRole} onChange={(e) => setEmployeeRole(e.target.value)}>
                      <option value="all">{r.filters.all}</option>
                      <option value="employee">{t.dashboard.employees.roles.employee}</option>
                      <option value="branch_manager">{t.dashboard.employees.roles.branch_manager}</option>
                    </select>
                  </Field>
                  <Field label={r.filters.search}>
                    <input className={inputClass} value={search} onChange={(e) => setSearch(e.target.value)} />
                  </Field>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  {loading ? r.actions.loading : r.actions.generate}
                </button>
              </div>
            </form>
          </div>

          {generated && stats && tab !== "charts" && (
            <StatsGrid tab={tab} stats={stats} dailySummary={dailySummary} labels={r.stats} />
          )}

          {generated && tab === "daily" && dailySummary && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{r.daily.title}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MiniStat label={r.stats.totalCount} value={dailySummary.total_count ?? 0} />
                <MiniStat label={r.stats.totalAmount} value={(dailySummary.total_amount ?? 0).toLocaleString()} />
                <MiniStat label={r.stats.totalTax} value={(dailySummary.total_tax ?? 0).toLocaleString()} />
                <MiniStat label={r.stats.completed} value={dailySummary.completed_count ?? 0} />
                <MiniStat label={r.stats.processing} value={dailySummary.processing_count ?? 0} />
                <MiniStat label={r.stats.pending} value={dailySummary.pending_count ?? 0} />
                <MiniStat label={r.stats.cancelled} value={dailySummary.cancelled_count ?? 0} />
                <MiniStat label={r.stats.rejected} value={dailySummary.rejected_count ?? 0} />
              </div>
            </div>
          )}

          {generated && tab === "charts" && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 p-6 space-y-6">
              <div className="flex flex-wrap gap-2">
                <ChartTab active={chartView === "amounts"} onClick={() => setChartView("amounts")} icon={BarChart3} label={r.charts.amounts} />
                <ChartTab active={chartView === "status"} onClick={() => setChartView("status")} icon={PieChartIcon} label={r.charts.byStatus} />
              </div>
              <div className="min-h-[320px]">
                {chartView === "amounts" && charts?.daily_amounts?.length ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={charts.daily_amounts}>
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="amount" fill="#6366f1" name={r.stats.volume} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : chartView === "status" && chartStatusData.length ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie data={chartStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label>
                        {chartStatusData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-500">{r.charts.noData}</div>
                )}
              </div>
            </div>
          )}

          {generated && tab !== "charts" && tab !== "daily" && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-white/10">
                <span className="text-sm text-slate-500">{rows.length} {r.stats.totalCount.toLowerCase()}</span>
                {rows.length > 0 && (
                  <button
                    type="button"
                    onClick={exportCsv}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500"
                  >
                    <Download className="w-4 h-4" />
                    {r.actions.export}
                  </button>
                )}
              </div>
              {rows.length === 0 ? (
                <div className="p-12 text-center text-slate-500">{r.empty}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10">
                        {columns.map((col) => (
                          <th key={col.key} className="px-4 py-3 text-start font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
                          {columns.map((col) => (
                            <td key={col.key} className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {renderCell(col.key, row[col.key])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <ReportsGuidePanel />
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

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{value}</p>
    </div>
  );
}

function ChartTab({
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

function StatsGrid({
  tab,
  stats,
  dailySummary,
  labels,
}: {
  tab: ReportTab;
  stats: ReportStats;
  dailySummary: ReportStats | null;
  labels: {
    totalCount: string;
    totalAmount: string;
    totalTax: string;
    completed: string;
    processing: string;
    branches: string;
    employees: string;
    activeEmployees: string;
    inactiveEmployees: string;
  };
}) {
  const s = dailySummary ?? stats;
  const items =
    tab === "branches"
      ? [
          { label: labels.branches, value: stats.branch_count ?? 0 },
          { label: labels.totalCount, value: stats.total_count ?? stats.transaction_count ?? 0 },
          { label: labels.totalAmount, value: (stats.total_amount ?? 0).toLocaleString() },
          { label: labels.totalTax, value: (stats.total_tax ?? 0).toLocaleString() },
        ]
      : tab === "employees"
        ? [
            { label: labels.employees, value: stats.total_count ?? 0 },
            { label: labels.activeEmployees, value: stats.active_count ?? 0 },
            { label: labels.inactiveEmployees, value: stats.inactive_count ?? 0 },
          ]
        : [
            { label: labels.totalCount, value: s.total_count ?? 0 },
            { label: labels.totalAmount, value: (s.total_amount ?? 0).toLocaleString() },
            { label: labels.completed, value: s.completed_count ?? 0 },
            { label: labels.processing, value: s.processing_count ?? 0 },
          ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item) => (
        <MiniStat key={item.label} label={item.label} value={item.value} />
      ))}
    </div>
  );
}
