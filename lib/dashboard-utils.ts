import type { Translations } from "@/lib/i18n";

const STATUS_MAP: Record<string, keyof Translations["dashboard"]["status"]> = {
  completed: "completed",
  processing: "processing",
  pending: "pending",
  cancelled: "cancelled",
  rejected: "rejected",
  success: "success",
  مكتمل: "completed",
  "قيد المعالجة": "processing",
  معلق: "pending",
  ملغى: "cancelled",
  مرفوض: "rejected",
  ناجح: "success",
};

export function translateActivityStatus(status: string, t: Translations): string {
  const key = STATUS_MAP[status] ?? STATUS_MAP[status.toLowerCase()];
  if (key) return t.dashboard.status[key];
  return status;
}

export function getStatusBadgeClass(status: string): string {
  const normalized = status.toLowerCase();
  if (["completed", "success", "مكتمل", "ناجح"].includes(status) || normalized === "completed") {
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/20";
  }
  if (["cancelled", "rejected", "ملغى", "مرفوض"].includes(status)) {
    return "bg-red-500/15 text-red-700 dark:text-red-400 ring-1 ring-red-500/20";
  }
  return "bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/20";
}
