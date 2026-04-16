import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildDbSeed } from "../fixtures/databaseSeed";
import { createSupabaseMock, getLatestBuilder } from "../helpers/supabaseMock";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import * as queries from "@/lib/db/queries";

const mockedCreateClient = vi.mocked(createClient);

describe("lib/db/queries", () => {
  beforeEach(() => {
    mockedCreateClient.mockReset();
  });

  it("getJobs returns a typed empty list when Supabase has no rows", async () => {
    const supabase = createSupabaseMock({
      tables: {
        jobs: {
          select: {
            awaitResult: { data: null, error: null },
          },
        },
      },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    await expect(queries.getJobs()).resolves.toEqual({ data: [], error: null });
  });

  it("getTimeEntries applies optional job and employee filters", async () => {
    const seed = buildDbSeed();
    const supabase = createSupabaseMock({
      tables: {
        time_entries: {
          select: {
            awaitResult: { data: [seed.timeEntry], error: null },
          },
        },
      },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    const result = await queries.getTimeEntries({ jobId: "job-1", employeeId: "employee-1" });

    expect(result.data).toEqual([seed.timeEntry]);
    const builder = getLatestBuilder(supabase.builders, "time_entries");
    expect(builder.calls).toEqual(
      expect.arrayContaining([
        { method: "eq", args: ["job_id", "job-1"] },
        { method: "eq", args: ["employee_id", "employee-1"] },
        { method: "order", args: ["clock_in_at", { ascending: false }] },
      ]),
    );
  });

  it("getTimeFilterOptions formats job, employee, and phase labels", async () => {
    const seed = buildDbSeed();
    const supabase = createSupabaseMock({
      tables: {
        jobs: {
          select: { awaitResult: { data: [seed.job], error: null } },
        },
        employees: {
          select: { awaitResult: { data: [seed.employee], error: null } },
        },
        job_phases: {
          select: { awaitResult: { data: [seed.jobPhase], error: null } },
        },
      },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    await expect(queries.getTimeFilterOptions()).resolves.toEqual({
      jobOptions: [{ id: "job-1", label: "J-1001 · Demo Sidewalk Pour" }],
      employeeOptions: [{ id: "employee-1", label: "Alex Worker" }],
      phaseOptions: [{ id: "phase-1", label: "Pour" }],
    });
  });

  it("getDailyReportJobOptions formats job labels", async () => {
    const seed = buildDbSeed();
    const supabase = createSupabaseMock({
      tables: {
        jobs: {
          select: { awaitResult: { data: [seed.job], error: null } },
        },
      },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    await expect(queries.getDailyReportJobOptions()).resolves.toEqual([
      { id: "job-1", label: "J-1001 · Demo Sidewalk Pour" },
    ]);
  });

  it("getDailyReportOptions scopes by job id and supports array job payloads", async () => {
    const seed = buildDbSeed();
    const report = {
      id: seed.dailyReport.id,
      job_id: seed.dailyReport.job_id,
      report_date: seed.dailyReport.report_date,
      jobs: [seed.dailyReport.jobs],
    };
    const supabase = createSupabaseMock({
      tables: {
        daily_reports: {
          select: { awaitResult: { data: [report], error: null } },
        },
      },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    await expect(queries.getDailyReportOptions("job-1")).resolves.toEqual([
      { id: "daily-report-1", label: "2026-04-15 · J-1001 · Demo Sidewalk Pour", jobId: "job-1" },
    ]);
    const builder = getLatestBuilder(supabase.builders, "daily_reports");
    expect(builder.calls).toEqual(expect.arrayContaining([{ method: "eq", args: ["job_id", "job-1"] }]));
  });

  it("getDailyReports applies both job and date filters", async () => {
    const seed = buildDbSeed();
    const supabase = createSupabaseMock({
      tables: {
        daily_reports: {
          select: { awaitResult: { data: [seed.dailyReport], error: null } },
        },
      },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    const result = await queries.getDailyReports({ jobId: "job-1", date: "2026-04-15" });
    expect(result.data).toEqual([seed.dailyReport]);
    const builder = getLatestBuilder(supabase.builders, "daily_reports");
    expect(builder.calls).toEqual(
      expect.arrayContaining([
        { method: "eq", args: ["job_id", "job-1"] },
        { method: "eq", args: ["report_date", "2026-04-15"] },
      ]),
    );
  });

  it("getDailyReportById returns a nullable typed result", async () => {
    const seed = buildDbSeed();
    const supabase = createSupabaseMock({
      tables: {
        daily_reports: {
          select: { maybeSingleResult: { data: seed.dailyReport, error: null } },
        },
      },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    const result = await queries.getDailyReportById("daily-report-1");
    expect(result.data).toEqual(seed.dailyReport);
    const builder = getLatestBuilder(supabase.builders, "daily_reports");
    expect(builder.calls).toEqual(expect.arrayContaining([{ method: "eq", args: ["id", "daily-report-1"] }]));
  });

  it("getJobFiles applies all supported filters", async () => {
    const seed = buildDbSeed();
    const supabase = createSupabaseMock({
      tables: {
        job_files: {
          select: { awaitResult: { data: [seed.jobFile], error: null } },
        },
      },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    const result = await queries.getJobFiles({ jobId: "job-1", dailyReportId: "daily-report-1", tag: "progress" });
    expect(result.data).toEqual([seed.jobFile]);
    const builder = getLatestBuilder(supabase.builders, "job_files");
    expect(builder.calls).toEqual(
      expect.arrayContaining([
        { method: "eq", args: ["job_id", "job-1"] },
        { method: "eq", args: ["daily_report_id", "daily-report-1"] },
        { method: "eq", args: ["tag", "progress"] },
      ]),
    );
  });

  it("getChangeOrders applies job and status filters", async () => {
    const seed = buildDbSeed();
    const supabase = createSupabaseMock({
      tables: {
        change_orders: {
          select: { awaitResult: { data: [seed.changeOrder], error: null } },
        },
      },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    const result = await queries.getChangeOrders({ jobId: "job-1", status: "submitted" });
    expect(result.data).toEqual([seed.changeOrder]);
    const builder = getLatestBuilder(supabase.builders, "change_orders");
    expect(builder.calls).toEqual(
      expect.arrayContaining([
        { method: "eq", args: ["job_id", "job-1"] },
        { method: "eq", args: ["status", "submitted"] },
      ]),
    );
  });

  it("getChangeOrderById returns the detailed record", async () => {
    const seed = buildDbSeed();
    const supabase = createSupabaseMock({
      tables: {
        change_orders: {
          select: { maybeSingleResult: { data: seed.changeOrder, error: null } },
        },
      },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    await expect(queries.getChangeOrderById("change-order-1")).resolves.toEqual({
      data: seed.changeOrder,
      error: null,
    });
  });

  it("getChangeOrderLineItems returns the ordered item list", async () => {
    const seed = buildDbSeed();
    const supabase = createSupabaseMock({
      tables: {
        change_order_line_items: {
          select: { awaitResult: { data: [seed.changeOrderLineItem], error: null } },
        },
      },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    await expect(queries.getChangeOrderLineItems("change-order-1")).resolves.toEqual({
      data: [seed.changeOrderLineItem],
      error: null,
    });
  });

  it("getChangeOrderFiles returns linked proof files", async () => {
    const seed = buildDbSeed();
    const supabase = createSupabaseMock({
      tables: {
        change_order_files: {
          select: { awaitResult: { data: [seed.changeOrderFile], error: null } },
        },
      },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    await expect(queries.getChangeOrderFiles("change-order-1")).resolves.toEqual({
      data: [seed.changeOrderFile],
      error: null,
    });
  });

  it("getJobTimeEntries applies the job filter through the shared time query", async () => {
    const seed = buildDbSeed();
    const supabase = createSupabaseMock({
      tables: {
        time_entries: {
          select: { awaitResult: { data: [seed.timeEntry], error: null } },
        },
      },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    const result = await queries.getJobTimeEntries("job-1");

    expect(result).toEqual({ data: [seed.timeEntry], error: null });
    const builder = getLatestBuilder(supabase.builders, "time_entries");
    expect(builder.calls).toEqual(expect.arrayContaining([{ method: "eq", args: ["job_id", "job-1"] }]));
  });
});
