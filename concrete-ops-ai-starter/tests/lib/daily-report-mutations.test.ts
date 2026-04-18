import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { createDailyReport, updateDailyReport } from "@/lib/db/mutations";

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

function createActorEmployeeTable(employeeId = "employee-actor") {
  const builder = {
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: employeeId ? { id: employeeId } : null,
      error: null,
    }),
  };
  builder.eq.mockReturnValue(builder);

  return {
    select: vi.fn(() => builder),
  };
}

describe("daily report mutations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates a daily report, filters blank crew rows, and notifies office users", async () => {
    const usersTable = createUsersTable();
    const actorEmployeeTable = createActorEmployeeTable("employee-actor");

    const dailyReportsInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "report-1" },
          error: null,
        }),
      })),
    }));
    const crewInsert = vi.fn().mockResolvedValue({ error: null });
    const notificationsInsert = vi.fn().mockResolvedValue({ error: null });
    const auditInsert = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "employees") return actorEmployeeTable;
      if (table === "daily_reports") return { insert: dailyReportsInsert };
      if (table === "daily_report_crew_entries") return { insert: crewInsert };
      if (table === "notifications") return { insert: notificationsInsert };
      if (table === "audit_logs") return { insert: auditInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createDailyReport({
      jobId: "job-1",
      reportDate: "2026-04-18",
      workCompleted: "Placed slab edge forms.",
      delaysIssues: "  ",
      materialsDeliveries: "Ready mix delivered.",
      safetyNotes: "No incidents.",
      crewEntries: [
        { employeeId: "employee-1", hours: 8, notes: "  " },
        { employeeId: "", hours: 2, notes: "Skip this row" },
      ],
    });

    expect(result).toEqual({ data: { id: "report-1" } });
    expect(dailyReportsInsert).toHaveBeenCalledWith({
      company_id: "company-1",
      submitted_by_user_id: "user-1",
      job_id: "job-1",
      report_date: "2026-04-18",
      work_completed: "Placed slab edge forms.",
      delays_issues: null,
      materials_deliveries: "Ready mix delivered.",
      safety_notes: "No incidents.",
    });
    expect(crewInsert).toHaveBeenCalledWith([
      {
        company_id: "company-1",
        daily_report_id: "report-1",
        employee_id: "employee-1",
        hours: 8,
        notes: null,
      },
    ]);
    expect(notificationsInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          company_id: "company-1",
          user_id: "office-1",
          notification_type: "daily_report_submitted",
          related_id: "report-1",
        }),
        expect.objectContaining({
          company_id: "company-1",
          user_id: "office-2",
          notification_type: "daily_report_submitted",
          related_id: "report-1",
        }),
      ]),
    );
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        company_id: "company-1",
        actor_user_id: "user-1",
        actor_employee_id: "employee-actor",
        action_type: "daily_report.created",
        target_table: "daily_reports",
        target_id: "report-1",
      }),
    );
  });

  it("replaces daily report crew rows on update", async () => {
    const usersTable = createUsersTable();
    const actorEmployeeTable = createActorEmployeeTable("employee-actor");

    const dailyReportsUpdateBuilder = {
      eq: vi.fn(),
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "report-1" },
          error: null,
        }),
      })),
    };
    dailyReportsUpdateBuilder.eq.mockReturnValue(dailyReportsUpdateBuilder);
    const dailyReportsUpdate = vi.fn(() => dailyReportsUpdateBuilder);

    const deleteCrewBuilder = {
      eq: vi.fn(),
      error: null,
    };
    deleteCrewBuilder.eq.mockReturnValue(deleteCrewBuilder);
    const deleteCrew = vi.fn(() => deleteCrewBuilder);

    const crewInsert = vi.fn().mockResolvedValue({ error: null });
    const auditInsert = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "employees") return actorEmployeeTable;
      if (table === "daily_reports") return { update: dailyReportsUpdate };
      if (table === "daily_report_crew_entries") return { delete: deleteCrew, insert: crewInsert };
      if (table === "audit_logs") return { insert: auditInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await updateDailyReport("report-1", {
      jobId: "job-1",
      reportDate: "2026-04-19",
      workCompleted: "Finished slab placement.",
      delaysIssues: "Pump arrived late.",
      materialsDeliveries: "",
      safetyNotes: "",
      crewEntries: [
        { employeeId: "employee-2", hours: 5, notes: "Cleanup and strip forms." },
        { employeeId: "", hours: 1, notes: "Ignore" },
      ],
    });

    expect(result).toEqual({ data: { id: "report-1" } });
    expect(dailyReportsUpdate).toHaveBeenCalledWith({
      job_id: "job-1",
      report_date: "2026-04-19",
      work_completed: "Finished slab placement.",
      delays_issues: "Pump arrived late.",
      materials_deliveries: null,
      safety_notes: null,
    });
    expect(deleteCrew).toHaveBeenCalledOnce();
    expect(crewInsert).toHaveBeenCalledWith([
      {
        company_id: "company-1",
        daily_report_id: "report-1",
        employee_id: "employee-2",
        hours: 5,
        notes: "Cleanup and strip forms.",
      },
    ]);
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        action_type: "daily_report.updated",
        target_id: "report-1",
      }),
    );
  });
});
