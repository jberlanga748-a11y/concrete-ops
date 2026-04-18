// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const {
  mockGetCurrentAppUserContext,
  mockRequireOfficeUser,
  mockGetChangeOrders,
  mockGetDailyReportJobOptions,
  mockGetDocuments,
  mockGetDailyReportOptions,
  mockGetNotifications,
} = vi.hoisted(() => ({
  mockGetCurrentAppUserContext: vi.fn(),
  mockRequireOfficeUser: vi.fn(),
  mockGetChangeOrders: vi.fn(),
  mockGetDailyReportJobOptions: vi.fn(),
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

vi.mock("@/lib/auth/server", () => ({
  getCurrentAppUserContext: mockGetCurrentAppUserContext,
  requireOfficeUser: mockRequireOfficeUser,
}));

vi.mock("@/lib/db/queries", () => ({
  getChangeOrders: mockGetChangeOrders,
  getDailyReportJobOptions: mockGetDailyReportJobOptions,
  getDocuments: mockGetDocuments,
  getDailyReportOptions: mockGetDailyReportOptions,
  getNotifications: mockGetNotifications,
}));

import ChangeOrdersPage from "@/app/dashboard/change-orders/page";
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

  it("requires office access for notifications", async () => {
    mockRequireOfficeUser.mockRejectedValue(new Error("NEXT_REDIRECT:/dashboard/foreman"));

    await expect(NotificationsPage()).rejects.toThrow("NEXT_REDIRECT:/dashboard/foreman");
    expect(mockRequireOfficeUser).toHaveBeenCalledWith("/dashboard/notifications");
    expect(mockGetNotifications).not.toHaveBeenCalled();
  });
});
