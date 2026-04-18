// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/db/mutations", () => ({
  createDailyReport: vi.fn(),
  updateDailyReport: vi.fn(),
}));

vi.mock("@/lib/ai/client", () => ({
  postJson: vi.fn(),
}));

vi.mock("@/components/ui/ToastProvider", () => ({
  useToast: () => ({
    pushToast: vi.fn(),
  }),
}));

import { DailyReportForm } from "@/components/daily-reports/DailyReportForm";

describe("DailyReportForm", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("uses shared-team guidance instead of office-only review copy", () => {
    render(
      <DailyReportForm
        jobOptions={[{ id: "job-1", label: "J-100 · Warehouse Slab" }]}
        assignmentOptions={[]}
      />,
    );

    expect(
      screen.getByText("Start with the project and date so the next reviewer can place this report correctly before reading the narrative."),
    ).toBeInTheDocument();
    expect(screen.getByText("Readable cleanup")).toBeInTheDocument();
    expect(
      screen.getByText("Add the work narrative and this panel becomes the quick summary anyone can scan before opening the full record."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Office-ready cleanup")).not.toBeInTheDocument();
    expect(screen.queryByText("Start with the project and date so the office can place this report correctly before reading the narrative.")).not.toBeInTheDocument();
  });
});
