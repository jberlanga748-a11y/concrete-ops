// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import DashboardPage from "@/app/dashboard/page";
import { ToastProvider } from "@/components/ui/ToastProvider";
import type { AppRole } from "@/lib/auth/roles";

const {
  mockGetCurrentAppUserContext,
  mockGetTimeEntries,
  mockGetDailyReports,
  mockGetJobFiles,
  mockGetNotifications,
} = vi.hoisted(() => ({
  mockGetCurrentAppUserContext: vi.fn(),
  mockGetTimeEntries: vi.fn(),
  mockGetDailyReports: vi.fn(),
  mockGetJobFiles: vi.fn(),
  mockGetNotifications: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => ({
  getCurrentAppUserContext: mockGetCurrentAppUserContext,
}));

vi.mock("@/lib/db/queries", () => ({
  getTimeEntries: mockGetTimeEntries,
  getDailyReports: mockGetDailyReports,
  getJobFiles: mockGetJobFiles,
  getNotifications: mockGetNotifications,
}));

async function renderDashboardPage(role: AppRole = "owner") {
  mockGetCurrentAppUserContext.mockResolvedValue({
    id: "user-1",
    companyId: "company-1",
    role,
    email: "ops@example.com",
    fullName: "Operations User",
  });
  mockGetTimeEntries.mockResolvedValue({ data: [] });
  mockGetDailyReports.mockResolvedValue({ data: [] });
  mockGetJobFiles.mockResolvedValue({ data: [] });
  mockGetNotifications.mockResolvedValue({ data: [] });

  render(
    <ToastProvider>
      {await DashboardPage()}
    </ToastProvider>,
  );
}

describe("DashboardPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("creates real tools and copilot anchors for office users", async () => {
    await renderDashboardPage("owner");

    expect(screen.getByRole("link", { name: "Browse Tools & AI" })).toHaveAttribute(
      "href",
      "#tools-and-ai",
    );
    expect(document.getElementById("tools-and-ai")).not.toBeNull();
    expect(screen.getByRole("link", { name: "Open Concrete Calculator" })).toHaveAttribute(
      "href",
      "/dashboard/concrete-calculator",
    );
    expect(screen.getByRole("link", { name: "Jump to Admin Ops Copilot" })).toHaveAttribute(
      "href",
      "#admin-ops-copilot",
    );
    expect(document.getElementById("admin-ops-copilot")).not.toBeNull();
    expect(screen.getByText("Admin Ops Copilot")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ask Copilot" })).toBeInTheDocument();
  });

  it("keeps admin ops copilot controls hidden for non-office roles", async () => {
    await renderDashboardPage("foreman");

    expect(document.getElementById("admin-ops-copilot")).not.toBeNull();
    expect(screen.queryByRole("link", { name: "Jump to Admin Ops Copilot" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ask Copilot" })).not.toBeInTheDocument();
    expect(screen.getByText("Admin Ops Copilot")).toBeInTheDocument();
    expect(screen.getByText(/owner and office admin roles/i)).toBeInTheDocument();
  });
});
