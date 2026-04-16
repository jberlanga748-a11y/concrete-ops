import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildDbSeed } from "../fixtures/databaseSeed";
import { createSupabaseMock, getLatestBuilder } from "../helpers/supabaseMock";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import {
  clockOutLatestEntry,
  createChangeOrder,
  createClockInEntry,
  createDailyReport,
} from "@/lib/db/mutations";

const mockedCreateClient = vi.mocked(createClient);

describe("lib/db/mutations", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-16T18:00:00.000Z"));
    mockedCreateClient.mockReset();
  });

  it("creates a clock-in entry and normalizes the optional phase", async () => {
    const supabase = createSupabaseMock({
      tables: {
        time_entries: {
          insert: {
            singleResult: { data: { id: "time-entry-1" }, error: null },
          },
        },
      },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    const result = await createClockInEntry({ employeeId: "employee-1", jobId: "job-1" });

    expect(result).toEqual({ data: { id: "time-entry-1" } });
    const builder = getLatestBuilder(supabase.builders, "time_entries");
    expect(builder.calls[0]).toEqual({
      method: "insert",
      args: [
        {
          employee_id: "employee-1",
          job_id: "job-1",
          job_phase_id: null,
          clock_in_at: "2026-04-16T18:00:00.000Z",
          status: "clocked_in",
          source: "employee_app",
        },
      ],
    });
  });

  it("returns the insert error when clock-in fails", async () => {
    const supabase = createSupabaseMock({
      tables: {
        time_entries: {
          insert: {
            singleResult: { data: null, error: { message: "duplicate key" } },
          },
        },
      },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    await expect(
      createClockInEntry({ employeeId: "employee-1", jobId: "job-1", jobPhaseId: "phase-1" }),
    ).resolves.toEqual({ error: "duplicate key" });
  });

  it("clocks out the latest open entry and persists rounded total hours", async () => {
    const seed = buildDbSeed();
    const supabase = createSupabaseMock({
      tables: {
        time_entries: {
          select: {
            awaitResult: { data: [seed.timeEntry], error: null },
          },
          update: {
            awaitResult: { data: null, error: null },
          },
        },
      },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    const result = await clockOutLatestEntry({ employeeId: "employee-1", jobId: "job-1" });

    expect(result).toEqual({ data: { id: "time-entry-1" } });
    const selectBuilder = supabase.builders.time_entries[0];
    expect(selectBuilder.calls).toEqual(
      expect.arrayContaining([
        { method: "eq", args: ["employee_id", "employee-1"] },
        { method: "eq", args: ["job_id", "job-1"] },
        { method: "is", args: ["clock_out_at", null] },
        { method: "in", args: ["status", ["clocked_in", "on_break"]] },
      ]),
    );

    const updateBuilder = supabase.builders.time_entries[1];
    expect(updateBuilder.calls[0]).toEqual({
      method: "update",
      args: [
        {
          clock_out_at: "2026-04-16T18:00:00.000Z",
          total_hours: 2,
          status: "clocked_out",
        },
      ],
    });
  });

  it("returns a friendly message when no open time entry exists", async () => {
    const supabase = createSupabaseMock({
      tables: {
        time_entries: {
          select: {
            awaitResult: { data: [], error: null },
          },
        },
      },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    await expect(clockOutLatestEntry({ employeeId: "employee-1" })).resolves.toEqual({
      error: "No open time entry found for this employee.",
    });
  });

  it("returns the read error when loading the open time entry fails", async () => {
    const supabase = createSupabaseMock({
      tables: {
        time_entries: {
          select: {
            awaitResult: { data: null, error: { message: "permission denied" } },
          },
        },
      },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    await expect(clockOutLatestEntry({ employeeId: "employee-1" })).resolves.toEqual({
      error: "permission denied",
    });
  });

  it("requires an authenticated user to create a daily report", async () => {
    const supabase = createSupabaseMock({
      authUserResult: { data: { user: null }, error: null },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    await expect(
      createDailyReport({ jobId: "job-1", reportDate: "2026-04-16", workCompleted: "Poured section B" }),
    ).resolves.toEqual({ error: "You must be signed in to submit a daily report." });
  });

  it("creates a daily report and trims optional fields", async () => {
    const seed = buildDbSeed();
    const supabase = createSupabaseMock({
      tables: {
        users: {
          select: {
            singleResult: { data: seed.appUser, error: null },
          },
        },
        daily_reports: {
          insert: {
            singleResult: { data: { id: "daily-report-2" }, error: null },
          },
        },
      },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    const result = await createDailyReport({
      jobId: "job-1",
      reportDate: "2026-04-16",
      workCompleted: " Poured section B ",
      delaysIssues: "  Rain delay  ",
      materialsDeliveries: "   ",
      safetyNotes: "  PPE checked  ",
    });

    expect(result).toEqual({ data: { id: "daily-report-2" } });
    const builder = getLatestBuilder(supabase.builders, "daily_reports");
    expect(builder.calls[0]).toEqual({
      method: "insert",
      args: [
        {
          company_id: "company-1",
          submitted_by_user_id: "app-user-1",
          job_id: "job-1",
          report_date: "2026-04-16",
          work_completed: " Poured section B ",
          delays_issues: "Rain delay",
          materials_deliveries: null,
          safety_notes: "PPE checked",
        },
      ],
    });
  });

  it("returns an app-user lookup error before creating a daily report", async () => {
    const supabase = createSupabaseMock({
      tables: {
        users: {
          select: {
            singleResult: { data: null, error: { message: "user lookup failed" } },
          },
        },
      },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    await expect(
      createDailyReport({ jobId: "job-1", reportDate: "2026-04-16", workCompleted: "Work complete" }),
    ).resolves.toEqual({ error: "Could not resolve your app user record." });
  });

  it("creates a change order and deduplicates proof file ids", async () => {
    const seed = buildDbSeed();
    const supabase = createSupabaseMock({
      tables: {
        users: {
          select: {
            singleResult: { data: seed.appUser, error: null },
          },
        },
        change_orders: {
          insert: {
            singleResult: { data: { id: "change-order-2" }, error: null },
          },
        },
        change_order_files: {
          insert: {
            awaitResult: { data: null, error: null },
          },
        },
      },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    const result = await createChangeOrder({
      jobId: "job-1",
      dailyReportId: "daily-report-1",
      title: "  Additional polish  ",
      description: "  Finish polish requested by owner  ",
      status: "submitted",
      directCostTotal: 120,
      markupPercent: 10,
      totalAmount: 132,
      proofFileIds: ["job-file-1", "job-file-1", "", "job-file-2"],
    });

    expect(result).toEqual({ data: { id: "change-order-2" } });
    const coBuilder = getLatestBuilder(supabase.builders, "change_orders");
    expect(coBuilder.calls[0]).toEqual({
      method: "insert",
      args: [
        {
          company_id: "company-1",
          job_id: "job-1",
          daily_report_id: "daily-report-1",
          title: "  Additional polish  ",
          description: "Finish polish requested by owner",
          status: "submitted",
          direct_cost_total: 120,
          markup_percent: 10,
          total_amount: 132,
          created_by_user_id: "app-user-1",
        },
      ],
    });

    const proofBuilder = getLatestBuilder(supabase.builders, "change_order_files");
    expect(proofBuilder.calls[0]).toEqual({
      method: "insert",
      args: [[
        { company_id: "company-1", change_order_id: "change-order-2", job_file_id: "job-file-1" },
        { company_id: "company-1", change_order_id: "change-order-2", job_file_id: "job-file-2" },
      ]],
    });
  });

  it("returns a proof-link error when change-order attachments fail to save", async () => {
    const seed = buildDbSeed();
    const supabase = createSupabaseMock({
      tables: {
        users: {
          select: {
            singleResult: { data: seed.appUser, error: null },
          },
        },
        change_orders: {
          insert: {
            singleResult: { data: { id: "change-order-2" }, error: null },
          },
        },
        change_order_files: {
          insert: {
            awaitResult: { data: null, error: { message: "file link failed" } },
          },
        },
      },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    await expect(
      createChangeOrder({
        jobId: "job-1",
        title: "Extra work",
        status: "draft",
        directCostTotal: 10,
        markupPercent: 0,
        totalAmount: 10,
        proofFileIds: ["job-file-1"],
      }),
    ).resolves.toEqual({ error: "file link failed" });
  });

  it("skips proof-link inserts when no proof file ids are provided", async () => {
    const seed = buildDbSeed();
    const supabase = createSupabaseMock({
      tables: {
        users: {
          select: {
            singleResult: { data: seed.appUser, error: null },
          },
        },
        change_orders: {
          insert: {
            singleResult: { data: { id: "change-order-2" }, error: null },
          },
        },
      },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    const result = await createChangeOrder({
      jobId: "job-1",
      title: "Extra work",
      status: "draft",
      directCostTotal: 10,
      markupPercent: 0,
      totalAmount: 10,
      proofFileIds: [],
    });

    expect(result).toEqual({ data: { id: "change-order-2" } });
    expect(supabase.builders.change_order_files).toBeUndefined();
  });
});
