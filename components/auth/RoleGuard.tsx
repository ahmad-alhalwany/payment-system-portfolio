"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getDashboardForRole } from "@/lib/route-access";
import type { AppRole } from "@/lib/route-access";

interface RoleGuardProps {
  allowedRoles: AppRole[];
  children: React.ReactNode;
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole") ?? "";

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!allowedRoles.includes(role as AppRole)) {
      router.replace(getDashboardForRole(role));
      return;
    }

    setAuthorized(true);
  }, [allowedRoles, router]);

  if (!authorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
