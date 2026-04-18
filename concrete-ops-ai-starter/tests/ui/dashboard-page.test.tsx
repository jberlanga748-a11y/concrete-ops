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

const redirectMock = vi.hoisted(() =>
  vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
);

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
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

  it("redirects foremen to the dedicated foreman landing before loading office dashboard data", async () => {
    mockGetCurrentAppUserContext.mockResolvedValue({
      id: "user-1",
      companyId: "company-1",
      role: "foreman",
      email: "foreman@example.com",
      fullName: "Foreman User",
    });

    await expect(DashboardPage()).rejects.toThrow("NEXT_REDIRECT:/dashboard/foreman");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard/foreman");
    expect(mockGetTimeEntries).not.toHaveBeenCalled();
    expect(mockGetDailyReports).not.toHaveBeenCalled();
    expect(mockGetJobFiles).not.toHaveBeenCalled();
    expect(mockGetNotifications).not.toHaveBeenCalled();
  });

  it("shows an error panel when dashboard data queries fail", async () => {
    mockGetCurrentAppUserContext.mockResolvedValue({
      id: "user-1",
      companyId: "company-1",
      role: "owner",
      email: "ops@example.com",
      fullName: "Operations User",
    });
    mockGetTimeEntries.mockResolvedValue({ data: null, error: new Error("boom") });
    mockGetDailyReports.mockResolvedValue({ data: [], error: null });
    mockGetJobFiles.mockResolvedValue({ data: [], error: null });
    mockGetNotifications.mockResolvedValue({ data: [], error: null });

    render(
      <ToastProvider>
        {await DashboardPage()}
      </ToastProvider>,
    );

    expect(screen.getByText("We couldn’t load the operations command view right now")).toBeInTheDocument();
    expect(screen.getByText("The dashboard command view is temporarily unavailable. Try refreshing the page or come back in a moment.")).toBeInTheDocument();
  });
});
