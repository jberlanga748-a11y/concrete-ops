// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const {
  mockRequireForemanUser,
  mockRequireOfficeUser,
  mockGetApprovals,
  mockGetApprovalStatusOptions,
  mockGetApprovalTypeOptions,
  mockGetAuditLogs,
  mockGetDailyReports,
  mockGetEmployeeUserLinkOptions,
  mockGetJobs,
  mockGetManagedUsers,
  mockGetTimeEntries,
} = vi.hoisted(() => ({
  mockRequireForemanUser: vi.fn(),
  mockRequireOfficeUser: vi.fn(),
  mockGetApprovals: vi.fn(),
  mockGetApprovalStatusOptions: vi.fn(),
  mockGetApprovalTypeOptions: vi.fn(),
  mockGetAuditLogs: vi.fn(),
  mockGetDailyReports: vi.fn(),
  mockGetEmployeeUserLinkOptions: vi.fn(),
  mockGetJobs: vi.fn(),
  mockGetManagedUsers: vi.fn(),
  mockGetTimeEntries: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/approvals/ApprovalsList", () => ({
  ApprovalsList: () => <div>Approvals List</div>,
}));

vi.mock("@/components/settings/UserManagementPanel", () => ({
  UserManagementPanel: () => <div>User Management Panel</div>,
}));

vi.mock("@/lib/auth/server", () => ({
  requireForemanUser: mockRequireForemanUser,
  requireOfficeUser: mockRequireOfficeUser,
}));

vi.mock("@/lib/db/queries", () => ({
  getApprovals: mockGetApprovals,
  getApprovalStatusOptions: mockGetApprovalStatusOptions,
  getApprovalTypeOptions: mockGetApprovalTypeOptions,
  getAuditLogs: mockGetAuditLogs,
  getDailyReports: mockGetDailyReports,
  getEmployeeUserLinkOptions: mockGetEmployeeUserLinkOptions,
  getJobs: mockGetJobs,
  getManagedUsers: mockGetManagedUsers,
  getTimeEntries: mockGetTimeEntries,
}));

import ApprovalsPage from "@/app/dashboard/approvals/page";
import AuditLogsPage from "@/app/dashboard/audit-logs/page";
import CustomersLayout from "@/app/dashboard/customers/layout";
import EmployeesLayout from "@/app/dashboard/employees/layout";
import EstimatesLayout from "@/app/dashboard/estimates/layout";
import ForemanHomePage from "@/app/dashboard/foreman/page";
import ProposalsLayout from "@/app/dashboard/proposals/layout";
import SettingsPage from "@/app/dashboard/settings/page";

describe("dashboard route access boundaries", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("keeps office-only dashboard layouts wired to requireOfficeUser", async () => {
    mockRequireOfficeUser.mockResolvedValue({
      role: "office_admin",
    });

    const children = <div>child</div>;

    await expect(CustomersLayout({ children })).resolves.toBe(children);
    await expect(EmployeesLayout({ children })).resolves.toBe(children);
    await expect(EstimatesLayout({ children })).resolves.toBe(children);
    await expect(ProposalsLayout({ children })).resolves.toBe(children);

    expect(mockRequireOfficeUser).toHaveBeenCalledTimes(4);
  });

  it("stops approvals before loading data when office access is denied", async () => {
    mockRequireOfficeUser.mockRejectedValue(new Error("NEXT_REDIRECT:/dashboard/foreman"));

    await expect(ApprovalsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("NEXT_REDIRECT:/dashboard/foreman");
    expect(mockRequireOfficeUser).toHaveBeenCalledWith("/dashboard/approvals");
    expect(mockGetApprovals).not.toHaveBeenCalled();
  });

  it("stops audit logs before loading data when office access is denied", async () => {
    mockRequireOfficeUser.mockRejectedValue(new Error("NEXT_REDIRECT:/dashboard/foreman"));

    await expect(AuditLogsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("NEXT_REDIRECT:/dashboard/foreman");
    expect(mockRequireOfficeUser).toHaveBeenCalledWith("/dashboard/audit-logs");
    expect(mockGetAuditLogs).not.toHaveBeenCalled();
  });

  it("stops settings before loading data when office access is denied", async () => {
    mockRequireOfficeUser.mockRejectedValue(new Error("NEXT_REDIRECT:/dashboard/foreman"));

    await expect(SettingsPage()).rejects.toThrow("NEXT_REDIRECT:/dashboard/foreman");
    expect(mockRequireOfficeUser).toHaveBeenCalled();
    expect(mockGetManagedUsers).not.toHaveBeenCalled();
    expect(mockGetEmployeeUserLinkOptions).not.toHaveBeenCalled();
  });

  it("stops the foreman workspace before loading data when foreman access is denied", async () => {
    mockRequireForemanUser.mockRejectedValue(new Error("NEXT_REDIRECT:/dashboard"));

    await expect(ForemanHomePage()).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    expect(mockRequireForemanUser).toHaveBeenCalled();
    expect(mockGetJobs).not.toHaveBeenCalled();
    expect(mockGetDailyReports).not.toHaveBeenCalled();
    expect(mockGetTimeEntries).not.toHaveBeenCalled();
  });
});
