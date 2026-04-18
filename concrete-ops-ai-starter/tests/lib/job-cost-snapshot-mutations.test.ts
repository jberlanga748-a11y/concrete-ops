import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { refreshJobCostSnapshot } from "@/lib/db/mutations";

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

describe("refreshJobCostSnapshot", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("recomputes a job cost snapshot from time, reports, and approved change orders", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-18T16:00:00.000Z"));

    const usersTable = createUsersTable("owner");
    const actorEmployeeTable = createActorEmployeeTable();

    const jobsBuilder = {
      eq: vi.fn(),
      single: vi.fn().mockResolvedValue({
        data: { id: "job-1", contract_value: 1000 },
        error: null,
      }),
    };
    jobsBuilder.eq.mockReturnValue(jobsBuilder);

    const timeEntriesBuilder = {
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

    const dailyReportsBuilder = {
      eq: vi.fn(),
      count: 3,
      error: null,
    };
    dailyReportsBuilder.eq.mockReturnValue(dailyReportsBuilder);

    const changeOrdersBuilder = {
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
      if (table === "users") return usersTable;
      if (table === "employees") return actorEmployeeTable;
      if (table === "jobs") return { select: vi.fn(() => jobsBuilder) };
      if (table === "time_entries") return { select: vi.fn(() => timeEntriesBuilder) };
      if (table === "daily_reports") return { select: vi.fn(() => dailyReportsBuilder) };
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
