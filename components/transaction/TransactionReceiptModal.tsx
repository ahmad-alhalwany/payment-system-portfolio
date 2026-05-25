"use client";

import { useRef } from "react";
import { Printer, X } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { translateActivityStatus } from "@/lib/dashboard-utils";
import type { Transaction } from "@/app/api/transactions";

interface TransactionReceiptModalProps {
  transfer: Transaction;
  onClose: () => void;
}

export default function TransactionReceiptModal({ transfer, onClose }: TransactionReceiptModalProps) {
  const { t } = useLocale();
  const m = t.dashboard.transactions.modals;
  const tx = t.dashboard.transactions;
  const receiptRef = useRef<HTMLDivElement>(null);

  const branchLabel = (name?: string | null) => name || tx.mainBranch;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl print:max-w-none print:max-h-none print:shadow-none print:border-0 print:rounded-none">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 print:hidden">
          <h3 className="font-bold text-slate-900 dark:text-white">{m.receiptTitle}</h3>
          <div className="flex gap-2">
            <button type="button" onClick={handlePrint} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500">
              <Printer className="w-4 h-4" />
              {m.print}
            </button>
            <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-white/5">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div ref={receiptRef} id="receipt" className="p-8 print:p-6 text-slate-900">
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-amber-500/30">
            <div className="flex items-center gap-3">
              <img src="/payment-system.jpg" alt="" width={48} height={48} className="rounded-full border-2 border-amber-500/40" />
              <div>
                <p className="font-black text-lg text-amber-700">{t.site.name}</p>
                <p className="text-xs text-slate-500">{m.receiptTitle}</p>
              </div>
            </div>
            <div className="text-end">
              <p className="text-xs text-slate-500">{tx.columns.id}</p>
              <p className="font-mono text-sm font-bold break-all max-w-[180px]">{transfer.id}</p>
            </div>
          </div>

          <div className="text-center mb-6 py-4 rounded-xl bg-amber-50 print:bg-amber-50">
            <p className="text-3xl font-black text-emerald-700 tabular-nums">
              {transfer.amount?.toLocaleString()} {transfer.currency}
            </p>
            <p className="text-sm text-slate-500 mt-1">{translateActivityStatus(transfer.status, t)}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <ReceiptRow label={m.sender} value={transfer.sender} />
            <ReceiptRow label={m.receiver} value={transfer.receiver} />
            <ReceiptRow label={m.senderMobile} value={transfer.sender_mobile || tx.notAssigned} />
            <ReceiptRow label={m.receiverMobile} value={transfer.receiver_mobile || tx.notAssigned} />
            <ReceiptRow label={tx.columns.sendingBranch} value={branchLabel(transfer.sending_branch_name)} />
            <ReceiptRow label={tx.columns.receivingBranch} value={branchLabel(transfer.destination_branch_name)} />
            <ReceiptRow label={m.date} value={transfer.date || tx.notAssigned} />
            <ReceiptRow label={m.employee} value={transfer.employee_name || tx.notAssigned} />
          </div>

          {transfer.message && (
            <div className="text-sm border-t border-slate-200 pt-4">
              <p className="text-xs text-slate-500 mb-1">{m.message}</p>
              <p>{transfer.message}</p>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #receipt, #receipt * { visibility: visible !important; }
          #receipt {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
