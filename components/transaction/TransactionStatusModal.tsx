"use client";

import { useEffect, useState } from "react";
import BranchModal from "../branch/BranchModal";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { Transaction } from "@/app/api/transactions";

interface TransactionStatusModalProps {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  onSubmit: (newStatus: string) => void;
  loading?: boolean;
}

const STATUS_VALUES = ["processing", "completed", "cancelled", "rejected", "pending"] as const;

export default function TransactionStatusModal({ open, onClose, transaction, onSubmit, loading }: TransactionStatusModalProps) {
  const { t } = useLocale();
  const m = t.dashboard.transactions.modals;
  const [status, setStatus] = useState("processing");

  useEffect(() => {
    if (open && transaction) {
      setStatus(transaction.status || "processing");
    }
  }, [open, transaction?.status, transaction?.id]);

  if (!open || !transaction) return null;

  return (
    <BranchModal open={open} onClose={onClose} title={`${m.statusTitle} — ${transaction.short_id || transaction.id.slice(0, 8)}`}>
      <div className="space-y-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">{m.currentStatus}</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50"
            disabled={loading}
          >
            {STATUS_VALUES.map((value) => (
              <option key={value} value={value}>
                {t.dashboard.status[value]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5">
            {m.cancel}
          </button>
          <button type="button" onClick={() => onSubmit(status)} disabled={loading} className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 disabled:opacity-50">
            {loading ? "..." : m.save}
          </button>
        </div>
      </div>
    </BranchModal>
  );
}
