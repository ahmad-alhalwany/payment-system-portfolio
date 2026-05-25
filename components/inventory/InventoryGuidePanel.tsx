"use client";

import { CheckCircle2, Info } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function InventoryGuidePanel() {
  const { t } = useLocale();
  const guide = t.dashboard.inventory.guide;

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-primary-500/5 p-5 h-fit sticky top-24">
      <div className="flex items-center gap-2 mb-4">
        <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <h3 className="font-bold text-slate-900 dark:text-white">{guide.title}</h3>
      </div>
      <ul className="space-y-3">
        {guide.items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-600 dark:text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
