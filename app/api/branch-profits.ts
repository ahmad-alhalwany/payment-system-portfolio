import axiosInstance from "./axios";

export interface BranchProfitItem {
  id: string;
  date: string | null;
  benefited_amount: number;
  tax_rate: number;
  tax_amount: number;
  benefited_profit: number;
  tax_profit: number;
  profit: number;
  currency: string;
  status: string;
}

export interface BranchProfitsResponse {
  branch: { id: number; name: string; location: string; governorate: string };
  stats: {
    total_profits_syp: number;
    total_profits_usd: number;
    total_transactions: number;
    avg_tax_rate: number;
  };
  items: BranchProfitItem[];
  chart: { currency: string; profit: number }[];
}

export const branchProfitsApi = {
  list: (params?: {
    start_date?: string;
    end_date?: string;
    currency?: string;
    search?: string;
  }) => axiosInstance.get<BranchProfitsResponse>("/branch-manager/profits/", { params }),
};
