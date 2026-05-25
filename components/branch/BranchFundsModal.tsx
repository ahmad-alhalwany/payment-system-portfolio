"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import BranchModal from "./BranchModal";
import axiosInstance from "@/app/api/axios";
import { useLocale } from "@/components/providers/LocaleProvider";

interface BranchFundsModalProps {
  open: boolean;
  onClose: () => void;
  branch: {
    id: number;
    name: string;
    allocated_amount_syp?: number;
    allocated_amount_usd?: number;
  };
  onSuccess: () => void;
}

export default function BranchFundsModal({ open, onClose, branch, onSuccess }: BranchFundsModalProps) {
  const { t } = useLocale();
  const f = t.dashboard.branches.funds;

  const [operation, setOperation] = useState<"add" | "deduct">("add");
  const [currency, setCurrency] = useState<"SYP" | "USD">("SYP");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const syp = branch.allocated_amount_syp ?? 0;
  const usd = branch.allocated_amount_usd ?? 0;

  useEffect(() => {
    if (open) {
      setAmount("");
      setDescription("");
      setOperation("add");
      setCurrency("SYP");
    }
  }, [open, branch.id]);

  const handleSubmit = async () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error(f.invalidAmount);
      return;
    }
    if (operation === "deduct") {
      const current = currency === "SYP" ? syp : usd;
      if (value > current) {
        toast.error(f.insufficient);
        return;
      }
    }
    setLoading(true);
    try {
      await axiosInstance.post(`/branches/${branch.id}/funds/`, {
        amount: value,
        currency,
        operation,
        description: description || undefined,
      });
      toast.success(t.dashboard.branches.success.funds);
      onSuccess();
      onClose();
    } catch {
      toast.error(t.dashboard.branches.errors.funds);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (resetCurrency: "SYP" | "USD" | null) => {
    setLoading(true);
    try {
      const params = resetCurrency ? { currency: resetCurrency } : undefined;
      await axiosInstance.delete(`/branches/${branch.id}/allocations/`, { params });
      toast.success(t.dashboard.branches.success.funds);
      onSuccess();
    } catch {
      toast.error(t.dashboard.branches.errors.funds);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <BranchModal open={open} onClose={onClose} title={`${f.title} — ${branch.name}`}>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-4 border border-slate-200 dark:border-white/10">
            <p className="text-xs text-slate-500 mb-1">{f.currentSyp}</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{syp.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-4 border border-slate-200 dark:border-white/10">
            <p className="text-xs text-slate-500 mb-1">{f.currentUsd}</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">${usd.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={operation === "add"} onChange={() => setOperation("add")} />
            {f.add}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={operation === "deduct"} onChange={() => setOperation("deduct")} />
            {f.deduct}
          </label>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={currency === "SYP"} onChange={() => setCurrency("SYP")} />
            SYP
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={currency === "USD"} onChange={() => setCurrency("USD")} />
            USD
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{f.amount}</label>
          <input
            type="number"
            min={0.01}
            step={0.01}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{f.description}</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50"
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
          <button type="button" disabled={loading || syp === 0} onClick={() => handleReset("SYP")} className="px-3 py-1.5 text-xs rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 disabled:opacity-40">
            {f.resetSyp}
          </button>
          <button type="button" disabled={loading || usd === 0} onClick={() => handleReset("USD")} className="px-3 py-1.5 text-xs rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 disabled:opacity-40">
            {f.resetUsd}
          </button>
          <button type="button" disabled={loading || (syp === 0 && usd === 0)} onClick={() => handleReset(null)} className="px-3 py-1.5 text-xs rounded-lg bg-red-500/15 text-red-700 dark:text-red-400 disabled:opacity-40">
            {f.resetAll}
          </button>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5">
            {t.dashboard.branches.modals.cancel}
          </button>
          <button type="button" disabled={loading} onClick={handleSubmit} className="px-4 py-2 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-500 disabled:opacity-50">
            {loading ? "..." : f.save}
          </button>
        </div>
      </div>
    </BranchModal>
  );
}
