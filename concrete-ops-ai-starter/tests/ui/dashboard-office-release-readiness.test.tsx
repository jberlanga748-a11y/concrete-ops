// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const {
  mockRequireForemanUser,
  mockRequireOfficeUser,
  mockGetApprovals,
  mockGetApprovalStatusOptions,
  mockGetApprovalTypeOptions,
  mockGetAuditLogs,
  mockGetDailyReports,
  mockGetEstimates,
  mockGetJobs,
  mockGetProposals,
  mockGetEmployeeUserLinkOptions,
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
  mockGetEstimates: vi.fn(),
  mockGetEmployeeUserLinkOptions: vi.fn(),
  mockGetJobs: vi.fn(),
  mockGetManagedUsers: vi.fn(),
  mockGetProposals: vi.fn(),
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
  getEstimates: mockGetEstimates,
  getEmployeeUserLinkOptions: mockGetEmployeeUserLinkOptions,
  getJobs: mockGetJobs,
  getManagedUsers: mockGetManagedUsers,
  getProposals: mockGetProposals,
  getTimeEntries: mockGetTimeEntries,
}));

import ApprovalsPage from "@/app/dashboard/approvals/page";
import AuditLogsPage from "@/app/dashboard/audit-logs/page";
import EstimatesPage from "@/app/dashboard/estimates/page";
import ForemanHomePage from "@/app/dashboard/foreman/page";
import ProposalsPage from "@/app/dashboard/proposals/page";
import SettingsPage from "@/app/dashboard/settings/page";

describe("dashboard office release readiness", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows an approvals error panel when the queue query fails", async () => {
    mockRequireOfficeUser.mockResolvedValue({
      role: "office_admin",
    });
    mockGetApprovals.mockResolvedValue({ data: null, error: new Error("boom") });
    mockGetApprovalTypeOptions.mockResolvedValue([{ value: "proposal", label: "Proposal" }]);
    mockGetApprovalStatusOptions.mockResolvedValue([{ value: "sent", label: "Sent" }]);

    render(await ApprovalsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("We couldn’t load approvals right now")).toBeInTheDocument();
    expect(screen.getByText("The approvals queue is temporarily unavailable. Try refreshing the page or come back in a moment.")).toBeInTheDocument();
  });

  it("shows an estimate empty state instead of a blank table row", async () => {
    mockGetEstimates.mockResolvedValue({ data: [], error: null });

    render(await EstimatesPage());

    expect(screen.getByText("No estimates match this board")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create estimate" })).toHaveAttribute("href", "/dashboard/estimates/new");
  });

  it("shows a proposal empty state instead of a blank table row", async () => {
    mockGetProposals.mockResolvedValue({ data: [], error: null });

    render(await ProposalsPage());

    expect(screen.getByText("No proposals created yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create proposal" })).toHaveAttribute("href", "/dashboard/proposals/new");
  });

  it("shows an audit-log empty state instead of a raw empty row", async () => {
    mockRequireOfficeUser.mockResolvedValue({
      role: "office_admin",
    });
    mockGetAuditLogs.mockResolvedValue({ data: [], error: null });

    render(await AuditLogsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("No audit log entries found")).toBeInTheDocument();
    expect(screen.getByText("Important app actions will appear here once the workspace starts recording activity against tracked records.")).toBeInTheDocument();
  });

  it("shows an error panel when foreman workspace queries fail", async () => {
    mockRequireForemanUser.mockResolvedValue({
      role: "foreman",
    });
    mockGetJobs.mockResolvedValue({ data: null, error: new Error("boom") });
    mockGetDailyReports.mockResolvedValue({ data: [], error: null });
    mockGetTimeEntries.mockResolvedValue({ data: [], error: null });

    render(await ForemanHomePage());

    expect(screen.getByText("We couldn’t load the foreman workspace right now")).toBeInTheDocument();
    expect(screen.getByText("The foreman workspace is temporarily unavailable. Try refreshing the page or come back in a moment.")).toBeInTheDocument();
  });

  it("shows a settings error panel when user-management data fails to load", async () => {
    mockRequireOfficeUser.mockResolvedValue({
      role: "office_admin",
    });
    mockGetManagedUsers.mockResolvedValue({ data: [], error: new Error("boom") });
    mockGetEmployeeUserLinkOptions.mockResolvedValue({ data: [], error: null });

    render(await SettingsPage());

    expect(screen.getByText("We couldn’t load user settings right now")).toBeInTheDocument();
    expect(screen.getByText("The user management workspace is temporarily unavailable. Try refreshing the page or come back in a moment.")).toBeInTheDocument();
  });
});
