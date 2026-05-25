import axiosInstance from "./axios";

export interface ReportStats {
  total_count?: number;
  total_amount?: number;
  total_tax?: number;
  completed_count?: number;
  processing_count?: number;
  pending_count?: number;
  cancelled_count?: number;
  rejected_count?: number;
  branch_count?: number;
  employee_count?: number;
  active_count?: number;
  inactive_count?: number;
}

export interface ChartData {
  daily_amounts: { date: string; amount: number }[];
  status_counts: { status: string; count: number }[];
}

export interface TransactionsReportResponse {
  items: Record<string, unknown>[];
  total: number;
  page: number;
  total_pages: number;
  stats: ReportStats;
  charts: ChartData;
}

export interface BranchesReportResponse {
  branch_stats: Record<string, unknown>[];
  stats: ReportStats;
}

export interface EmployeesReportResponse {
  items: Record<string, unknown>[];
  total: number;
  page: number;
  total_pages: number;
  stats: ReportStats;
}

export interface DailyReportResponse {
  summary: ReportStats;
  items: Record<string, unknown>[];
}

export type ReportTab = "transactions" | "branches" | "employees" | "daily" | "charts";

export interface ReportFilters {
  from_date?: string;
  to_date?: string;
  status?: string;
  type?: string;
  currency?: string;
  employee_status?: string;
  employee_role?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export const reportsApi = {
  transactions: (params: ReportFilters) =>
    axiosInstance.get<TransactionsReportResponse>("/reports/transactions/", { params }),

  branches: (params: Pick<ReportFilters, "from_date" | "to_date">) =>
    axiosInstance.get<BranchesReportResponse>("/reports/branches/", { params }),

  employees: (params: ReportFilters) =>
    axiosInstance.get<EmployeesReportResponse>("/reports/employees/", { params }),

  daily: (params: Pick<ReportFilters, "from_date" | "to_date">) =>
    axiosInstance.get<DailyReportResponse>("/reports/daily/", { params }),
};
