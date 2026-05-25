import { render, screen, fireEvent } from "@testing-library/react";
import Header from "./Header";
import { useAuth } from "@/app/hooks/useAuth";
import "@testing-library/jest-dom";

jest.mock("@/app/hooks/useAuth");
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/",
}));

const mockedUseAuth = useAuth as jest.Mock;

describe("Header", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should show director links only for director", () => {
    mockedUseAuth.mockReturnValue({ user: { role: "director", username: "director" } });
    render(<Header />);
    expect(screen.getByText("الفروع")).toBeInTheDocument();
    expect(screen.getByText("التقارير")).toBeInTheDocument();
    expect(screen.getByText("الموظفون")).toBeInTheDocument();
  });

  it("should show branch manager links without director routes", () => {
    mockedUseAuth.mockReturnValue({ user: { role: "branch_manager", username: "manager" } });
    render(<Header />);
    expect(screen.getByText("الموظفون")).toBeInTheDocument();
    expect(screen.getByText("التقارير")).toBeInTheDocument();
    expect(screen.queryByText("الفروع")).toBeNull();
  });

  it("should not show management links for employee", () => {
    mockedUseAuth.mockReturnValue({ user: { role: "employee", username: "employee" } });
    render(<Header />);
    expect(screen.queryByText("الفروع")).toBeNull();
    expect(screen.queryByText("التقارير")).toBeNull();
    expect(screen.queryByText("الموظفون")).toBeNull();
  });

  it("should redirect to login on logout button click", () => {
    mockedUseAuth.mockReturnValue({ user: { role: "director", username: "director" } });
    render(<Header />);
    const logoutBtn = screen.getByText("تسجيل الخروج");
    fireEvent.click(logoutBtn);
    expect(localStorage.getItem("token")).toBeNull();
  });
});
