import axiosInstance from "./axios";

export interface BranchManagerDashboard {
  branch: {
    id: number;
    name: string;
    location: string;
    governorate: string;
    phone_number?: string;
    tax_rate: number;
    allocated_amount_syp: number;
    allocated_amount_usd: number;
  };
  stats: {
    employees: number;
    outgoing_count: number;
    incoming_count: number;
    completed_outgoing: number;
    processing_outgoing: number;
    completed_incoming: number;
    today_outgoing: number;
    today_incoming: number;
    total_profit: number;
    total_tax: number;
  };
  recent_transfers: {
    id: string;
    sender: string;
    receiver: string;
    amount: number;
    currency: string;
    status: string;
    date: string | null;
    direction: "outgoing" | "incoming";
  }[];
  manager: { username: string; role: string };
}

export const branchManagerApi = {
  dashboard: () => axiosInstance.get<BranchManagerDashboard>("/branch-manager/dashboard/"),
};
