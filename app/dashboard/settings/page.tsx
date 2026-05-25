"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Building2,
  Database,
  Loader2,
  Lock,
  Save,
  Settings2,
  SlidersHorizontal,
  User,
} from "lucide-react";
import SettingsGuidePanel from "@/components/settings/SettingsGuidePanel";
import { settingsApi, type SystemSettings } from "@/app/api/settings";
import { useAuth } from "@/app/hooks/useAuth";
import { useLocale } from "@/components/providers/LocaleProvider";

type TabKey = "system" | "transfer" | "account" | "backup";

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30";

const defaultSettings: SystemSettings = {
  systemName: "",
  companyName: "",
  adminEmail: "",
  defaultCurrency: "SYP",
  mainPhone: "",
  receiptFooter: "",
  transferMinAmount: 1000,
  transferMaxAmount: 0,
  requireReceiverPhone: true,
  requireCompletedForTax: true,
  defaultLocale: "ar",
};

export default function SettingsPage() {
  const { t } = useLocale();
  const s = t.dashboard.settings;
  const { user } = useAuth();
  const isDirector = user?.role === "director";

  const [tab, setTab] = useState<TabKey>("system");
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await settingsApi.getSystem();
      setSettings({ ...defaultSettings, ...res.data });
    } catch {
      toast.error(s.errors.load, { id: "settings-load" });
    } finally {
      setLoading(false);
    }
  }, [s.errors.load]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = (field: keyof SystemSettings, value: string | number | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirector) {
      toast.error(s.system.directorOnly);
      return;
    }
    setSaving(true);
    try {
      const res = await settingsApi.updateSystem(settings);
      setSettings({ ...defaultSettings, ...res.data });
      toast.success(s.success.system);
    } catch {
      toast.error(s.errors.save);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(s.errors.mismatch);
      return;
    }
    setSaving(true);
    try {
      await settingsApi.changePassword(oldPassword, newPassword);
      toast.success(s.success.password);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : s.errors.password);
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    if (!isDirector) {
      toast.error(s.backup.directorOnly);
      return;
    }
    setSaving(true);
    try {
      const res = await settingsApi.backup();
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(s.success.backup);
    } catch {
      toast.error(s.errors.backup);
    } finally {
      setSaving(false);
    }
  };

  const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "system", label: s.tabs.system, icon: Building2 },
    { key: "transfer", label: s.tabs.transfer, icon: SlidersHorizontal },
    { key: "account", label: s.tabs.account, icon: User },
    { key: "backup", label: s.tabs.backup, icon: Database },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center py-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        <p className="text-slate-500">{s.system.saving}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Settings2 className="w-8 h-8 text-primary-500" />
          {s.title}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{s.subtitle}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${tab === key
                ? "bg-primary-600 text-white shadow-lg shadow-primary-500/25"
                : "bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10"}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          {(tab === "system" || tab === "transfer") && (
            <form onSubmit={handleSaveSystem} className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 p-6 space-y-6">
              {!isDirector && (
                <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2">
                  {s.system.directorOnly}
                </p>
              )}

              {tab === "system" && (
                <>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{s.system.title}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label={s.system.systemName}>
                      <input className={inputClass} value={settings.systemName} onChange={(e) => handleChange("systemName", e.target.value)} disabled={!isDirector} required />
                    </Field>
                    <Field label={s.system.companyName}>
                      <input className={inputClass} value={settings.companyName} onChange={(e) => handleChange("companyName", e.target.value)} disabled={!isDirector} required />
                    </Field>
                    <Field label={s.system.adminEmail}>
                      <input type="email" className={inputClass} value={settings.adminEmail} onChange={(e) => handleChange("adminEmail", e.target.value)} disabled={!isDirector} required />
                    </Field>
                    <Field label={s.system.defaultCurrency}>
                      <select className={inputClass} value={settings.defaultCurrency} onChange={(e) => handleChange("defaultCurrency", e.target.value)} disabled={!isDirector}>
                        {(["SYP", "USD", "EUR"] as const).map((c) => (
                          <option key={c} value={c}>{s.currencies[c]}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label={s.system.mainPhone}>
                      <input className={inputClass} value={settings.mainPhone} onChange={(e) => handleChange("mainPhone", e.target.value)} disabled={!isDirector} placeholder="09xxxxxxxx" />
                    </Field>
                    <Field label={s.system.defaultLocale}>
                      <select className={inputClass} value={settings.defaultLocale} onChange={(e) => handleChange("defaultLocale", e.target.value)} disabled={!isDirector}>
                        <option value="ar">{s.locales.ar}</option>
                        <option value="en">{s.locales.en}</option>
                      </select>
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label={s.system.receiptFooter}>
                        <textarea className={`${inputClass} min-h-[80px]`} value={settings.receiptFooter} onChange={(e) => handleChange("receiptFooter", e.target.value)} disabled={!isDirector} />
                      </Field>
                    </div>
                  </div>
                </>
              )}

              {tab === "transfer" && (
                <>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{s.transfer.title}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label={s.transfer.minAmount} hint={s.transfer.hintMin}>
                      <input type="number" min={0} className={inputClass} value={settings.transferMinAmount} onChange={(e) => handleChange("transferMinAmount", Number(e.target.value))} disabled={!isDirector} />
                    </Field>
                    <Field label={s.transfer.maxAmount} hint={s.transfer.hintMax}>
                      <input type="number" min={0} className={inputClass} value={settings.transferMaxAmount} onChange={(e) => handleChange("transferMaxAmount", Number(e.target.value))} disabled={!isDirector} />
                    </Field>
                    <Toggle label={s.transfer.requireReceiverPhone} checked={settings.requireReceiverPhone} onChange={(v) => handleChange("requireReceiverPhone", v)} disabled={!isDirector} />
                    <Toggle label={s.transfer.requireCompletedForTax} checked={settings.requireCompletedForTax} onChange={(v) => handleChange("requireCompletedForTax", v)} disabled={!isDirector} />
                  </div>
                </>
              )}

              {isDirector && (
                <div className="flex justify-end">
                  <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-500 disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? s.system.saving : s.system.save}
                  </button>
                </div>
              )}
            </form>
          )}

          {tab === "account" && (
            <form onSubmit={handlePasswordChange} className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary-500" />
                {s.account.title}
              </h2>
              <Field label={s.account.username}>
                <input className={`${inputClass} opacity-70`} value={user?.username ?? ""} disabled />
              </Field>
              <Field label={s.account.oldPassword}>
                <input type="password" className={inputClass} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
              </Field>
              <Field label={s.account.newPassword}>
                <input type="password" className={inputClass} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
              </Field>
              <Field label={s.account.confirmPassword}>
                <input type="password" className={inputClass} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </Field>
              <div className="flex justify-end">
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-500 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  {saving ? s.account.changing : s.account.changePassword}
                </button>
              </div>
            </form>
          )}

          {tab === "backup" && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 p-6 space-y-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{s.backup.title}</h2>
              {!isDirector && (
                <p className="text-sm text-amber-600 dark:text-amber-400">{s.backup.directorOnly}</p>
              )}
              <button type="button" onClick={handleBackup} disabled={saving || !isDirector} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                {saving ? s.backup.creating : s.backup.create}
              </button>
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4 space-y-2">
                <p className="font-semibold text-slate-800 dark:text-slate-200">{s.backup.restoreTitle}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{s.backup.restoreHint}</p>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">{s.backup.warning}</p>
            </div>
          )}
        </div>

        <SettingsGuidePanel />
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} className="w-4 h-4 rounded accent-primary-600" />
      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
    </label>
  );
}
