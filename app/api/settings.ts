import axiosInstance from "./axios";

export interface SystemSettings {
  systemName: string;
  companyName: string;
  adminEmail: string;
  defaultCurrency: "SYP" | "USD" | "EUR";
  mainPhone: string;
  receiptFooter: string;
  transferMinAmount: number;
  transferMaxAmount: number;
  requireReceiverPhone: boolean;
  requireCompletedForTax: boolean;
  defaultLocale: "ar" | "en";
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export const settingsApi = {
  getSystem: () => axiosInstance.get<SystemSettings>("/settings/system/"),
  updateSystem: (data: SystemSettings) => axiosInstance.put<SystemSettings>("/settings/system/", data),
  changePassword: (old_password: string, new_password: string) =>
    axiosInstance.post("/change-password/", { old_password, new_password }),
  backup: () => axiosInstance.get("/backup/", { responseType: "blob", params: { format: "json" } }),
};
