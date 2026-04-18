// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const {
  mockGetCurrentAppUserContext,
  mockRequireOfficeUser,
  mockGetChangeOrders,
  mockGetActiveJobAssignmentOptions,
  mockGetDailyReportById,
  mockGetDailyReportCrewEntries,
  mockGetDailyReportJobOptions,
  mockGetDocumentsForEntity,
  mockGetDocuments,
  mockGetDailyReportOptions,
  mockGetNotifications,
} = vi.hoisted(() => ({
  mockGetCurrentAppUserContext: vi.fn(),
  mockRequireOfficeUser: vi.fn(),
  mockGetChangeOrders: vi.fn(),
  mockGetActiveJobAssignmentOptions: vi.fn(),
  mockGetDailyReportById: vi.fn(),
  mockGetDailyReportCrewEntries: vi.fn(),
  mockGetDailyReportJobOptions: vi.fn(),
  mockGetDocumentsForEntity: vi.fn(),
  mockGetDocuments: vi.fn(),
  mockGetDailyReportOptions: vi.fn(),
  mockGetNotifications: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/notifications/NotificationsList", () => ({
  NotificationsList: () => <div>Notifications List</div>,
}));

vi.mock("@/components/daily-reports/DailyReportForm", () => ({
  DailyReportForm: () => <div>Daily Report Form</div>,
}));

vi.mock("@/components/documents/DocumentList", () => ({
  DocumentList: () => <div>Document List</div>,
}));

vi.mock("@/components/exports/RecordDeliveryCard", () => ({
  RecordDeliveryCard: () => <div>Record Delivery Card</div>,
}));

vi.mock("@/components/time/ViewerDateTime", () => ({
  ViewerDateTime: ({ value }: { value: string }) => <span>{value}</span>,
}));

vi.mock("@/lib/auth/server", () => ({
  getCurrentAppUserContext: mockGetCurrentAppUserContext,
  requireOfficeUser: mockRequireOfficeUser,
}));

vi.mock("@/lib/db/queries", () => ({
  getChangeOrders: mockGetChangeOrders,
  getActiveJobAssignmentOptions: mockGetActiveJobAssignmentOptions,
  getDailyReportById: mockGetDailyReportById,
  getDailyReportCrewEntries: mockGetDailyReportCrewEntries,
  getDailyReportJobOptions: mockGetDailyReportJobOptions,
  getDocumentsForEntity: mockGetDocumentsForEntity,
  getDocuments: mockGetDocuments,
  getDailyReportOptions: mockGetDailyReportOptions,
  getNotifications: mockGetNotifications,
}));

import ChangeOrdersPage from "@/app/dashboard/change-orders/page";
import DailyReportDetailPage from "@/app/dashboard/daily-reports/[id]/page";
import NewDailyReportPage from "@/app/dashboard/daily-reports/new/page";
import NotificationsPage from "@/app/dashboard/notifications/page";
import UploadsPage from "@/app/dashboard/uploads/page";

describe("shared dashboard role visibility", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders foreman-safe uploads copy on the shared uploads page", async () => {
    mockGetCurrentAppUserContext.mockResolvedValue({
      id: "user-1",
      companyId: "company-1",
      role: "foreman",
      email: "foreman@example.com",
      fullName: "Foreman User",
    });
    mockGetDocuments.mockResolvedValue({ data: [], error: null });
    mockGetDailyReportJobOptions.mockResolvedValue([]);
    mockGetDailyReportOptions.mockResolvedValue([]);

    render(await UploadsPage({ searchParams: {} }));

    expect(screen.getByText("Job Uploads")).toBeInTheDocument();
    expect(screen.getByText("Field-visible photo and document record tied to jobs and reports.")).toBeInTheDocument();
    expect(screen.queryByText("Office-managed photo and document record tied to jobs and reports.")).not.toBeInTheDocument();
  });

  it("keeps financial change-order columns hidden for foremen", async () => {
    mockGetCurrentAppUserContext.mockResolvedValue({
      id: "user-1",
      companyId: "company-1",
      role: "foreman",
      email: "foreman@example.com",
      fullName: "Foreman User",
    });
    mockGetChangeOrders.mockResolvedValue({
      data: [
        {
          id: "co-1",
          title: "Pump relocation",
          status: "submitted",
          direct_cost_total: 100,
          markup_percent: 15,
          total_amount: 115,
          jobs: { job_number: "J-100", name: "Warehouse Slab" },
          daily_reports: { report_date: "2026-04-18" },
        },
      ],
      error: null,
    });
    mockGetDailyReportJobOptions.mockResolvedValue([]);

    render(await ChangeOrdersPage({ searchParams: {} }));

    expect(screen.getByText("Track scope shifts with linked field proof and a cleaner handoff into office review.")).toBeInTheDocument();
    expect(screen.queryByText("Direct Cost")).not.toBeInTheDocument();
    expect(screen.queryByText("Markup %")).not.toBeInTheDocument();
    expect(screen.queryByText("Total")).not.toBeInTheDocument();
  });

  it("keeps new daily report workflow copy shared-team friendly", async () => {
    mockGetDailyReportJobOptions.mockResolvedValue([{ id: "job-1", label: "J-100 · Warehouse Slab" }]);
    mockGetActiveJobAssignmentOptions.mockResolvedValue([{ jobId: "job-1", employeeId: "employee-1", employeeLabel: "Alex Foreman" }]);

    render(await NewDailyReportPage());

    expect(screen.getByText("Capture a daily record the whole team can trust on the first pass.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Start with the job, date, and production notes that matter most. This workflow keeps the reporting record focused on readable field context, clearer crew details, and faster shared follow-up.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Capture a daily record the office can trust without a cleanup pass later.")).not.toBeInTheDocument();
  });

  it("keeps daily report detail copy free of office-only framing on shared routes", async () => {
    mockGetDailyReportById.mockResolvedValue({
      data: {
        id: "report-1",
        job_id: "job-1",
        report_date: "2026-04-18",
        work_completed: "Placed slab and wrapped final finish pass.",
        delays_issues: "",
        materials_deliveries: "",
        safety_notes: "",
        created_at: "2026-04-18T10:00:00Z",
        updated_at: "2026-04-18T11:00:00Z",
        jobs: { job_number: "J-100", name: "Warehouse Slab" },
        users: { full_name: "Alex Foreman" },
      },
      error: null,
    });
    mockGetDailyReportCrewEntries.mockResolvedValue({ data: [], error: null });
    mockGetDocumentsForEntity.mockResolvedValue({ data: [], error: null });

    render(await DailyReportDetailPage({ params: Promise.resolve({ id: "report-1" }) }));

    expect(
      screen.getByText(
        "J-100 · Warehouse Slab. Filed by Alex Foreman and kept here as the shared record for production notes, crew context, and downstream follow-up.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Keep uploads and report context tied together for easier team follow-up.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Crew rows are optional, but they make the report more useful for payroll, staffing questions, and field follow-up.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/office-ready record/)).not.toBeInTheDocument();
  });

  it("requires office access for notifications", async () => {
    mockRequireOfficeUser.mockRejectedValue(new Error("NEXT_REDIRECT:/dashboard/foreman"));

    await expect(NotificationsPage()).rejects.toThrow("NEXT_REDIRECT:/dashboard/foreman");
    expect(mockRequireOfficeUser).toHaveBeenCalledWith("/dashboard/notifications");
    expect(mockGetNotifications).not.toHaveBeenCalled();
  });
});
