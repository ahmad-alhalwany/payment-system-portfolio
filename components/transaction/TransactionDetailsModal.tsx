"use client";

import BranchModal from "../branch/BranchModal";
import { useLocale } from "@/components/providers/LocaleProvider";
import { getStatusBadgeClass, translateActivityStatus } from "@/lib/dashboard-utils";
import type { Transaction } from "@/app/api/transactions";

interface TransactionDetailsModalProps {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
}

export default function TransactionDetailsModal({ open, onClose, transaction }: TransactionDetailsModalProps) {
  const { t } = useLocale();
  const m = t.dashboard.transactions.modals;

  if (!open || !transaction) return null;

  const branchLabel = (name?: string | null) => name || t.dashboard.transactions.mainBranch;

  return (
    <BranchModal open={open} onClose={onClose} title={`${m.detailsTitle} — ${transaction.short_id || transaction.id.slice(0, 8)}`} wide>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <Detail label={m.sender} value={transaction.sender} />
        <Detail label={m.receiver} value={transaction.receiver} />
        <Detail label={m.senderMobile} value={transaction.sender_mobile || t.dashboard.transactions.notAssigned} />
        <Detail label={m.receiverMobile} value={transaction.receiver_mobile || t.dashboard.transactions.notAssigned} />
        <Detail label={m.amount} value={`${transaction.amount?.toLocaleString()} ${transaction.currency}`} />
        <Detail label={m.date} value={transaction.date || t.dashboard.transactions.notAssigned} />
        <Detail label={m.branches} value={`${branchLabel(transaction.sending_branch_name)} → ${branchLabel(transaction.destination_branch_name)}`} />
        <Detail label={m.employee} value={transaction.employee_name || t.dashboard.transactions.notAssigned} />
        <div className="md:col-span-2">
          <p className="text-xs text-slate-500 mb-1">{m.currentStatus}</p>
          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(transaction.status)}`}>
            {translateActivityStatus(transaction.status, t)}
          </span>
        </div>
        {transaction.message && (
          <div className="md:col-span-2">
            <p className="text-xs text-slate-500 mb-1">{m.message}</p>
            <p className="text-slate-700 dark:text-slate-300">{transaction.message}</p>
          </div>
        )}
      </div>
      <div className="flex justify-end mt-6">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 font-medium">
          {m.close}
        </button>
      </div>
    </BranchModal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3 border border-slate-200 dark:border-white/10">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="font-medium text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
