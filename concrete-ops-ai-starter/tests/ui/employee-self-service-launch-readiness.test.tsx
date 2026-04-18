// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const {
  mockCreateClient,
  mockGetEmployeeUploadDailyReportOptions,
  mockGetEmployeeUploadJobOptions,
  mockGetMyPolicyAcknowledgments,
  mockGetMyPPEItems,
} = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockGetEmployeeUploadDailyReportOptions: vi.fn(),
  mockGetEmployeeUploadJobOptions: vi.fn(),
  mockGetMyPolicyAcknowledgments: vi.fn(),
  mockGetMyPPEItems: vi.fn(),
}));

const redirectMock = vi.hoisted(() =>
  vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
);

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/components/employee/EmployeeSelfClockCard", () => ({
  EmployeeSelfClockCard: () => <div>Employee Self Clock Card</div>,
}));

vi.mock("@/components/uploads/EmployeeUploadForm", () => ({
  EmployeeUploadForm: () => <div>Employee Upload Form</div>,
}));

vi.mock("@/components/policies/PolicyAcknowledgmentButton", () => ({
  PolicyAcknowledgmentButton: () => <button type="button">Acknowledge policy</button>,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("@/lib/db/queries", () => ({
  getEmployeeUploadDailyReportOptions: mockGetEmployeeUploadDailyReportOptions,
  getEmployeeUploadJobOptions: mockGetEmployeeUploadJobOptions,
  getMyPolicyAcknowledgments: mockGetMyPolicyAcknowledgments,
  getMyPPEItems: mockGetMyPPEItems,
}));

import EmployeePoliciesPage from "@/app/employee/policies/page";
import EmployeePPEPage from "@/app/employee/ppe/page";
import EmployeeTimePage from "@/app/employee/time/page";
import EmployeeUploadsPage from "@/app/employee/uploads/page";

function createMaybeSingleBuilder<T>(result: { data: T | null; error: Error | null }) {
  const builder = {
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  builder.eq.mockReturnValue(builder);
  return builder;
}

function createListBuilder(result: { data: unknown[]; error: Error | null }) {
  const builder = {
    eq: vi.fn(),
    order: vi.fn(),
    in: vi.fn(),
  };
  builder.eq.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.in.mockResolvedValue(result);
  return builder;
}

function createAssignmentBuilder(result: { data: { job_id: string }[]; error: Error | null }) {
  const builder = {
    eq: vi.fn(),
  };
  builder.eq.mockReturnValue(builder);
  builder.eq.mockReturnValueOnce(builder);
  builder.eq.mockReturnValueOnce(builder);
  builder.eq.mockResolvedValue(result);
  return builder;
}

function createPhaseBuilder(result: { data: { id: string; name: string }[]; error: Error | null }) {
  const builder = {
    eq: vi.fn(),
    order: vi.fn().mockResolvedValue(result),
  };
  builder.eq.mockReturnValue(builder);
  return builder;
}

function buildEmployeeTimeClient({
  appUserResult = { data: { id: "app-user-1", company_id: "company-1" }, error: null as Error | null },
  employeeResult = { data: { id: "employee-1" }, error: null as Error | null },
  assignmentsResult = { data: [{ job_id: "job-1" }], error: null as Error | null },
  phasesResult = { data: [{ id: "phase-1", name: "Footings" }], error: null as Error | null },
  jobsResult = { data: [{ id: "job-1", job_number: "J-100", name: "North Yard" }], error: null as Error | null },
}: {
  appUserResult?: { data: { id: string; company_id: string } | null; error: Error | null };
  employeeResult?: { data: { id: string } | null; error: Error | null };
  assignmentsResult?: { data: { job_id: string }[]; error: Error | null };
  phasesResult?: { data: { id: string; name: string }[]; error: Error | null };
  jobsResult?: { data: { id: string; job_number: string; name: string }[]; error: Error | null };
}) {
  const usersBuilder = createMaybeSingleBuilder(appUserResult);
  const employeesBuilder = createMaybeSingleBuilder(employeeResult);
  const assignmentsBuilder = createAssignmentBuilder(assignmentsResult);
  const phasesBuilder = createPhaseBuilder(phasesResult);
  const jobsBuilder = createListBuilder(jobsResult);

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "auth-user-1" } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      if (table === "users") return { select: vi.fn(() => usersBuilder) };
      if (table === "employees") return { select: vi.fn(() => employeesBuilder) };
      if (table === "job_assignments") return { select: vi.fn(() => assignmentsBuilder) };
      if (table === "job_phases") return { select: vi.fn(() => phasesBuilder) };
      if (table === "jobs") return { select: vi.fn(() => jobsBuilder) };
      throw new Error(`Unexpected table ${table}`);
    }),
  } as never;
}

describe("employee self-service launch readiness", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows an error panel when the employee time board queries fail", async () => {
    mockCreateClient.mockResolvedValue(
      buildEmployeeTimeClient({
        assignmentsResult: { data: [], error: new Error("boom") },
      }),
    );

    render(await EmployeeTimePage());

    expect(screen.getByText("We couldn’t load your time board right now")).toBeInTheDocument();
    expect(screen.getByText("The employee time board is temporarily unavailable. Try refreshing the page or come back in a moment.")).toBeInTheDocument();
  });

  it("shows setup guidance instead of a generic failure when uploads have no employee link", async () => {
    mockGetEmployeeUploadJobOptions.mockResolvedValue({ data: [], error: "No employee record is linked to your user." });
    mockGetEmployeeUploadDailyReportOptions.mockResolvedValue({ data: [], error: null });

    render(await EmployeeUploadsPage());

    expect(screen.getByText("Your employee record is still missing")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to portal home" })).toHaveAttribute("href", "/employee");
  });

  it("shows an error panel when employee uploads cannot load", async () => {
    mockGetEmployeeUploadJobOptions.mockResolvedValue({ data: [], error: "Could not resolve upload access." });
    mockGetEmployeeUploadDailyReportOptions.mockResolvedValue({ data: [], error: null });

    render(await EmployeeUploadsPage());

    expect(screen.getByText("We couldn’t load employee uploads right now")).toBeInTheDocument();
    expect(screen.getByText("The employee upload workspace is temporarily unavailable. Try refreshing the page or come back in a moment.")).toBeInTheDocument();
  });

  it("shows an error panel when policy acknowledgments fail to load", async () => {
    mockGetMyPolicyAcknowledgments.mockResolvedValue({ data: [], error: new Error("boom") });

    render(await EmployeePoliciesPage());

    expect(screen.getByText("We couldn’t load your policies right now")).toBeInTheDocument();
    expect(screen.getByText("The employee policy workspace is temporarily unavailable. Try refreshing the page or come back in a moment.")).toBeInTheDocument();
  });

  it("shows an error panel when PPE records fail to load", async () => {
    mockGetMyPPEItems.mockResolvedValue({ data: [], error: new Error("boom") });

    render(await EmployeePPEPage());

    expect(screen.getByText("We couldn’t load your PPE records right now")).toBeInTheDocument();
    expect(screen.getByText("The employee PPE workspace is temporarily unavailable. Try refreshing the page or come back in a moment.")).toBeInTheDocument();
  });
});
