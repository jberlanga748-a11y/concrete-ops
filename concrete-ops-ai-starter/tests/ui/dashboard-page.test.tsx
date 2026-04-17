// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import DashboardPage from "@/app/dashboard/page";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { getCurrentAppUserContext } from "@/lib/auth/server";

vi.mock("@/lib/db/queries", () => ({
  getTimeEntries: vi.fn(async () => ({ data: [] })),
  getDailyReports: vi.fn(async () => ({ data: [] })),
  getJobFiles: vi.fn(async () => ({ data: [] })),
  getNotifications: vi.fn(async () => ({ data: [] })),
}));

vi.mock("@/lib/auth/server", () => ({
  getCurrentAppUserContext: vi.fn(async () => ({
    id: "user-1",
    companyId: "company-1",
    role: "owner",
    email: "owner@example.com",
    fullName: "Owner User",
  })),
}));

describe("DashboardPage", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("exposes a dedicated tools and AI entry area for office users", async () => {
    vi.mocked(getCurrentAppUserContext).mockResolvedValue({
      id: "user-1",
      companyId: "company-1",
      role: "owner",
      email: "owner@example.com",
      fullName: "Owner User",
    });

    render(
      <ToastProvider>
        {await DashboardPage()}
      </ToastProvider>,
    );

    expect(screen.getByRole("link", { name: "View Tools & AI" })).toHaveAttribute("href", "/dashboard#tools-and-ai");
    expect(screen.getByRole("link", { name: /open calculator/i })).toHaveAttribute("href", "/dashboard/concrete-calculator");
    expect(screen.getByRole("link", { name: /open copilot/i })).toHaveAttribute("href", "/dashboard#admin-ops-copilot");
    expect(screen.getByRole("heading", { name: "Grounded operations Q&A" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ask Copilot" })).toBeInTheDocument();
  });

  it("does not advertise the copilot to foreman users", async () => {
    vi.mocked(getCurrentAppUserContext).mockResolvedValue({
      id: "user-2",
      companyId: "company-1",
      role: "foreman",
      email: "foreman@example.com",
      fullName: "Foreman User",
    });

    render(
      <ToastProvider>
        {await DashboardPage()}
      </ToastProvider>,
    );

    expect(screen.getByRole("link", { name: "View Tools" })).toHaveAttribute("href", "/dashboard#tools-and-ai");
    expect(screen.getByRole("link", { name: /open calculator/i })).toHaveAttribute("href", "/dashboard/concrete-calculator");
    expect(screen.queryByRole("link", { name: /open copilot/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ask Copilot" })).not.toBeInTheDocument();
    expect(
      screen.getByText("Admin Ops Copilot is shown only to owner and office admin roles because it answers from office records."),
    ).toBeInTheDocument();
  });
});
