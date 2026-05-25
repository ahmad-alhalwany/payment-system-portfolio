"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/app/api/axios";
import BranchModal from "./BranchModal";
import { Loader2 } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";

interface BranchFundHistoryModalProps {
  open: boolean;
  onClose: () => void;
  branch: { id: string; name: string };
}

interface FundHistoryRow {
  date: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
}

export default function BranchFundHistoryModal({ open, onClose, branch }: BranchFundHistoryModalProps) {
  const { t, locale } = useLocale();
  const h = t.dashboard.branches.history;

  const [history, setHistory] = useState<FundHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !branch?.id) return;
    const fetchHistory = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axiosInstance.get(`/branches/${branch.id}/funds-history`);
        setHistory(Array.isArray(response.data) ? response.data : []);
      } catch {
        setError(h.error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [open, branch?.id, h.error]);

  const typeLabel = (type: string) => {
    if (type === "allocation" || type === "deposit") return h.types.add;
    if (type === "deduction") return h.types.deduct;
    return type;
  };

  if (!open) return null;

  return (
    <BranchModal open={open} onClose={onClose} title={`${h.title} — ${branch?.name || ""}`} wide>
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center py-10 gap-2 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>{h.loading}</span>
          </div>
        ) : error ? (
          <p className="text-center text-red-500 py-6">{error}</p>
        ) : history.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400 py-10">{h.empty}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                  {[h.columns.date, h.columns.type, h.columns.amount, h.columns.currency, h.columns.description].map((col) => (
                    <th key={col} className="py-3 px-4 text-start font-semibold whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {history.map((item, idx) => (
                  <tr key={`${item.date}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300">{item.date}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium
                        ${item.type === "deduction" ? "bg-red-500/15 text-red-600 dark:text-red-400" : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"}`}>
                        {typeLabel(item.type)}
                      </span>
                    </td>
                    <td className="py-3 px-4 tabular-nums font-medium text-slate-900 dark:text-white">
                      {Math.abs(item.amount).toLocaleString(locale === "ar" ? "ar-SY" : "en-US")}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{item.currency}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">{item.description || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-200 dark:hover:bg-white/15">
            {t.dashboard.branches.modals.cancel}
          </button>
        </div>
      </div>
    </BranchModal>
  );
}
