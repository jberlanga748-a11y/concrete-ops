import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { createToolboxTalk, updateToolboxTalk } from "@/lib/db/mutations";

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

function createEmployeeValidationTable(args: {
  foreman?: { id: string } | null;
  attendeeRows?: { id: string }[];
  actorEmployee?: { id: string } | null;
  validationSelectCount?: number;
}) {
  const validationBuilder = {
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: args.foreman ?? null,
      error: null,
    }),
    in: vi.fn().mockResolvedValue({
      data: args.attendeeRows ?? [],
      error: null,
    }),
  };
  validationBuilder.eq.mockReturnValue(validationBuilder);

  const actorBuilder = {
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: args.actorEmployee ?? null,
      error: null,
    }),
  };
  actorBuilder.eq.mockReturnValue(actorBuilder);

  const select = vi.fn();
  for (let index = 0; index < (args.validationSelectCount ?? 1); index += 1) {
    select.mockImplementationOnce(() => validationBuilder);
  }
  select.mockImplementation(() => actorBuilder);

  return { select };
}

describe("toolbox talk mutations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects create when the selected foreman is outside the current company scope", async () => {
    const usersTable = createUsersTable();
    const employeesTable = createEmployeeValidationTable({ foreman: null, attendeeRows: [], validationSelectCount: 1 });

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "employees") return employeesTable;
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createToolboxTalk({
      topic: "Morning ladder safety",
      talkDate: "2026-04-18",
      foremanEmployeeId: "foreman-missing",
      notes: "Discuss staging and cleanup.",
      attendeeEmployeeIds: [],
    });

    expect(result).toEqual({ error: "Selected foreman was not found." });
  });

  it("rejects create when one or more selected attendees are outside the current company scope", async () => {
    const usersTable = createUsersTable();
    const employeesTable = createEmployeeValidationTable({
      foreman: { id: "foreman-1" },
      attendeeRows: [{ id: "employee-1" }],
      validationSelectCount: 2,
    });

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "employees") return employeesTable;
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createToolboxTalk({
      topic: "Morning ladder safety",
      talkDate: "2026-04-18",
      foremanEmployeeId: "foreman-1",
      notes: "Discuss staging and cleanup.",
      attendeeEmployeeIds: ["employee-1", "employee-missing"],
    });

    expect(result).toEqual({ error: "One or more selected attendees were not found." });
  });

  it("creates a toolbox talk with deduped attendees after validating selections", async () => {
    const usersTable = createUsersTable();
    const employeesTable = createEmployeeValidationTable({
      foreman: { id: "foreman-1" },
      attendeeRows: [{ id: "employee-1" }, { id: "employee-2" }],
      actorEmployee: { id: "employee-actor" },
      validationSelectCount: 2,
    });

    const toolboxTalksInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "talk-1" },
          error: null,
        }),
      })),
    }));
    const attendeesInsert = vi.fn().mockResolvedValue({ error: null });
    const auditInsert = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "employees") return employeesTable;
      if (table === "toolbox_talks") return { insert: toolboxTalksInsert };
      if (table === "toolbox_talk_attendees") return { insert: attendeesInsert };
      if (table === "audit_logs") return { insert: auditInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createToolboxTalk({
      topic: "  Morning ladder safety  ",
      talkDate: "2026-04-18",
      foremanEmployeeId: "foreman-1",
      notes: "  Review ladder setup and housekeeping.  ",
      attendeeEmployeeIds: ["employee-1", "employee-2", "employee-1"],
    });

    expect(result).toEqual({ data: { id: "talk-1" } });
    expect(toolboxTalksInsert).toHaveBeenCalledWith({
      company_id: "company-1",
      topic: "Morning ladder safety",
      talk_date: "2026-04-18",
      foreman_employee_id: "foreman-1",
      notes: "Review ladder setup and housekeeping.",
    });
    expect(attendeesInsert).toHaveBeenCalledWith([
      {
        company_id: "company-1",
        toolbox_talk_id: "talk-1",
        employee_id: "employee-1",
      },
      {
        company_id: "company-1",
        toolbox_talk_id: "talk-1",
        employee_id: "employee-2",
      },
    ]);
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        company_id: "company-1",
        actor_user_id: "user-1",
        actor_employee_id: "employee-actor",
        action_type: "toolbox_talk.created",
        target_table: "toolbox_talks",
        target_id: "talk-1",
      }),
    );
  });

  it("updates a toolbox talk without overwriting attendee rows", async () => {
    const usersTable = createUsersTable();
    const employeesTable = createEmployeeValidationTable({
      foreman: { id: "foreman-2" },
      attendeeRows: [],
      actorEmployee: { id: "employee-actor" },
      validationSelectCount: 1,
    });

    const toolboxTalksUpdateBuilder = {
      eq: vi.fn(),
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "talk-1" },
          error: null,
        }),
      })),
    };
    toolboxTalksUpdateBuilder.eq.mockReturnValue(toolboxTalksUpdateBuilder);
    const toolboxTalksUpdate = vi.fn(() => toolboxTalksUpdateBuilder);
    const auditInsert = vi.fn().mockResolvedValue({ error: null });
    const attendeesInsert = vi.fn();

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "employees") return employeesTable;
      if (table === "toolbox_talks") return { update: toolboxTalksUpdate };
      if (table === "toolbox_talk_attendees") return { insert: attendeesInsert };
      if (table === "audit_logs") return { insert: auditInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await updateToolboxTalk("talk-1", {
      topic: "  Updated ladder safety review  ",
      talkDate: "2026-04-19",
      foremanEmployeeId: "foreman-2",
      notes: "  Added weather and footing reminders.  ",
    });

    expect(result).toEqual({ data: { id: "talk-1" } });
    expect(toolboxTalksUpdate).toHaveBeenCalledWith({
      topic: "Updated ladder safety review",
      talk_date: "2026-04-19",
      foreman_employee_id: "foreman-2",
      notes: "Added weather and footing reminders.",
    });
    expect(attendeesInsert).not.toHaveBeenCalled();
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        company_id: "company-1",
        actor_user_id: "user-1",
        actor_employee_id: "employee-actor",
        action_type: "toolbox_talk.updated",
        target_table: "toolbox_talks",
        target_id: "talk-1",
      }),
    );
  });
});
