import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { clockOutLatestEntry, createClockInEntry } from "@/lib/db/mutations";

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

function createUsersTable(role: "owner" | "office_admin" | "foreman" | "employee" = "employee") {
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

function createMaybeSingleBuilder<T>(data: T | null) {
  const builder = {
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({
      data,
      error: null,
    }),
  };
  builder.eq.mockReturnValue(builder);
  return builder;
}

function createAwaitableBuilder<T>(result: { data: T; error: null } | { data: null; error: { message: string } }) {
  const builder = {
    eq: vi.fn(),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };
  builder.eq.mockReturnValue(builder);
  return builder;
}

describe("time entry mutations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects employee clock-ins for another employee", async () => {
    const usersTable = createUsersTable("employee");
    const actorEmployeeBuilder = createMaybeSingleBuilder({ id: "employee-self" });
    const assignmentsBuilder = createAwaitableBuilder({
      data: [{ job_id: "job-1" }],
      error: null,
    });
    const timeEntriesInsert = vi.fn();

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "employees") return { select: vi.fn(() => actorEmployeeBuilder) };
      if (table === "job_assignments") return { select: vi.fn(() => assignmentsBuilder) };
      if (table === "time_entries") return { insert: timeEntriesInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createClockInEntry({
      employeeId: "employee-other",
      jobId: "job-1",
    });

    expect(result).toEqual({ error: "You can only manage your own time entries." });
    expect(timeEntriesInsert).not.toHaveBeenCalled();
  });

  it("rejects employee clock-ins for unassigned jobs", async () => {
    const usersTable = createUsersTable("employee");
    const actorEmployeeBuilder = createMaybeSingleBuilder({ id: "employee-self" });
    const targetEmployeeBuilder = createMaybeSingleBuilder({ id: "employee-self" });
    const targetJobBuilder = createMaybeSingleBuilder({ id: "job-1" });
    const assignmentsBuilder = createAwaitableBuilder({
      data: [{ job_id: "job-allowed" }],
      error: null,
    });
    const timeEntriesInsert = vi.fn();

    let employeeSelectCount = 0;
    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "employees") {
        return {
          select: vi.fn(() => {
            employeeSelectCount += 1;
            return employeeSelectCount === 1 ? actorEmployeeBuilder : targetEmployeeBuilder;
          }),
        };
      }
      if (table === "job_assignments") return { select: vi.fn(() => assignmentsBuilder) };
      if (table === "jobs") return { select: vi.fn(() => targetJobBuilder) };
      if (table === "time_entries") return { insert: timeEntriesInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createClockInEntry({
      employeeId: "employee-self",
      jobId: "job-1",
    });

    expect(result).toEqual({ error: "You can only clock time on jobs assigned to you." });
    expect(timeEntriesInsert).not.toHaveBeenCalled();
  });

  it("creates an employee clock-in for an assigned job", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-18T08:00:00.000Z"));

    const usersTable = createUsersTable("employee");
    const actorEmployeeBuilder = createMaybeSingleBuilder({ id: "employee-self" });
    const targetEmployeeBuilder = createMaybeSingleBuilder({ id: "employee-self" });
    const targetJobBuilder = createMaybeSingleBuilder({ id: "job-1" });
    const targetPhaseBuilder = createMaybeSingleBuilder({ id: "phase-1" });
    const assignmentsBuilder = createAwaitableBuilder({
      data: [{ job_id: "job-1" }],
      error: null,
    });

    const timeEntriesInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "time-entry-1" },
          error: null,
        }),
      })),
    }));

    let employeeSelectCount = 0;
    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "employees") {
        return {
          select: vi.fn(() => {
            employeeSelectCount += 1;
            return employeeSelectCount === 1 ? actorEmployeeBuilder : targetEmployeeBuilder;
          }),
        };
      }
      if (table === "job_assignments") return { select: vi.fn(() => assignmentsBuilder) };
      if (table === "jobs") return { select: vi.fn(() => targetJobBuilder) };
      if (table === "job_phases") return { select: vi.fn(() => targetPhaseBuilder) };
      if (table === "time_entries") return { insert: timeEntriesInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createClockInEntry({
      employeeId: "employee-self",
      jobId: "job-1",
      jobPhaseId: "phase-1",
    });

    expect(result).toEqual({ data: { id: "time-entry-1" } });
    expect(timeEntriesInsert).toHaveBeenCalledWith({
      company_id: "company-1",
      employee_id: "employee-self",
      job_id: "job-1",
      job_phase_id: "phase-1",
      clock_in_at: "2026-04-18T08:00:00.000Z",
      status: "clocked_in",
      source: "employee_app",
    });
  });

  it("lets foremen clock in crew members with admin entry source", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-18T09:15:00.000Z"));

    const usersTable = createUsersTable("foreman");
    const targetEmployeeBuilder = createMaybeSingleBuilder({ id: "employee-2" });
    const targetJobBuilder = createMaybeSingleBuilder({ id: "job-2" });

    const timeEntriesInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "time-entry-2" },
          error: null,
        }),
      })),
    }));

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "employees") return { select: vi.fn(() => targetEmployeeBuilder) };
      if (table === "jobs") return { select: vi.fn(() => targetJobBuilder) };
      if (table === "time_entries") return { insert: timeEntriesInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createClockInEntry({
      employeeId: "employee-2",
      jobId: "job-2",
    });

    expect(result).toEqual({ data: { id: "time-entry-2" } });
    expect(timeEntriesInsert).toHaveBeenCalledWith({
      company_id: "company-1",
      employee_id: "employee-2",
      job_id: "job-2",
      job_phase_id: null,
      clock_in_at: "2026-04-18T09:15:00.000Z",
      status: "clocked_in",
      source: "admin_entry",
    });
  });

  it("rejects employee clock-outs for another employee", async () => {
    const usersTable = createUsersTable("employee");
    const actorEmployeeBuilder = createMaybeSingleBuilder({ id: "employee-self" });
    const assignmentsBuilder = createAwaitableBuilder({
      data: [{ job_id: "job-1" }],
      error: null,
    });
    const timeEntriesUpdate = vi.fn();

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "employees") return { select: vi.fn(() => actorEmployeeBuilder) };
      if (table === "job_assignments") return { select: vi.fn(() => assignmentsBuilder) };
      if (table === "time_entries") return { update: timeEntriesUpdate };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await clockOutLatestEntry({ employeeId: "employee-other" });

    expect(result).toEqual({ error: "You can only manage your own time entries." });
    expect(timeEntriesUpdate).not.toHaveBeenCalled();
  });

  it("clocks out the latest open entry for the employee", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-18T10:30:00.000Z"));

    const usersTable = createUsersTable("employee");
    const actorEmployeeBuilder = createMaybeSingleBuilder({ id: "employee-self" });
    const targetEmployeeBuilder = createMaybeSingleBuilder({ id: "employee-self" });
    const assignmentsBuilder = createAwaitableBuilder({
      data: [{ job_id: "job-1" }],
      error: null,
    });

    const openEntriesBuilder = {
      eq: vi.fn(),
      is: vi.fn(),
      in: vi.fn(),
      order: vi.fn(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: "time-entry-open",
            clock_in_at: "2026-04-18T08:00:00.000Z",
            break_minutes: 30,
          },
        ],
        error: null,
      }),
    };
    openEntriesBuilder.eq.mockReturnValue(openEntriesBuilder);
    openEntriesBuilder.is.mockReturnValue(openEntriesBuilder);
    openEntriesBuilder.in.mockReturnValue(openEntriesBuilder);
    openEntriesBuilder.order.mockReturnValue(openEntriesBuilder);

    const updateBuilder = {
      eq: vi.fn(),
    };
    updateBuilder.eq.mockReturnValue(updateBuilder);
    const timeEntriesUpdate = vi.fn(() => updateBuilder);

    let employeeSelectCount = 0;
    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "employees") {
        return {
          select: vi.fn(() => {
            employeeSelectCount += 1;
            return employeeSelectCount === 1 ? actorEmployeeBuilder : targetEmployeeBuilder;
          }),
        };
      }
      if (table === "job_assignments") return { select: vi.fn(() => assignmentsBuilder) };
      if (table === "time_entries") {
        return {
          select: vi.fn(() => openEntriesBuilder),
          update: timeEntriesUpdate,
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await clockOutLatestEntry({ employeeId: "employee-self" });

    expect(result).toEqual({ data: { id: "time-entry-open" } });
    expect(timeEntriesUpdate).toHaveBeenCalledWith({
      clock_out_at: "2026-04-18T10:30:00.000Z",
      total_hours: 2,
      status: "clocked_out",
    });
    expect(updateBuilder.eq).toHaveBeenNthCalledWith(1, "company_id", "company-1");
    expect(updateBuilder.eq).toHaveBeenNthCalledWith(2, "id", "time-entry-open");
  });
});
