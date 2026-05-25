"use client";

import { useEffect, useState } from "react";
import BranchModal from "../branch/BranchModal";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { Transaction } from "@/app/api/transactions";

interface TransactionEditModalProps {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  onSubmit: (data: Record<string, string>) => void;
  loading?: boolean;
}

export default function TransactionEditModal({ open, onClose, transaction, onSubmit, loading }: TransactionEditModalProps) {
  const { t } = useLocale();
  const m = t.dashboard.transactions.modals;

  const [sender, setSender] = useState("");
  const [receiver, setReceiver] = useState("");
  const [senderMobile, setSenderMobile] = useState("");
  const [receiverMobile, setReceiverMobile] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open || !transaction) return;
    setSender(transaction.sender || "");
    setReceiver(transaction.receiver || "");
    setSenderMobile(transaction.sender_mobile || "");
    setReceiverMobile(transaction.receiver_mobile || "");
    setMessage(transaction.message || "");
  }, [open, transaction]);

  if (!open || !transaction) return null;

  const handleSave = () => {
    onSubmit({
      sender,
      receiver,
      sender_mobile: senderMobile,
      receiver_mobile: receiverMobile,
      message,
    });
  };

  return (
    <BranchModal open={open} onClose={onClose} title={`${m.editTitle} — ${transaction.short_id || transaction.id.slice(0, 8)}`} wide>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={m.sender} value={sender} onChange={setSender} disabled={loading} />
        <Field label={m.receiver} value={receiver} onChange={setReceiver} disabled={loading} />
        <Field label={m.senderMobile} value={senderMobile} onChange={setSenderMobile} disabled={loading} />
        <Field label={m.receiverMobile} value={receiverMobile} onChange={setReceiverMobile} disabled={loading} />
        <div className="md:col-span-2">
          <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">{m.message}</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 resize-none"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5">
          {m.cancel}
        </button>
        <button type="button" onClick={handleSave} disabled={loading} className="px-4 py-2 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-500 disabled:opacity-50">
          {loading ? "..." : m.save}
        </button>
      </div>
    </BranchModal>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50"
      />
    </div>
  );
}
