import axiosInstance from "./axios";

export interface InventorySummary {
  tax_collected: number;
  transactions_count: number;
  total_profit: number;
  avg_tax_rate: number;
  total_amount: number;
  total_benefited_amount: number;
}

export interface InventoryBranchRow {
  branch_id: number;
  branch_name: string;
  tax_rate: number;
  transaction_count: number;
  total_amount: number;
  benefited_amount: number;
  tax_amount: number;
  profit: number;
  currency: string;
}

export interface InventoryTransactionRow {
  id: string;
  date: string;
  amount: number;
  benefited_amount: number;
  tax_rate: number;
  tax_amount: number;
  profit: number;
  currency: string;
  sending_branch_name: string;
  destination_branch_name: string;
  status: string;
}

export interface InventoryResponse {
  summary: InventorySummary;
  by_branch: InventoryBranchRow[];
  transactions: InventoryTransactionRow[];
  charts: { by_branch: { branch_name: string; tax_amount: number; profit: number }[] };
}

export interface InventoryFilters {
  from_date?: string;
  to_date?: string;
  branch_id?: number;
  currency?: string;
  status?: string;
}

export const inventoryApi = {
  summary: (params: InventoryFilters) =>
    axiosInstance.get<InventoryResponse>("/inventory/summary/", { params }),

  exportCsv: (params: InventoryFilters) =>
    axiosInstance.get("/inventory/export/csv/", { params, responseType: "blob" }),
};
