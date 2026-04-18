import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import {
  createApproval,
  createDailyReport,
  refreshJobCostSnapshot,
  updateApprovalStatus,
  updateDailyReport,
} from "@/lib/db/mutations";

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

function createUsersTable(role: "owner" | "office_admin" | "employee" = "office_admin", recipientIds: string[] = ["office-1"]) {
  const appUserBuilder: {
    eq: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
  } = {
    eq: vi.fn(),
    single: vi.fn().mockResolvedValue({
      data: { id: "user-1", company_id: "company-1", role },
      error: null,
    }),
  };
  appUserBuilder.eq.mockReturnValue(appUserBuilder);

  const recipientsBuilder: {
    eq: ReturnType<typeof vi.fn>;
    in: ReturnType<typeof vi.fn>;
  } = {
    eq: vi.fn(),
    in: vi.fn().mockResolvedValue({
      data: recipientIds.map((id) => ({ id })),
      error: null,
    }),
  };
  recipientsBuilder.eq.mockReturnValue(recipientsBuilder);

  return {
    table: {
      select: vi.fn((columns: string) => (columns.includes("company_id") ? appUserBuilder : recipientsBuilder)),
    },
  };
}

function createActorEmployeeTable(employeeId: string | null = "employee-actor") {
  const builder: {
    eq: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
  } = {
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: employeeId ? { id: employeeId } : null,
      error: null,
    }),
  };
  builder.eq.mockReturnValue(builder);

  return {
    table: {
      select: vi.fn(() => builder),
    },
  };
}

describe("workflow mutations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a daily report, filters blank crew rows, and notifies office users", async () => {
    const usersTable = createUsersTable("office_admin", ["office-1", "office-2"]);
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
      if (table === "users") return usersTable.table;
      if (table === "employees") return actorEmployeeTable.table;
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

    const dailyReportsUpdateBuilder: {
      eq: ReturnType<typeof vi.fn>;
      select: ReturnType<typeof vi.fn>;
    } = {
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

    const deleteCrewBuilder: {
      eq: ReturnType<typeof vi.fn>;
      error: null;
    } = {
      eq: vi.fn(),
      error: null,
    };
    deleteCrewBuilder.eq.mockReturnValue(deleteCrewBuilder);
    const deleteCrew = vi.fn(() => deleteCrewBuilder);

    const crewInsert = vi.fn().mockResolvedValue({ error: null });
    const auditInsert = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable.table;
      if (table === "employees") return actorEmployeeTable.table;
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

  it("creates an approval and moves the related proposal into sent status", async () => {
    const usersTable = createUsersTable();
    const actorEmployeeTable = createActorEmployeeTable(null);

    const approvalsInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "approval-1" },
          error: null,
        }),
      })),
    }));

    const proposalUpdateBuilder: {
      eq: ReturnType<typeof vi.fn>;
      error: null;
    } = {
      eq: vi.fn(),
      error: null,
    };
    proposalUpdateBuilder.eq.mockReturnValue(proposalUpdateBuilder);
    const proposalsUpdate = vi.fn(() => proposalUpdateBuilder);
    const auditInsert = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable.table;
      if (table === "employees") return actorEmployeeTable.table;
      if (table === "approvals") return { insert: approvalsInsert };
      if (table === "proposals") return { update: proposalsUpdate };
      if (table === "audit_logs") return { insert: auditInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createApproval({
      approvalType: "proposal",
      relatedId: "proposal-1",
    });

    expect(result).toEqual({ data: { id: "approval-1" } });
    expect(approvalsInsert).toHaveBeenCalledWith({
      company_id: "company-1",
      approval_type: "proposal",
      proposal_id: "proposal-1",
      change_order_id: null,
      created_by_user_id: "user-1",
      status: "sent",
    });
    expect(proposalsUpdate).toHaveBeenCalledWith({ status: "sent" });
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        action_type: "approval.sent",
        target_id: "approval-1",
      }),
    );
  });

  it("updates approval status timestamps and cascades the related change order status", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-18T12:34:56.000Z"));

    const usersTable = createUsersTable();
    const actorEmployeeTable = createActorEmployeeTable("employee-actor");

    const approvalSelectBuilder: {
      eq: ReturnType<typeof vi.fn>;
      single: ReturnType<typeof vi.fn>;
    } = {
      eq: vi.fn(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "approval-1",
          approval_type: "change_order",
          proposal_id: null,
          change_order_id: "change-order-1",
        },
        error: null,
      }),
    };
    approvalSelectBuilder.eq.mockReturnValue(approvalSelectBuilder);

    const approvalUpdateBuilder: {
      eq: ReturnType<typeof vi.fn>;
      select: ReturnType<typeof vi.fn>;
    } = {
      eq: vi.fn(),
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "approval-1" },
          error: null,
        }),
      })),
    };
    approvalUpdateBuilder.eq.mockReturnValue(approvalUpdateBuilder);
    const approvalsUpdate = vi.fn(() => approvalUpdateBuilder);

    const changeOrdersUpdateBuilder: {
      eq: ReturnType<typeof vi.fn>;
      error: null;
    } = {
      eq: vi.fn(),
      error: null,
    };
    changeOrdersUpdateBuilder.eq.mockReturnValue(changeOrdersUpdateBuilder);
    const changeOrdersUpdate = vi.fn(() => changeOrdersUpdateBuilder);

    const auditInsert = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable.table;
      if (table === "employees") return actorEmployeeTable.table;
      if (table === "approvals") {
        return {
          select: vi.fn(() => approvalSelectBuilder),
          update: approvalsUpdate,
        };
      }
      if (table === "change_orders") return { update: changeOrdersUpdate };
      if (table === "audit_logs") return { insert: auditInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await updateApprovalStatus({
      approvalId: "approval-1",
      status: "approved",
    });

    expect(result).toEqual({ data: { id: "approval-1" } });
    expect(approvalsUpdate).toHaveBeenCalledWith({
      status: "approved",
      viewed_at: "2026-04-18T12:34:56.000Z",
      decided_at: "2026-04-18T12:34:56.000Z",
    });
    expect(changeOrdersUpdate).toHaveBeenCalledWith({ status: "approved" });
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        action_type: "approval.approved",
        target_id: "approval-1",
      }),
    );
  });

  it("recomputes a job cost snapshot from time, reports, and approved change orders", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-18T16:00:00.000Z"));

    const usersTable = createUsersTable("owner");
    const actorEmployeeTable = createActorEmployeeTable("employee-actor");

    const jobsBuilder: {
      eq: ReturnType<typeof vi.fn>;
      single: ReturnType<typeof vi.fn>;
    } = {
      eq: vi.fn(),
      single: vi.fn().mockResolvedValue({
        data: { id: "job-1", contract_value: 1000 },
        error: null,
      }),
    };
    jobsBuilder.eq.mockReturnValue(jobsBuilder);

    const timeEntriesBuilder: {
      eq: ReturnType<typeof vi.fn>;
      not: ReturnType<typeof vi.fn>;
    } = {
      eq: vi.fn(),
      not: vi.fn().mockResolvedValue({
        data: [
          { id: "time-1", total_hours: 2, employees: { hourly_rate: 50 } },
          { id: "time-2", total_hours: 1.5, employees: [{ hourly_rate: 60 }] },
        ],
        error: null,
      }),
    };
    timeEntriesBuilder.eq.mockReturnValue(timeEntriesBuilder);

    const dailyReportsCountBuilder: {
      eq: ReturnType<typeof vi.fn>;
      count: number;
      error: null;
    } = {
      eq: vi.fn(),
      count: 3,
      error: null,
    };
    dailyReportsCountBuilder.eq.mockReturnValue(dailyReportsCountBuilder);

    const changeOrdersBuilder: {
      eq: ReturnType<typeof vi.fn>;
      in: ReturnType<typeof vi.fn>;
    } = {
      eq: vi.fn(),
      in: vi.fn().mockResolvedValue({
        data: [
          { total_amount: 200, status: "approved" },
          { total_amount: 50, status: "executed" },
        ],
        error: null,
      }),
    };
    changeOrdersBuilder.eq.mockReturnValue(changeOrdersBuilder);

    const snapshotsUpsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "snapshot-1" },
          error: null,
        }),
      })),
    }));
    const auditInsert = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable.table;
      if (table === "employees") return actorEmployeeTable.table;
      if (table === "jobs") return { select: vi.fn(() => jobsBuilder) };
      if (table === "time_entries") return { select: vi.fn(() => timeEntriesBuilder) };
      if (table === "daily_reports") return { select: vi.fn(() => dailyReportsCountBuilder) };
      if (table === "change_orders") return { select: vi.fn(() => changeOrdersBuilder) };
      if (table === "job_cost_snapshots") return { upsert: snapshotsUpsert };
      if (table === "audit_logs") return { insert: auditInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await refreshJobCostSnapshot("job-1");

    expect(result).toEqual({ data: { id: "snapshot-1" } });
    expect(snapshotsUpsert).toHaveBeenCalledWith(
      {
        company_id: "company-1",
        job_id: "job-1",
        snapshot_date: "2026-04-18",
        actual_labor_hours: 3.5,
        actual_labor_cost: 190,
        approved_change_order_total: 250,
        projected_revenue_total: 1250,
        time_entry_count: 2,
        daily_report_count: 3,
        updated_at: "2026-04-18T16:00:00.000Z",
      },
      { onConflict: "company_id,job_id" },
    );
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        action_type: "job_cost_snapshot.refreshed",
        target_id: "snapshot-1",
      }),
    );
  });
});
