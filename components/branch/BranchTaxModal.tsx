"use client";

import { useEffect, useState } from "react";
import BranchModal from "./BranchModal";
import { useLocale } from "@/components/providers/LocaleProvider";

interface BranchTaxModalProps {
  open: boolean;
  onClose: () => void;
  branch: { name?: string; tax_rate?: number };
  onSubmit: (taxRate: number) => void;
}

export default function BranchTaxModal({ open, onClose, branch, onSubmit }: BranchTaxModalProps) {
  const { t } = useLocale();
  const tx = t.dashboard.branches.tax;

  const [taxRate, setTaxRate] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTaxRate(branch?.tax_rate ?? 0);
      setError("");
    }
  }, [open, branch?.tax_rate]);

  const handleSave = () => {
    if (taxRate < 0 || taxRate > 100) {
      setError(tx.invalid);
      return;
    }
    setError("");
    onSubmit(taxRate);
  };

  return (
    <BranchModal open={open} onClose={onClose} title={`${tx.title}${branch?.name ? ` — ${branch.name}` : ""}`}>
      <div className="space-y-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">{tx.rate}</label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5">
            {t.dashboard.branches.modals.cancel}
          </button>
          <button type="button" onClick={handleSave} className="px-4 py-2 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-500">
            {tx.save}
          </button>
        </div>
      </div>
    </BranchModal>
  );
}
