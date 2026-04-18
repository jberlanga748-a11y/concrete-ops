// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/db/mutations", () => ({
  createClockInEntry: vi.fn(async () => ({ data: { id: "clock-in-1" } })),
  clockOutLatestEntry: vi.fn(async () => ({ data: { id: "clock-out-1" } })),
}));

import { clockOutLatestEntry } from "@/lib/db/mutations";
import { EmployeeSelfClockCard } from "@/components/employee/EmployeeSelfClockCard";

describe("EmployeeSelfClockCard", () => {
  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it("shows the active shift summary and disables new clock-ins when no jobs are assigned", () => {
    render(
      <EmployeeSelfClockCard
        employeeId="employee-1"
        jobOptions={[]}
        phaseOptions={[]}
        activeShift={{
          clockInAt: "2026-04-18T08:00:00.000Z",
          status: "clocked_in",
          jobLabel: "J-200 · North Yard",
        }}
      />,
    );

    expect(screen.getByText("Active shift on file")).toBeInTheDocument();
    expect(screen.getByText(/Started Apr 18/)).toBeInTheDocument();
    expect(screen.getByText(/J-200 · North Yard/)).toBeInTheDocument();
    expect(screen.getByText("No active assignments available for new clock-ins")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clock In" })).toBeDisabled();
  });

  it("still allows clock-out without a selected job when assignments are unavailable", async () => {
    render(
      <EmployeeSelfClockCard
        employeeId="employee-1"
        jobOptions={[]}
        phaseOptions={[]}
        activeShift={{
          clockInAt: "2026-04-18T08:00:00.000Z",
          status: "clocked_in",
          jobLabel: null,
        }}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Clock Out" }));

    await waitFor(() =>
      expect(clockOutLatestEntry).toHaveBeenCalledWith({
        employeeId: "employee-1",
        jobId: undefined,
      }),
    );
    expect(await screen.findByText("Clock-out saved.")).toBeInTheDocument();
  });
});
