// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import DashboardPage from "@/app/dashboard/page";
import { ToastProvider } from "@/components/ui/ToastProvider";

vi.mock("@/lib/db/queries", () => ({
  getTimeEntries: vi.fn(async () => ({ data: [] })),
  getDailyReports: vi.fn(async () => ({ data: [] })),
  getJobFiles: vi.fn(async () => ({ data: [] })),
  getNotifications: vi.fn(async () => ({ data: [] })),
}));

describe("DashboardPage", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("exposes the concrete calculator and admin ops copilot entrypoints", async () => {
    render(
      <ToastProvider>
        {await DashboardPage()}
      </ToastProvider>,
    );

    expect(screen.getByRole("link", { name: "Open Concrete Calculator" })).toHaveAttribute(
      "href",
      "/dashboard/concrete-calculator",
    );
    expect(screen.getByText("Admin Ops Copilot")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ask Copilot" })).toBeInTheDocument();
  });
});
