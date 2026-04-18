// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const {
  mockCreateClient,
  mockGetDocumentsForEntity,
  mockGetEmployeeOptions,
  mockGetIncidentById,
  mockGetIncidents,
  mockGetJobAssignments,
  mockGetJobById,
  mockGetJobCostSnapshot,
  mockGetPolicies,
  mockGetPPEItems,
  mockGetTimeEntries,
  mockGetTimeFilterOptions,
  mockGetToolboxTalks,
} = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockGetDocumentsForEntity: vi.fn(),
  mockGetEmployeeOptions: vi.fn(),
  mockGetIncidentById: vi.fn(),
  mockGetIncidents: vi.fn(),
  mockGetJobAssignments: vi.fn(),
  mockGetJobById: vi.fn(),
  mockGetJobCostSnapshot: vi.fn(),
  mockGetPolicies: vi.fn(),
  mockGetPPEItems: vi.fn(),
  mockGetTimeEntries: vi.fn(),
  mockGetTimeFilterOptions: vi.fn(),
  mockGetToolboxTalks: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/documents/DocumentList", () => ({
  DocumentList: () => <div>Document List</div>,
}));

vi.mock("@/components/jobs/JobAssignmentsCard", () => ({
  JobAssignmentsCard: () => <div>Job Assignments Card</div>,
}));

vi.mock("@/components/jobs/JobCostSnapshotCard", () => ({
  JobCostSnapshotCard: () => <div>Job Cost Snapshot Card</div>,
}));

vi.mock("@/components/time/EmployeeClockCard", () => ({
  EmployeeClockCard: () => <div>Employee Clock Card</div>,
}));

vi.mock("@/components/time/ViewerDateTime", () => ({
  ViewerDateTime: ({ value }: { value: string }) => <span>{value}</span>,
}));

vi.mock("@/lib/db/queries", () => ({
  getDocumentsForEntity: mockGetDocumentsForEntity,
  getEmployeeOptions: mockGetEmployeeOptions,
  getIncidentById: mockGetIncidentById,
  getIncidents: mockGetIncidents,
  getJobAssignments: mockGetJobAssignments,
  getJobById: mockGetJobById,
  getJobCostSnapshot: mockGetJobCostSnapshot,
  getPolicies: mockGetPolicies,
  getPPEItems: mockGetPPEItems,
  getTimeEntries: mockGetTimeEntries,
  getTimeFilterOptions: mockGetTimeFilterOptions,
  getToolboxTalks: mockGetToolboxTalks,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

import IncidentsPage from "@/app/dashboard/incidents/page";
import JobHubPage from "@/app/dashboard/jobs/[jobId]/page";
import PoliciesPage from "@/app/dashboard/policies/page";
import PPEPage from "@/app/dashboard/ppe/page";
import TimePage from "@/app/dashboard/time/page";
import ToolboxTalksPage from "@/app/dashboard/toolbox-talks/page";

describe("shared dashboard release readiness", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders an error panel when incidents cannot be loaded", async () => {
    mockGetIncidents.mockResolvedValue({ data: null, error: new Error("boom") });

    render(await IncidentsPage());

    expect(screen.getByText("We couldn’t load incidents right now")).toBeInTheDocument();
    expect(screen.getByText("The incident log is temporarily unavailable. Try refreshing the page or come back in a moment.")).toBeInTheDocument();
  });

  it("renders an empty state when the incident log is empty", async () => {
    mockGetIncidents.mockResolvedValue({ data: [], error: null });

    render(await IncidentsPage());

    expect(screen.getByText("No incidents logged yet")).toBeInTheDocument();
    expect(screen.getByText("Log the first incident or site observation so the shared safety record stays complete for field and office follow-up.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log incident" })).toHaveAttribute("href", "/dashboard/incidents/new");
  });

  it("renders an empty state when the toolbox-talk log is empty", async () => {
    mockGetToolboxTalks.mockResolvedValue({ data: [], error: null });

    render(await ToolboxTalksPage());

    expect(screen.getByText("No toolbox talks logged yet")).toBeInTheDocument();
    expect(screen.getByText("Field-ready safety talks with simple attendance tracking and clean follow-up history.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create toolbox talk" })).toHaveAttribute("href", "/dashboard/toolbox-talks/new");
  });

  it("renders an empty state when the policy library is empty", async () => {
    mockGetPolicies.mockResolvedValue({ data: [], error: null });

    render(await PoliciesPage());

    expect(screen.getByText("No policies created yet")).toBeInTheDocument();
    expect(screen.getByText("Create the first policy so crews and staff have a current guidance record to acknowledge.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create policy" })).toHaveAttribute("href", "/dashboard/policies/new");
  });

  it("renders an empty state when PPE tracking is empty", async () => {
    mockGetPPEItems.mockResolvedValue({ data: [], error: null });

    render(await PPEPage());

    expect(screen.getByText("No PPE items tracked yet")).toBeInTheDocument();
    expect(screen.getByText("Log the first issued item so replacement timing and fit-check follow-up stay visible for the crew.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add PPE item" })).toHaveAttribute("href", "/dashboard/ppe/new");
  });

  it("renders filtered empty-state guidance on the time board", async () => {
    mockGetTimeEntries.mockResolvedValue({ data: [], error: null });
    mockGetTimeFilterOptions.mockResolvedValue({ jobOptions: [], employeeOptions: [], phaseOptions: [] });

    render(await TimePage({ searchParams: { jobId: "job-1" } }));

    expect(screen.getByText("No time entries match this filtered view")).toBeInTheDocument();
    expect(screen.getByText("Clear the filters or widen the selection to bring matching labor activity back into view.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute("href", "/dashboard/time");
  });

  it("keeps job-hub copy and actions foreman-safe on shared job detail routes", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "auth-user-1" } },
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: { role: "foreman" } }),
          })),
        })),
      })),
    });
    mockGetJobById.mockResolvedValue({
      data: {
        id: "job-1",
        job_number: "J-100",
        name: "Warehouse Slab",
        status: "active",
        description: "Pour slab",
        address: "100 Main St",
        start_date: "2026-04-18",
        target_finish_date: "2026-04-25",
        customers: { name: "Acme" },
        foreman_employee: { full_name: "Alex Foreman", job_title: "Foreman", crew_name: "Crew A" },
      },
      error: null,
    });
    mockGetTimeEntries.mockResolvedValue({ data: [], error: null });
    mockGetJobAssignments.mockResolvedValue({ data: [], error: null });
    mockGetEmployeeOptions.mockResolvedValue([]);
    mockGetDocumentsForEntity.mockResolvedValue({ data: [], error: null });
    mockGetJobCostSnapshot.mockResolvedValue({ data: null, error: null });

    render(await JobHubPage({ params: Promise.resolve({ jobId: "job-1" }) }));

    expect(screen.getByText("Keep this project moving with one shared job view for field activity, crew assignments, documents, and next-step follow-up.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Edit Job" })).not.toBeInTheDocument();
    expect(screen.queryByText("Keep this project moving with one shared job view for field activity, crew assignments, documents, and office follow-up.")).not.toBeInTheDocument();
  });
});
