import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import ManagerSidebar from "@/components/shared/ManagerSidebar";
import RoleGuard from "@/components/auth/RoleGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["director"]}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="flex min-h-screen">
          <ManagerSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <DashboardTopBar />
            <div className="flex-1 p-4 md:p-8">{children}</div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
