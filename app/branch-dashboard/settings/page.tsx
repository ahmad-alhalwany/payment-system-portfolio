"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Building2, Loader2, Lock, Save, Settings2, User } from "lucide-react";
import BranchSettingsGuidePanel from "@/components/branch-manager/SettingsGuidePanel";
import axiosInstance from "@/app/api/axios";
import { settingsApi } from "@/app/api/settings";
import { useAuth } from "@/app/hooks/useAuth";
import { useLocale } from "@/components/providers/LocaleProvider";

type SettingsTab = "branch" | "account";

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30";

const readOnlyClass =
  "w-full px-3 py-2.5 rounded-xl border border-slate-200/60 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed";

interface BranchInfo {
  id: number;
  name: string;
  location: string;
  governorate: string;
  phone_number: string;
}

export default function BranchSettingsPage() {
  const { t } = useLocale();
  const s = t.dashboard.manager.settings;
  const { user } = useAuth();

  const [tab, setTab] = useState<SettingsTab>("branch");
  const [branchInfo, setBranchInfo] = useState<BranchInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const loadBranch = useCallback(async () => {
    const branchId = user?.branch_id;
    if (!branchId) return;
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`/branches/${branchId}`);
      setBranchInfo({
        id: data.id,
        name: data.name,
        location: data.location ?? "",
        governorate: data.governorate ?? "",
        phone_number: data.phone_number ?? "",
      });
    } catch {
      toast.error(s.errors.load);
    } finally {
      setLoading(false);
    }
  }, [user?.branch_id, s.errors.load]);

  useEffect(() => {
    loadBranch();
  }, [loadBranch]);

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchInfo) return;
    setSaving(true);
    try {
      await axiosInstance.put(`/branches/${branchInfo.id}`, {
        location: branchInfo.location,
        phone_number: branchInfo.phone_number,
      });
      toast.success(s.success.branch);
      await loadBranch();
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

  const tabs: { key: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "branch", label: s.tabs.branch, icon: Building2 },
    { key: "account", label: s.tabs.account, icon: User },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings2 className="w-7 h-7 text-indigo-600" />
          {s.title}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-1">{s.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/50">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${tab === key
                    ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/50 p-5 md:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin me-2" />
              </div>
            ) : tab === "branch" && branchInfo ? (
              <form onSubmit={handleSaveBranch} className="space-y-5">
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{s.branch.title}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                      {s.branch.name}
                    </label>
                    <input type="text" value={branchInfo.name} readOnly className={readOnlyClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                      {s.branch.governorate}
                    </label>
                    <input type="text" value={branchInfo.governorate} readOnly className={readOnlyClass} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                      {s.branch.location}
                    </label>
                    <input
                      type="text"
                      value={branchInfo.location}
                      onChange={(e) => setBranchInfo({ ...branchInfo, location: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                      {s.branch.phone}
                    </label>
                    <input
                      type="tel"
                      value={branchInfo.phone_number}
                      onChange={(e) => setBranchInfo({ ...branchInfo, phone_number: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">{s.branch.readOnlyHint}</p>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? s.branch.saving : s.branch.save}
                </button>
              </form>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-5">
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-indigo-600" />
                  {s.account.title}
                </h3>

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    {s.account.username}
                  </label>
                  <input type="text" value={user?.username ?? ""} readOnly className={readOnlyClass} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                      {s.account.oldPassword}
                    </label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                      {s.account.newPassword}
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className={inputClass}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                      {s.account.confirmPassword}
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className={inputClass}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  {saving ? s.account.changing : s.account.changePassword}
                </button>
              </form>
            )}
          </div>
        </div>

        <BranchSettingsGuidePanel />
      </div>
    </div>
  );
}
