"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";

import { API_BASE_URL } from "@/lib/api-config";

export default function ApiStatusBadge() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
  const { t } = useLocale();

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/health`, { signal: controller.signal, mode: "cors" })
      .then(async (res) => {
        if (!res.ok) {
          setStatus("offline");
          return;
        }
        const body = await res.json().catch(() => null);
        setStatus(body?.status === "ok" || body?.status === "degraded" ? "online" : "offline");
      })
      .catch(() => setStatus("offline"));

    return () => controller.abort();
  }, []);

  const config = {
    checking: { dot: "bg-amber-400 animate-pulse", label: t.api.checking, text: "text-slate-500" },
    online: { dot: "bg-emerald-400", label: t.api.online, text: "text-emerald-600 dark:text-emerald-400" },
    offline: { dot: "bg-slate-400", label: t.api.offline, text: "text-slate-500" },
  }[status];

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-200/80 dark:bg-white/5 border border-slate-300/50 dark:border-white/10 text-xs">
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      <span className={config.text}>{config.label}</span>
    </div>
  );
}
