// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const { mockGetDailyReportJobOptions, mockGetDailyReportOptions } = vi.hoisted(() => ({
  mockGetDailyReportJobOptions: vi.fn(),
  mockGetDailyReportOptions: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/db/queries", () => ({
  getDailyReportJobOptions: mockGetDailyReportJobOptions,
  getDailyReportOptions: mockGetDailyReportOptions,
}));

import NewUploadPage from "@/app/dashboard/uploads/new/page";

describe("NewUploadPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders shared upload copy instead of office-only wording", async () => {
    mockGetDailyReportJobOptions.mockResolvedValue([{ id: "job-1", label: "J-100 · Warehouse Slab" }]);
    mockGetDailyReportOptions.mockResolvedValue([{ id: "report-1", label: "2026-04-18 · J-100 · Warehouse Slab", jobId: "job-1" }]);

    render(await NewUploadPage());

    expect(screen.getByText("New Upload")).toBeInTheDocument();
    expect(screen.getByText("Job Upload")).toBeInTheDocument();
    expect(screen.getByText("Photo and document upload tied to job records.")).toBeInTheDocument();
    expect(screen.getByText("Attach job photos or files to jobs and optional daily reports.")).toBeInTheDocument();
    expect(screen.queryByText("Employee Photo Upload")).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "J-100 · Warehouse Slab" })).toBeInTheDocument();
  });
});
