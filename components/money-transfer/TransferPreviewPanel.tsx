"use client";

import { AlertCircle, CheckCircle2, Loader2, Wallet } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";

export interface TransferPreviewData {
  tax_rate: number;
  tax_amount: number;
  branch_profit: number;
  available_balance: number;
  currency: string;
  sufficient_balance: boolean;
  valid: boolean;
  errors: string[];
  sending_branch_name?: string | null;
  destination_branch_name?: string | null;
}

interface TransferPreviewPanelProps {
  preview: TransferPreviewData | null;
  loading: boolean;
  amount: string;
  currency: string;
}

export default function TransferPreviewPanel({
  preview,
  loading,
  amount,
  currency,
}: TransferPreviewPanelProps) {
  const { t } = useLocale();
  const p = t.dashboard.moneyTransfer.preview;

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-5 flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
        <span className="text-sm text-slate-500">{t.dashboard.moneyTransfer.form.loadingBalance}</span>
      </div>
    );
  }

  if (!preview || !amount) return null;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Wallet className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        <h3 className="font-bold text-slate-900 dark:text-white">{p.title}</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <PreviewStat label={p.taxRate} value={`${preview.tax_rate}%`} />
        <PreviewStat label={p.taxAmount} value={formatNum(preview.tax_amount, preview.currency)} />
        <PreviewStat label={p.branchProfit} value={formatNum(preview.branch_profit, preview.currency)} />
        <PreviewStat
          label={t.dashboard.moneyTransfer.form.balance}
          value={formatNum(preview.available_balance, preview.currency)}
        />
      </div>

      {preview.errors.length > 0 && (
        <ul className="space-y-1">
          {preview.errors.map((err, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {err}
            </li>
          ))}
        </ul>
      )}

      {preview.valid && preview.sufficient_balance && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="w-4 h-4" />
          {p.ready}
        </div>
      )}

      {!preview.sufficient_balance && (
        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 font-medium">
          <AlertCircle className="w-4 h-4" />
          {p.insufficient}
        </div>
      )}
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-3">
      <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{value}</p>
    </div>
  );
}

function formatNum(n: number, currency: string) {
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`;
}
