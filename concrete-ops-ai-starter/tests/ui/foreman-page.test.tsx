// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import ForemanHomePage from "@/app/dashboard/foreman/page";

vi.mock("@/lib/db/queries", () => ({
  getJobs: vi.fn(async () => ({
    data: [
      {
        id: "job-1",
        job_number: "J-100",
        name: "Warehouse Slab",
        status: "in_progress",
        customers: { name: "Acme Ready Mix" },
      },
    ],
  })),
  getDailyReports: vi.fn(async () => ({
    data: [
      {
        id: "report-1",
        job_id: "job-1",
        report_date: new Date().toISOString().slice(0, 10),
        submitted_by_user_id: "user-1",
        work_completed: "Poured section A",
        created_at: new Date().toISOString(),
        jobs: { job_number: "J-100", name: "Warehouse Slab" },
        users: { full_name: "Morgan Foreman" },
      },
    ],
  })),
  getTimeEntries: vi.fn(async () => ({
    data: [
      {
        id: "time-1",
        employee_id: "employee-1",
        job_id: "job-1",
        job_phase_id: null,
        clock_in_at: "2026-04-17T15:30:00.000Z",
        clock_out_at: null,
        total_hours: null,
        status: "clocked_in",
        employees: { full_name: "Jordan Crew" },
        job_phases: null,
        jobs: { job_number: "J-100", name: "Warehouse Slab" },
      },
    ],
  })),
}));

describe("ForemanHomePage", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders the premium foreman control surface and explicit UTC crew activity labeling", async () => {
    render(await ForemanHomePage());

    expect(screen.getByText("Foreman Command")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Run the field day like a live operations board." })).toBeInTheDocument();
    expect(screen.getByText("Shift Snapshot")).toBeInTheDocument();
    expect(screen.getByText("Recent crew movement")).toBeInTheDocument();
    expect(screen.getByText("UTC")).toBeInTheDocument();
    expect(screen.getByText("Report filed today")).toBeInTheDocument();
  });
});
