import { siteConfig } from "@/lib/site-config";

export type AppRole = "director" | "branch_manager" | "employee";

export function getDashboardForRole(role: string): string {
  const account = siteConfig.demoAccounts.find((a) => a.role === role);
  if (account) return account.dashboard;

  switch (role) {
    case "director":
      return "/dashboard/director";
    case "branch_manager":
      return "/branch-dashboard";
    case "employee":
      return "/money-transfer";
    default:
      return "/login";
  }
}

/** Roles allowed to access a path prefix (null = no role restriction). */
export function getAllowedRolesForPath(pathname: string): AppRole[] | null {
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/director")) {
    return ["director"];
  }
  if (pathname.startsWith("/branch-dashboard")) return ["branch_manager"];
  return null;
}

export function canAccessPath(role: string, pathname: string): boolean {
  const allowed = getAllowedRolesForPath(pathname);
  if (!allowed) return true;
  return allowed.includes(role as AppRole);
}

export function findDemoAccount(role: string) {
  return siteConfig.demoAccounts.find((a) => a.role === role);
}
