import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { createIncident, updateIncident } from "@/lib/db/mutations";

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
  const appUserBuilder = {
    eq: vi.fn(),
    single: vi.fn().mockResolvedValue({
      data: { id: "user-1", company_id: "company-1", role },
      error: null,
    }),
  };
  appUserBuilder.eq.mockReturnValue(appUserBuilder);

  const recipientsBuilder = {
    eq: vi.fn(),
    in: vi.fn().mockResolvedValue({
      data: [{ id: "office-1" }, { id: "office-2" }],
      error: null,
    }),
  };
  recipientsBuilder.eq.mockReturnValue(recipientsBuilder);

  return {
    select: vi.fn((columns: string) => (columns.includes("company_id") ? appUserBuilder : recipientsBuilder)),
  };
}

function createJobsTable(job: { id: string } | null) {
  const builder = {
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: job,
      error: null,
    }),
  };
  builder.eq.mockReturnValue(builder);

  return {
    select: vi.fn(() => builder),
  };
}

function createEmployeesTable(results: Array<{ id: string } | null>) {
  const maybeSingle = vi.fn();
  for (const result of results) {
    maybeSingle.mockResolvedValueOnce({ data: result, error: null });
  }

  const builder = {
    eq: vi.fn(),
    maybeSingle,
  };
  builder.eq.mockReturnValue(builder);

  return {
    select: vi.fn(() => builder),
  };
}

describe("incident mutations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects create when the selected job is outside the current company scope", async () => {
    const usersTable = createUsersTable();
    const jobsTable = createJobsTable(null);

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "jobs") return jobsTable;
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createIncident({
      jobId: "job-missing",
      incidentType: "near_miss",
      incidentDate: "2026-04-18",
      description: "Worker slipped but recovered.",
      status: "open",
    });

    expect(result).toEqual({ error: "Selected job was not found." });
  });

  it("rejects create when the selected employee is outside the current company scope", async () => {
    const usersTable = createUsersTable();
    const employeesTable = createEmployeesTable([null]);

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "employees") return employeesTable;
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createIncident({
      employeeId: "employee-missing",
      incidentType: "injury",
      incidentDate: "2026-04-18",
      description: "Minor hand cut during cleanup.",
      correctiveAction: "First aid kit used.",
      status: "under_review",
    });

    expect(result).toEqual({ error: "Selected employee was not found." });
  });

  it("creates an incident after validating targets and sends admin notifications", async () => {
    const usersTable = createUsersTable();
    const jobsTable = createJobsTable({ id: "job-1" });
    const employeesTable = createEmployeesTable([{ id: "employee-1" }, { id: "employee-reporter" }]);

    const incidentsInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "incident-1" },
          error: null,
        }),
      })),
    }));
    const notificationsInsert = vi.fn().mockResolvedValue({ error: null });
    const auditInsert = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "jobs") return jobsTable;
      if (table === "employees") return employeesTable;
      if (table === "incidents") return { insert: incidentsInsert };
      if (table === "notifications") return { insert: notificationsInsert };
      if (table === "audit_logs") return { insert: auditInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createIncident({
      jobId: "job-1",
      employeeId: "employee-1",
      incidentType: "injury",
      incidentDate: "2026-04-18",
      description: "  Minor hand cut during cleanup.  ",
      correctiveAction: "  First aid administered and area secured.  ",
      status: "under_review",
    });

    expect(result).toEqual({ data: { id: "incident-1" } });
    expect(incidentsInsert).toHaveBeenCalledWith({
      company_id: "company-1",
      job_id: "job-1",
      employee_id: "employee-1",
      reported_by_user_id: "user-1",
      reported_by_employee_id: "employee-reporter",
      incident_type: "injury",
      incident_date: "2026-04-18",
      description: "Minor hand cut during cleanup.",
      corrective_action: "First aid administered and area secured.",
      status: "under_review",
    });
    expect(notificationsInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          company_id: "company-1",
          user_id: "office-1",
          notification_type: "incident_created",
          related_id: "incident-1",
          priority: "high",
        }),
      ]),
    );
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        company_id: "company-1",
        actor_user_id: "user-1",
        actor_employee_id: "employee-reporter",
        action_type: "incident.created",
        target_table: "incidents",
        target_id: "incident-1",
      }),
    );
  });

  it("updates an incident, allows clearing optional links, and writes an audit log", async () => {
    const usersTable = createUsersTable();
    const employeesTable = createEmployeesTable([{ id: "employee-actor" }]);
    const jobsSelect = vi.fn();

    const incidentsUpdateBuilder = {
      eq: vi.fn(),
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "incident-1" },
          error: null,
        }),
      })),
    };
    incidentsUpdateBuilder.eq.mockReturnValue(incidentsUpdateBuilder);
    const incidentsUpdate = vi.fn(() => incidentsUpdateBuilder);

    const auditInsert = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "jobs") return { select: jobsSelect };
      if (table === "employees") return employeesTable;
      if (table === "incidents") return { update: incidentsUpdate };
      if (table === "audit_logs") return { insert: auditInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await updateIncident("incident-1", {
      incidentType: "observation",
      incidentDate: "2026-04-19",
      description: "  Barricade moved too close to active pour edge.  ",
      correctiveAction: "  Reset barricade and briefed crew lead.  ",
      status: "closed",
    });

    expect(result).toEqual({ data: { id: "incident-1" } });
    expect(jobsSelect).not.toHaveBeenCalled();
    expect(incidentsUpdate).toHaveBeenCalledWith({
      job_id: null,
      employee_id: null,
      incident_type: "observation",
      incident_date: "2026-04-19",
      description: "Barricade moved too close to active pour edge.",
      corrective_action: "Reset barricade and briefed crew lead.",
      status: "closed",
    });
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        company_id: "company-1",
        actor_user_id: "user-1",
        actor_employee_id: "employee-actor",
        action_type: "incident.updated",
        target_id: "incident-1",
      }),
    );
  });
});
