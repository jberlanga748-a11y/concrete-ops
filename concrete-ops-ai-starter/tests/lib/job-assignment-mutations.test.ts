import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { createJobAssignment, updateJobAssignment } from "@/lib/db/mutations";

function createAuthenticatedClient(from: (table: string) => unknown) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "auth-user-1" } },
        error: null,
      }),
    },
    from,
  } as never;
}

function createUsersTable(role: "owner" | "office_admin" | "foreman" | "employee" = "office_admin") {
  const builder = {
    eq: vi.fn(),
    single: vi.fn().mockResolvedValue({
      data: { id: "user-1", company_id: "company-1", role },
      error: null,
    }),
  };
  builder.eq.mockReturnValue(builder);

  return {
    select: vi.fn(() => builder),
  };
}

describe("job assignment mutations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates a foreman assignment and syncs the job foreman pointer", async () => {
    const usersTable = createUsersTable();

    const assignmentInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "assignment-1" },
          error: null,
        }),
      })),
    }));

    const jobUpdateBuilder = {
      eq: vi.fn(),
      error: null,
    };
    jobUpdateBuilder.eq.mockReturnValue(jobUpdateBuilder);
    const jobsUpdate = vi.fn(() => jobUpdateBuilder);

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "job_assignments") return { insert: assignmentInsert };
      if (table === "jobs") return { update: jobsUpdate };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createJobAssignment({
      jobId: "job-1",
      employeeId: "employee-1",
      assignmentRole: "foreman",
      startDate: "2026-04-18",
      isActive: true,
    });

    expect(result).toEqual({ data: { id: "assignment-1" } });
    expect(assignmentInsert).toHaveBeenCalledWith({
      company_id: "company-1",
      job_id: "job-1",
      employee_id: "employee-1",
      assignment_role: "foreman",
      start_date: "2026-04-18",
      end_date: null,
      is_active: true,
    });
    expect(jobsUpdate).toHaveBeenCalledWith({ foreman_employee_id: "employee-1" });
  });

  it("promotes an assignment to active foreman and updates the job pointer", async () => {
    const usersTable = createUsersTable();

    const existingAssignmentBuilder = {
      eq: vi.fn(),
      single: vi.fn().mockResolvedValue({
        data: {
          job_id: "job-1",
          employee_id: "employee-2",
          assignment_role: "crew",
        },
        error: null,
      }),
    };
    existingAssignmentBuilder.eq.mockReturnValue(existingAssignmentBuilder);

    const assignmentUpdateBuilder = {
      eq: vi.fn(),
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "assignment-1" },
          error: null,
        }),
      })),
    };
    assignmentUpdateBuilder.eq.mockReturnValue(assignmentUpdateBuilder);
    const assignmentUpdate = vi.fn(() => assignmentUpdateBuilder);

    const jobUpdateBuilder = {
      eq: vi.fn(),
      error: null,
    };
    jobUpdateBuilder.eq.mockReturnValue(jobUpdateBuilder);
    const jobsUpdate = vi.fn(() => jobUpdateBuilder);

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "job_assignments") {
        return {
          select: vi.fn(() => existingAssignmentBuilder),
          update: assignmentUpdate,
        };
      }
      if (table === "jobs") return { update: jobsUpdate };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await updateJobAssignment("assignment-1", {
      jobId: "job-1",
      employeeId: "employee-2",
      assignmentRole: "foreman",
      isActive: true,
    });

    expect(result).toEqual({ data: { id: "assignment-1" } });
    expect(assignmentUpdate).toHaveBeenCalledWith({
      assignment_role: "foreman",
      start_date: null,
      end_date: null,
      is_active: true,
    });
    expect(jobsUpdate).toHaveBeenCalledWith({ foreman_employee_id: "employee-2" });
  });

  it("clears the job foreman pointer when the active foreman assignment is demoted", async () => {
    const usersTable = createUsersTable();

    const existingAssignmentBuilder = {
      eq: vi.fn(),
      single: vi.fn().mockResolvedValue({
        data: {
          job_id: "job-1",
          employee_id: "employee-1",
          assignment_role: "foreman",
        },
        error: null,
      }),
    };
    existingAssignmentBuilder.eq.mockReturnValue(existingAssignmentBuilder);

    const assignmentUpdateBuilder = {
      eq: vi.fn(),
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "assignment-1" },
          error: null,
        }),
      })),
    };
    assignmentUpdateBuilder.eq.mockReturnValue(assignmentUpdateBuilder);
    const assignmentUpdate = vi.fn(() => assignmentUpdateBuilder);

    const jobSelectBuilder = {
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { foreman_employee_id: "employee-1" },
        error: null,
      }),
    };
    jobSelectBuilder.eq.mockReturnValue(jobSelectBuilder);

    const jobUpdateBuilder = {
      eq: vi.fn(),
      error: null,
    };
    jobUpdateBuilder.eq.mockReturnValue(jobUpdateBuilder);
    const jobsUpdate = vi.fn(() => jobUpdateBuilder);

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "job_assignments") {
        return {
          select: vi.fn(() => existingAssignmentBuilder),
          update: assignmentUpdate,
        };
      }
      if (table === "jobs") {
        return {
          select: vi.fn(() => jobSelectBuilder),
          update: jobsUpdate,
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await updateJobAssignment("assignment-1", {
      jobId: "job-1",
      employeeId: "employee-1",
      assignmentRole: "lead",
      isActive: true,
    });

    expect(result).toEqual({ data: { id: "assignment-1" } });
    expect(jobsUpdate).toHaveBeenCalledWith({ foreman_employee_id: null });
  });

  it("leaves the job foreman pointer alone when another foreman is already assigned", async () => {
    const usersTable = createUsersTable();

    const existingAssignmentBuilder = {
      eq: vi.fn(),
      single: vi.fn().mockResolvedValue({
        data: {
          job_id: "job-1",
          employee_id: "employee-1",
          assignment_role: "foreman",
        },
        error: null,
      }),
    };
    existingAssignmentBuilder.eq.mockReturnValue(existingAssignmentBuilder);

    const assignmentUpdateBuilder = {
      eq: vi.fn(),
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "assignment-1" },
          error: null,
        }),
      })),
    };
    assignmentUpdateBuilder.eq.mockReturnValue(assignmentUpdateBuilder);
    const assignmentUpdate = vi.fn(() => assignmentUpdateBuilder);

    const jobSelectBuilder = {
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { foreman_employee_id: "employee-9" },
        error: null,
      }),
    };
    jobSelectBuilder.eq.mockReturnValue(jobSelectBuilder);

    const jobsUpdate = vi.fn();

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "job_assignments") {
        return {
          select: vi.fn(() => existingAssignmentBuilder),
          update: assignmentUpdate,
        };
      }
      if (table === "jobs") {
        return {
          select: vi.fn(() => jobSelectBuilder),
          update: jobsUpdate,
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await updateJobAssignment("assignment-1", {
      jobId: "job-1",
      employeeId: "employee-1",
      assignmentRole: "crew",
      isActive: false,
      endDate: "2026-04-19",
    });

    expect(result).toEqual({ data: { id: "assignment-1" } });
    expect(assignmentUpdate).toHaveBeenCalledWith({
      assignment_role: "crew",
      start_date: null,
      end_date: "2026-04-19",
      is_active: false,
    });
    expect(jobsUpdate).not.toHaveBeenCalled();
  });
});
