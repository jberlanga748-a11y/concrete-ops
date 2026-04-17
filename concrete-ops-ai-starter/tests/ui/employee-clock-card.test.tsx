// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/ui/ToastProvider";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

vi.mock("@/components/time/actions", () => ({
  createClockInEntryAction: vi.fn(async () => ({ data: { id: "clock-in-1" } })),
  clockOutLatestEntryAction: vi.fn(async () => ({ data: { id: "clock-out-1" } })),
}));

import { createClockInEntryAction, clockOutLatestEntryAction } from "@/components/time/actions";
import { EmployeeClockCard } from "@/components/time/EmployeeClockCard";

describe("EmployeeClockCard", () => {
  afterEach(() => {
    refreshMock.mockReset();
    vi.clearAllMocks();
    cleanup();
  });

  it("refreshes the labor board after a successful clock-in", async () => {
    render(
      <ToastProvider>
        <EmployeeClockCard
          employeeOptions={[{ id: "employee-1", label: "Maya Crew" }]}
          jobOptions={[{ id: "job-1", label: "J-200 · North Yard" }]}
          phaseOptions={[{ id: "phase-1", label: "Footings" }]}
        />
      </ToastProvider>,
    );

    const [employeeSelect, jobSelect, phaseSelect] = screen.getAllByRole("combobox");
    await userEvent.selectOptions(employeeSelect, "employee-1");
    await userEvent.selectOptions(jobSelect, "job-1");
    await userEvent.selectOptions(phaseSelect, "phase-1");
    await userEvent.click(screen.getByRole("button", { name: "Clock in" }));

    await waitFor(() =>
      expect(createClockInEntryAction).toHaveBeenCalledWith({
        employeeId: "employee-1",
        jobId: "job-1",
        jobPhaseId: "phase-1",
      }),
    );
    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Clock-in saved")).toBeInTheDocument();
    expect(screen.getByText("Clock-in saved. Refreshing the labor board now.")).toBeInTheDocument();
  });

  it("refreshes the labor board after a successful clock-out", async () => {
    render(
      <ToastProvider>
        <EmployeeClockCard
          employeeOptions={[{ id: "employee-1", label: "Maya Crew" }]}
          jobOptions={[{ id: "job-1", label: "J-200 · North Yard" }]}
          phaseOptions={[]}
        />
      </ToastProvider>,
    );

    const [employeeSelect, jobSelect] = screen.getAllByRole("combobox");
    await userEvent.selectOptions(employeeSelect, "employee-1");
    await userEvent.selectOptions(jobSelect, "job-1");
    await userEvent.click(screen.getByRole("button", { name: "Clock out" }));

    await waitFor(() =>
      expect(clockOutLatestEntryAction).toHaveBeenCalledWith({
        employeeId: "employee-1",
        jobId: "job-1",
      }),
    );
    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Clock-out saved")).toBeInTheDocument();
    expect(screen.getByText("Clock-out saved. Refreshing the labor board now.")).toBeInTheDocument();
  });
});
