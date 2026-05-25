import BranchManagerSidebar from "@/components/shared/BranchManagerSidebar";
import BranchManagerTopBar from "@/components/dashboard/BranchManagerTopBar";
import RoleGuard from "@/components/auth/RoleGuard";

export default function BranchDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["branch_manager"]}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="flex min-h-screen">
          <BranchManagerSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <BranchManagerTopBar />
            <div className="flex-1 p-4 md:p-8">{children}</div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
