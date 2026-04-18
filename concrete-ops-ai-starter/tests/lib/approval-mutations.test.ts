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

function createMaybeSingleBuilder<T>(data: T | null) {
  const builder = {
    eq: vi.fn(),
    in: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({
      data,
      error: null,
    }),
  };
  builder.eq.mockReturnValue(builder);
  builder.in.mockReturnValue(builder);
  builder.limit.mockReturnValue(builder);
  return builder;
}

describe("approval mutations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects approval creation when the related proposal is missing", async () => {
    const usersTable = createUsersTable();
    const proposalBuilder = createMaybeSingleBuilder(null);
    const approvalsInsert = vi.fn();

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "proposals") return { select: vi.fn(() => proposalBuilder) };
      if (table === "approvals") return { insert: approvalsInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createApproval({
      approvalType: "proposal",
      relatedId: "proposal-missing",
    });

    expect(result).toEqual({ error: "Proposal not found." });
    expect(approvalsInsert).not.toHaveBeenCalled();
  });

  it("rejects approval creation when an open approval already exists", async () => {
    const usersTable = createUsersTable();
    const proposalBuilder = createMaybeSingleBuilder({ id: "proposal-1" });
    const openApprovalBuilder = createMaybeSingleBuilder({ id: "approval-open" });
    const approvalsInsert = vi.fn();

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "proposals") return { select: vi.fn(() => proposalBuilder) };
      if (table === "approvals") return { select: vi.fn(() => openApprovalBuilder), insert: approvalsInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createApproval({
      approvalType: "proposal",
      relatedId: "proposal-1",
    });

    expect(result).toEqual({ error: "An open approval already exists for this record." });
    expect(approvalsInsert).not.toHaveBeenCalled();
  });

  it("creates an approval and marks the related proposal as sent", async () => {
    const usersTable = createUsersTable();
    const actorEmployeeTable = createActorEmployeeTable();
    const proposalBuilder = createMaybeSingleBuilder({ id: "proposal-1" });
    const openApprovalBuilder = createMaybeSingleBuilder(null);

    const approvalsInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "approval-1" },
          error: null,
        }),
      })),
    }));

    const proposalsUpdateBuilder = {
      eq: vi.fn(),
      error: null,
    };
    proposalsUpdateBuilder.eq.mockReturnValue(proposalsUpdateBuilder);
    const proposalsUpdate = vi.fn(() => proposalsUpdateBuilder);

    const auditInsert = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "employees") return actorEmployeeTable;
      if (table === "proposals") return { select: vi.fn(() => proposalBuilder), update: proposalsUpdate };
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

  it("rejects updates for already finalized approvals", async () => {
    const usersTable = createUsersTable();
    const approvalBuilder = {
      eq: vi.fn(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "approval-1",
          approval_type: "proposal",
          proposal_id: "proposal-1",
          change_order_id: null,
          status: "approved",
          viewed_at: "2026-04-18T12:00:00.000Z",
          decided_at: "2026-04-18T12:05:00.000Z",
        },
        error: null,
      }),
    };
    approvalBuilder.eq.mockReturnValue(approvalBuilder);

    const approvalsUpdate = vi.fn();

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "approvals") return { select: vi.fn(() => approvalBuilder), update: approvalsUpdate };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await updateApprovalStatus({
      approvalId: "approval-1",
      status: "rejected",
    });

    expect(result).toEqual({ error: "Finalized approvals cannot be updated." });
    expect(approvalsUpdate).not.toHaveBeenCalled();
  });

  it("preserves the original viewed timestamp when approving a viewed change order approval", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-18T15:45:00.000Z"));

    const usersTable = createUsersTable();
    const actorEmployeeTable = createActorEmployeeTable();
    const approvalSelectBuilder = {
      eq: vi.fn(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "approval-1",
          approval_type: "change_order",
          proposal_id: null,
          change_order_id: "change-order-1",
          status: "viewed",
          viewed_at: "2026-04-18T14:00:00.000Z",
          decided_at: null,
        },
        error: null,
      }),
    };
    approvalSelectBuilder.eq.mockReturnValue(approvalSelectBuilder);

    const approvalsUpdateBuilder = {
      eq: vi.fn(),
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "approval-1" },
          error: null,
        }),
      })),
    };
    approvalsUpdateBuilder.eq.mockReturnValue(approvalsUpdateBuilder);
    const approvalsUpdate = vi.fn(() => approvalsUpdateBuilder);

    const changeOrdersUpdateBuilder = {
      eq: vi.fn(),
      error: null,
    };
    changeOrdersUpdateBuilder.eq.mockReturnValue(changeOrdersUpdateBuilder);
    const changeOrdersUpdate = vi.fn(() => changeOrdersUpdateBuilder);

    const auditInsert = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "employees") return actorEmployeeTable;
      if (table === "approvals") return { select: vi.fn(() => approvalSelectBuilder), update: approvalsUpdate };
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
      viewed_at: "2026-04-18T14:00:00.000Z",
      decided_at: "2026-04-18T15:45:00.000Z",
    });
    expect(changeOrdersUpdate).toHaveBeenCalledWith({ status: "approved" });
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        action_type: "approval.approved",
        target_id: "approval-1",
      }),
    );
  });
});
