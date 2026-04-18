import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { createApproval, updateApprovalStatus } from "@/lib/db/mutations";

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

function createUsersTable(role: "owner" | "office_admin" | "employee" = "office_admin") {
  const builder: {
    eq: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
  } = {
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
    select: vi.fn(() => builder),
  };
}

function createMaybeSingleBuilder<T>(data: T | null) {
  const builder: {
    eq: ReturnType<typeof vi.fn>;
    in?: ReturnType<typeof vi.fn>;
    limit?: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
  } = {
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({
      data,
      error: null,
    }),
  };
  builder.eq.mockReturnValue(builder);
  builder.in = vi.fn().mockReturnValue(builder);
  builder.limit = vi.fn().mockReturnValue(builder);
  return builder;
}

describe("approval mutations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a proposal approval when no open approval exists", async () => {
    const usersTable = createUsersTable();
    const employeesTable = createActorEmployeeTable();
    const proposalTargetBuilder = createMaybeSingleBuilder({ id: "proposal-1" });
    const openApprovalBuilder = createMaybeSingleBuilder(null);
    const approvalsInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "approval-1" },
          error: null,
        }),
      })),
    }));
    const proposalsUpdateBuilder: {
      eq: ReturnType<typeof vi.fn>;
      error: null;
    } = {
      eq: vi.fn(),
      error: null,
    };
    proposalsUpdateBuilder.eq.mockReturnValue(proposalsUpdateBuilder);
    const proposalsUpdate = vi.fn(() => proposalsUpdateBuilder);
    const auditInsert = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "employees") return employeesTable;
      if (table === "proposals") return { select: vi.fn(() => proposalTargetBuilder), update: proposalsUpdate };
      if (table === "approvals") return { select: vi.fn(() => openApprovalBuilder), insert: approvalsInsert };
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

  it("rejects duplicate open approvals for the same record", async () => {
    const usersTable = createUsersTable();
    const proposalTargetBuilder = createMaybeSingleBuilder({ id: "proposal-1" });
    const openApprovalBuilder = createMaybeSingleBuilder({ id: "approval-open" });
    const approvalsInsert = vi.fn();

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "proposals") return { select: vi.fn(() => proposalTargetBuilder) };
      if (table === "approvals") return { select: vi.fn(() => openApprovalBuilder), insert: approvalsInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createApproval({
      approvalType: "proposal",
      relatedId: "proposal-1",
    });

    expect(result).toEqual({ error: "An approval is already open for this record." });
    expect(approvalsInsert).not.toHaveBeenCalled();
  });

  it("rejects approvals when the related change order is missing", async () => {
    const usersTable = createUsersTable();
    const changeOrderTargetBuilder = createMaybeSingleBuilder(null);

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "change_orders") return { select: vi.fn(() => changeOrderTargetBuilder) };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createApproval({
      approvalType: "change_order",
      relatedId: "change-order-1",
    });

    expect(result).toEqual({ error: "Change order not found." });
  });

  it("preserves the first viewed timestamp when approving an already viewed approval", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-18T12:34:56.000Z"));

    const usersTable = createUsersTable();
    const employeesTable = createActorEmployeeTable();
    const approvalSelectBuilder = {
      eq: vi.fn(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "approval-1",
          approval_type: "change_order",
          proposal_id: null,
          change_order_id: "change-order-1",
          status: "viewed",
          viewed_at: "2026-04-17T09:00:00.000Z",
          decided_at: null,
        },
        error: null,
      }),
    };
    approvalSelectBuilder.eq.mockReturnValue(approvalSelectBuilder);
    const approvalUpdateBuilder = {
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
    const changeOrdersUpdateBuilder = {
      eq: vi.fn(),
      error: null,
    };
    changeOrdersUpdateBuilder.eq.mockReturnValue(changeOrdersUpdateBuilder);
    const changeOrdersUpdate = vi.fn(() => changeOrdersUpdateBuilder);
    const auditInsert = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "employees") return employeesTable;
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
      viewed_at: "2026-04-17T09:00:00.000Z",
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

  it("rejects updates for finalized approvals", async () => {
    const usersTable = createUsersTable();
    const approvalSelectBuilder = {
      eq: vi.fn(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "approval-1",
          approval_type: "proposal",
          proposal_id: "proposal-1",
          change_order_id: null,
          status: "approved",
          viewed_at: "2026-04-17T09:00:00.000Z",
          decided_at: "2026-04-18T10:00:00.000Z",
        },
        error: null,
      }),
    };
    approvalSelectBuilder.eq.mockReturnValue(approvalSelectBuilder);
    const approvalsUpdate = vi.fn();

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "approvals") {
        return {
          select: vi.fn(() => approvalSelectBuilder),
          update: approvalsUpdate,
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await updateApprovalStatus({
      approvalId: "approval-1",
      status: "rejected",
    });

    expect(result).toEqual({ error: "Approval is already finalized." });
    expect(approvalsUpdate).not.toHaveBeenCalled();
  });
});
