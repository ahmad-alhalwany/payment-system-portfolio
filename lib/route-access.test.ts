import { canAccessPath, getAllowedRolesForPath, getDashboardForRole } from "@/lib/route-access";

describe("route-access", () => {
  it("returns correct dashboard per role", () => {
    expect(getDashboardForRole("director")).toBe("/dashboard/director");
    expect(getDashboardForRole("branch_manager")).toBe("/branch-dashboard");
    expect(getDashboardForRole("employee")).toBe("/money-transfer");
  });

  it("restricts /dashboard and /director to director only", () => {
    expect(getAllowedRolesForPath("/dashboard/director")).toEqual(["director"]);
    expect(getAllowedRolesForPath("/director/branches")).toEqual(["director"]);
    expect(canAccessPath("director", "/dashboard/branches")).toBe(true);
    expect(canAccessPath("branch_manager", "/dashboard/branches")).toBe(false);
    expect(canAccessPath("branch_manager", "/director")).toBe(false);
    expect(canAccessPath("employee", "/dashboard/employees")).toBe(false);
  });

  it("restricts /branch-dashboard to branch_manager only", () => {
    expect(getAllowedRolesForPath("/branch-dashboard")).toEqual(["branch_manager"]);
    expect(canAccessPath("branch_manager", "/branch-dashboard")).toBe(true);
    expect(canAccessPath("director", "/branch-dashboard")).toBe(false);
    expect(canAccessPath("employee", "/branch-dashboard/profit")).toBe(false);
  });

  it("allows public paths for any role", () => {
    expect(canAccessPath("employee", "/money-transfer")).toBe(true);
    expect(canAccessPath("branch_manager", "/")).toBe(true);
  });
});
