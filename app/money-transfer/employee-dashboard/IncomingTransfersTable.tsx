"use client";

import { useMemo, useState } from "react";
import { Eye, Printer, RefreshCw, CheckCircle, ArrowDownLeft } from "lucide-react";
import TransferDetailsModal from "./TransferDetailsModal";
import ConfirmReceiptModal from "./ConfirmReceiptModal";
import TransactionReceiptModal from "@/components/transaction/TransactionReceiptModal";
import TransactionStatusModal from "@/components/transaction/TransactionStatusModal";
import type { Transaction } from "@/app/api/transactions";
import { useLocale } from "@/components/providers/LocaleProvider";
import { getStatusBadgeClass, translateActivityStatus } from "@/lib/dashboard-utils";

interface IncomingTransfersTableProps {
  transfers: Transaction[];
  onStatusChange: (id: string, status: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading: boolean;
  emptyHint?: string;
}

export default function IncomingTransfersTable({
  transfers,
  onStatusChange,
  currentPage,
  totalPages,
  onPageChange,
  loading,
  emptyHint,
}: IncomingTransfersTableProps) {
  const { t } = useLocale();
  const tx = t.dashboard.transactions;
  const mt = t.dashboard.moneyTransfer;

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return transfers;
    const q = search.toLowerCase();
    return transfers.filter(
      (tr) =>
        tr.sender?.toLowerCase().includes(q) ||
        tr.receiver?.toLowerCase().includes(q) ||
        tr.id.toLowerCase().includes(q)
    );
  }, [transfers, search]);

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder={mt.filters.quickSearch}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 text-sm"
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-white/5 text-slate-500">
              {[tx.columns.id, tx.columns.date, tx.columns.sender, tx.columns.receiver, tx.columns.amount, tx.columns.status, tx.columns.actions].map((col) => (
                <th key={col} className="py-3 px-3 text-start font-semibold whitespace-nowrap">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <ArrowDownLeft className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-slate-500 font-medium">{tx.empty}</p>
                  {emptyHint && <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">{emptyHint}</p>}
                </td>
              </tr>
            ) : (
              filtered.map((tr) => (
                <tr key={tr.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <td className="py-3 px-3 font-mono text-xs text-primary-600" title={tr.id}>{tr.short_id || tr.id.slice(0, 8)}</td>
                  <td className="py-3 px-3 whitespace-nowrap text-slate-600">{tr.date || "—"}</td>
                  <td className="py-3 px-3 font-medium">{tr.sender}</td>
                  <td className="py-3 px-3">{tr.receiver}</td>
                  <td className="py-3 px-3 tabular-nums font-semibold">{tr.amount?.toLocaleString()} {tr.currency}</td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(tr.status)}`}>
                      {translateActivityStatus(tr.status, t)}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1">
                      <IconBtn icon={Eye} title={tx.actions.details} onClick={() => { setSelected(tr); setShowDetails(true); }} />
                      <IconBtn icon={Printer} title={tx.actions.print} onClick={() => { setSelected(tr); setShowPrint(true); }} />
                      {tr.status !== "completed" && (
                        <IconBtn icon={CheckCircle} title={tx.actions.confirmReceipt} onClick={() => { setSelected(tr); setShowConfirm(true); }} />
                      )}
                      <IconBtn icon={RefreshCw} title={tx.actions.status} onClick={() => { setSelected(tr); setShowStatus(true); }} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-500">{tx.page} {currentPage} {tx.of} {totalPages}</span>
          <div className="flex gap-2">
            <button type="button" disabled={currentPage <= 1 || loading} onClick={() => onPageChange(currentPage - 1)} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-sm disabled:opacity-40">{tx.prev}</button>
            <button type="button" disabled={currentPage >= totalPages || loading} onClick={() => onPageChange(currentPage + 1)} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-sm disabled:opacity-40">{tx.next}</button>
          </div>
        </div>
      )}

      <TransferDetailsModal open={showDetails} onClose={() => setShowDetails(false)} transfer={selected} />
      {showPrint && selected && <TransactionReceiptModal transfer={selected} onClose={() => setShowPrint(false)} />}
      {showConfirm && selected && (
        <ConfirmReceiptModal
          open={showConfirm}
          onClose={() => setShowConfirm(false)}
          transfer={selected}
          onConfirm={() => { onStatusChange(selected.id, "completed"); setShowConfirm(false); }}
        />
      )}
      <TransactionStatusModal
        open={showStatus}
        onClose={() => setShowStatus(false)}
        transaction={selected}
        onSubmit={(status) => { if (selected) onStatusChange(selected.id, status); setShowStatus(false); }}
      />
    </div>
  );
}

function IconBtn({ icon: Icon, title, onClick }: { icon: React.ComponentType<{ className?: string }>; title: string; onClick: () => void }) {
  return (
    <button type="button" title={title} onClick={onClick} className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-500/10">
      <Icon className="w-4 h-4" />
    </button>
  );
}
