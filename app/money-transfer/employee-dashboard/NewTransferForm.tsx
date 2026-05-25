"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Send, User, Users, Banknote } from "lucide-react";
import Modal from "@/components/Modal";
import TransferPreviewPanel, { type TransferPreviewData } from "@/components/money-transfer/TransferPreviewPanel";
import { transactionsApi } from "@/app/api/transactions";
import { useLocale } from "@/components/providers/LocaleProvider";

interface Branch {
  id: number;
  name: string;
  governorate: string;
}

interface NewTransferFormProps {
  onSubmit: (transfer: {
    sender: { name: string; mobile: string; governorate: string; address: string; location: string };
    receiver: { name: string; mobile: string; governorate: string };
    amount: number;
    benefitAmount?: number;
    currency: string;
    branch: string;
    message?: string;
    resetForm?: () => void;
  }) => void;
  branches: Branch[];
  currentBranch: Branch | null;
}

const GOVERNORATES = [
  "دمشق", "ريف دمشق", "حلب", "حمص", "حماة", "اللاذقية", "طرطوس",
  "إدلب", "دير الزور", "الرقة", "الحسكة", "السويداء", "درعا", "القنيطرة",
];

const CURRENCIES = [
  { code: "SYP" as const, labelKey: "syp" as const },
  { code: "USD" as const, labelKey: "usd" as const },
];

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-sm transition-shadow";

export default function NewTransferForm({ onSubmit, branches, currentBranch }: NewTransferFormProps) {
  const { t } = useLocale();
  const f = t.dashboard.moneyTransfer.form;

  const [sender, setSender] = useState({ name: "", mobile: "", governorate: GOVERNORATES[0], address: "", location: "" });
  const [receiver, setReceiver] = useState({ name: "", mobile: "", governorate: GOVERNORATES[0] });
  const [amount, setAmount] = useState("");
  const [benefitAmount, setBenefitAmount] = useState("");
  const [currency, setCurrency] = useState<"SYP" | "USD">("SYP");
  const [branch, setBranch] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [preview, setPreview] = useState<TransferPreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const resetForm = useCallback(() => {
    setSender({ name: "", mobile: "", governorate: GOVERNORATES[0], address: "", location: "" });
    setReceiver({ name: "", mobile: "", governorate: GOVERNORATES[0] });
    setAmount("");
    setBenefitAmount("");
    setCurrency("SYP");
    setBranch("");
    setMessage("");
    setPreview(null);
  }, []);

  const fetchPreview = useCallback(async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setPreview(null);
      return;
    }
    setPreviewLoading(true);
    try {
      const benefited = benefitAmount ? parseFloat(benefitAmount) : numAmount;
      const data = await transactionsApi.previewTransfer({
        amount: numAmount,
        benefited_amount: benefited,
        currency,
        sending_branch_id: currentBranch?.id,
        destination_branch_id: branch ? parseInt(branch, 10) : undefined,
      });
      setPreview(data);
    } catch {
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [amount, benefitAmount, currency, currentBranch?.id, branch]);

  useEffect(() => {
    const timer = setTimeout(fetchPreview, 400);
    return () => clearTimeout(timer);
  }, [fetchPreview]);

  const validate = () => {
    const errs: string[] = [];
    if (sender.mobile && !/^\d{9,10}$/.test(sender.mobile)) errs.push(`${f.senderMobile}: 9-10 digits`);
    if (!receiver.name.trim()) errs.push(`${f.receiverName} ${f.required}`);
    if (receiver.mobile && !/^\d{9,10}$/.test(receiver.mobile)) errs.push(`${f.receiverMobile}: 9-10 digits`);
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) errs.push(`${f.amount} ${f.required}`);
    if (!currency) errs.push(`${f.currency} ${f.required}`);
    if (!branch) errs.push(`${f.destBranch} ${f.required}`);
    if (preview && !preview.valid) errs.push(...preview.errors);
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (errs.length > 0) {
      setErrors(errs);
      setShowErrorModal(true);
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onSubmit({
        sender,
        receiver,
        amount: Number(amount),
        benefitAmount: benefitAmount ? Number(benefitAmount) : undefined,
        currency,
        branch,
        message,
        resetForm,
      });
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const currencyLabel = (code: "SYP" | "USD") =>
    code === "SYP" ? "(SYP) Syrian Lira" : "(USD) US Dollar";

  const destBranches = branches.filter((b) => b.governorate === receiver.governorate);

  const SectionHeader = ({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) => (
    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-white/10 mb-4">
      <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
    </div>
  );

  const Field = ({
    label,
    required,
    optional,
    children,
  }: {
    label: string;
    required?: boolean;
    optional?: boolean;
    children: React.ReactNode;
  }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-red-500 ms-1">*</span>}
        {optional && <span className="text-slate-400 text-xs ms-1">({f.optional})</span>}
      </label>
      {children}
    </div>
  );

  if (showConfirm) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-center text-slate-900 dark:text-white">{f.confirmTitle}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {sender.name && <ConfirmRow label={f.senderName} value={sender.name} />}
          {sender.mobile && <ConfirmRow label={f.senderMobile} value={sender.mobile} />}
          <ConfirmRow label={f.governorate} value={sender.governorate} />
          <ConfirmRow label={f.receiverName} value={receiver.name} />
          {receiver.mobile && <ConfirmRow label={f.receiverMobile} value={receiver.mobile} />}
          <ConfirmRow label={f.governorate} value={receiver.governorate} />
          <ConfirmRow label={f.amount} value={`${amount} ${currency}`} />
          <ConfirmRow label={f.benefitAmount} value={benefitAmount || amount} />
          {preview && (
            <>
              <ConfirmRow label={t.dashboard.moneyTransfer.preview.taxRate} value={`${preview.tax_rate}%`} />
              <ConfirmRow label={t.dashboard.moneyTransfer.preview.taxAmount} value={String(preview.tax_amount)} />
              <ConfirmRow label={t.dashboard.moneyTransfer.preview.branchProfit} value={String(preview.branch_profit)} />
            </>
          )}
          <ConfirmRow label={f.destBranch} value={destBranches.find((b) => String(b.id) === branch)?.name ?? branch} />
          {message && <ConfirmRow label={f.message} value={message} />}
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            type="button"
            onClick={() => setShowConfirm(false)}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-300 dark:hover:bg-white/15 transition-colors"
          >
            {f.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-8 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-500 transition-colors disabled:opacity-50"
          >
            {loading ? f.sending : f.confirm}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Modal open={showErrorModal} onClose={() => setShowErrorModal(false)}>
        <div className="text-red-600 dark:text-red-400 text-lg font-bold mb-3 text-center">{f.errorTitle}</div>
        <ul className="list-disc ps-5 space-y-1 text-sm text-slate-700 dark:text-slate-300">
          {errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-4 w-full py-2.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-500"
          onClick={() => setShowErrorModal(false)}
        >
          {f.close}
        </button>
      </Modal>

      <section>
        <SectionHeader icon={User} title={f.senderSection} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label={f.senderName} optional>
            <input className={inputClass} placeholder={f.senderName} value={sender.name} onChange={(e) => setSender({ ...sender, name: e.target.value })} />
          </Field>
          <Field label={f.senderMobile} optional>
            <input className={inputClass} placeholder="9-10 digits" value={sender.mobile} onChange={(e) => setSender({ ...sender, mobile: e.target.value })} />
          </Field>
          <Field label={f.governorate} required>
            <select className={inputClass} value={sender.governorate} onChange={(e) => setSender({ ...sender, governorate: e.target.value })} required>
              {GOVERNORATES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section>
        <SectionHeader icon={Users} title={f.receiverSection} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label={f.receiverName} required>
            <input className={inputClass} value={receiver.name} onChange={(e) => setReceiver({ ...receiver, name: e.target.value })} required />
          </Field>
          <Field label={f.receiverMobile} optional>
            <input className={inputClass} placeholder="9-10 digits" value={receiver.mobile} onChange={(e) => setReceiver({ ...receiver, mobile: e.target.value })} />
          </Field>
          <Field label={f.governorate} required>
            <select
              className={inputClass}
              value={receiver.governorate}
              onChange={(e) => {
                setReceiver({ ...receiver, governorate: e.target.value });
                setBranch("");
              }}
              required
            >
              {GOVERNORATES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section>
        <SectionHeader icon={Banknote} title={f.transferSection} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label={f.amount} required>
            <input className={inputClass} type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </Field>
          <Field label={f.benefitAmount} optional>
            <input className={inputClass} type="number" min="0" step="any" placeholder={f.benefitHint} value={benefitAmount} onChange={(e) => setBenefitAmount(e.target.value)} />
          </Field>
          <Field label={f.currency} required>
            <select className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value as "SYP" | "USD")} required>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{currencyLabel(c.code)}</option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label={f.destBranch} required>
              <select className={inputClass} value={branch} onChange={(e) => setBranch(e.target.value)} required>
                <option value="">{f.selectBranch}</option>
                {destBranches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label={f.message} optional>
              <input className={inputClass} value={message} onChange={(e) => setMessage(e.target.value)} />
            </Field>
          </div>
        </div>
      </section>

      <TransferPreviewPanel preview={preview} loading={previewLoading} amount={amount} currency={currency} />

      <div className="flex justify-center pt-2">
        <button
          type="submit"
          disabled={loading || previewLoading}
          className="inline-flex items-center gap-2 px-10 py-3.5 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-500 shadow-lg shadow-primary-500/25 transition-all disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
          {loading ? f.sending : f.submit}
        </button>
      </div>
    </form>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3">
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
