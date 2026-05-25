import axiosInstance from "./axios";

export interface BranchEmployee {
  id: number;
  username: string;
  role: string;
  branch_id: number | null;
  branch_name: string | null;
  created_at: string | null;
  is_active: boolean;
}

export interface BranchEmployeesResponse {
  branch: {
    id: number;
    name: string;
    location: string;
    governorate: string;
  };
  stats: {
    total: number;
    active: number;
    inactive: number;
  };
  items: BranchEmployee[];
  manager: { username: string; role: string };
}

export const branchEmployeesApi = {
  list: (params?: { search?: string; status?: "active" | "inactive" }) =>
    axiosInstance.get<BranchEmployeesResponse>("/branch-manager/employees/", { params }),
};
