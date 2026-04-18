import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { createProposal, updateProposal } from "@/lib/db/mutations";

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

function createAppUserTable(role: "owner" | "office_admin" | "foreman" | "employee" = "office_admin") {
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

function createMaybeSingleTable<T>(data: T | null) {
  const builder = {
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({
      data,
      error: null,
    }),
  };
  builder.eq.mockReturnValue(builder);

  return {
    select: vi.fn(() => builder),
  };
}

describe("proposal mutations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects create when the selected customer is outside the current company scope", async () => {
    const usersTable = createAppUserTable();
    const customersTable = createMaybeSingleTable(null);

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "customers") return customersTable;
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createProposal({
      customerId: "customer-missing",
      jobId: "job-1",
      title: "Warehouse slab proposal",
      status: "draft",
      notes: "Initial scope",
      sections: [{ sectionType: "scope", heading: "Scope", content: "Prep and place concrete." }],
    });

    expect(result).toEqual({ error: "Selected customer was not found." });
  });

  it("rejects create when the linked job belongs to a different customer", async () => {
    const usersTable = createAppUserTable();
    const customersTable = createMaybeSingleTable({ id: "customer-1" });
    const jobsTable = createMaybeSingleTable({ id: "job-1", customer_id: "customer-2" });

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "customers") return customersTable;
      if (table === "jobs") return jobsTable;
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createProposal({
      customerId: "customer-1",
      jobId: "job-1",
      title: "Warehouse slab proposal",
      status: "draft",
      notes: "Initial scope",
      sections: [{ sectionType: "scope", heading: "Scope", content: "Prep and place concrete." }],
    });

    expect(result).toEqual({ error: "Selected job does not belong to the selected customer." });
  });

  it("creates a proposal after validating the selected customer and linked job", async () => {
    const usersTable = createAppUserTable();
    const customersTable = createMaybeSingleTable({ id: "customer-1" });
    const jobsTable = createMaybeSingleTable({ id: "job-1", customer_id: "customer-1" });
    const actorEmployeeTable = createActorEmployeeTable();

    const proposalsInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "proposal-1" },
          error: null,
        }),
      })),
    }));
    const sectionsInsert = vi.fn().mockResolvedValue({ error: null });
    const auditInsert = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "customers") return customersTable;
      if (table === "jobs") return jobsTable;
      if (table === "employees") return actorEmployeeTable;
      if (table === "proposals") return { insert: proposalsInsert };
      if (table === "proposal_sections") return { insert: sectionsInsert };
      if (table === "audit_logs") return { insert: auditInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createProposal({
      customerId: "customer-1",
      jobId: "job-1",
      title: "  Warehouse Slab Proposal  ",
      status: "sent",
      notes: "  Includes demo and replacement work.  ",
      sections: [
        { sectionType: "scope", heading: " Scope ", content: "  Demo and replace slab section.  " },
        { sectionType: "exclusion", heading: "", content: "   " },
        { sectionType: "term", heading: "Terms", content: "  50% deposit due at mobilization.  " },
      ],
    });

    expect(result).toEqual({ data: { id: "proposal-1" } });
    expect(proposalsInsert).toHaveBeenCalledWith({
      company_id: "company-1",
      customer_id: "customer-1",
      job_id: "job-1",
      created_by_user_id: "user-1",
      title: "Warehouse Slab Proposal",
      status: "sent",
      notes: "Includes demo and replacement work.",
    });
    expect(sectionsInsert).toHaveBeenCalledWith([
      {
        company_id: "company-1",
        proposal_id: "proposal-1",
        section_type: "scope",
        heading: "Scope",
        content: "Demo and replace slab section.",
        sort_order: 0,
      },
      {
        company_id: "company-1",
        proposal_id: "proposal-1",
        section_type: "term",
        heading: "Terms",
        content: "50% deposit due at mobilization.",
        sort_order: 1,
      },
    ]);
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        company_id: "company-1",
        actor_user_id: "user-1",
        actor_employee_id: "employee-actor",
        action_type: "proposal.created",
        target_table: "proposals",
        target_id: "proposal-1",
      }),
    );
  });

  it("updates a proposal, replaces sections, and allows clearing the linked job", async () => {
    const usersTable = createAppUserTable();
    const customersTable = createMaybeSingleTable({ id: "customer-1" });
    const actorEmployeeTable = createActorEmployeeTable();
    const jobsSelect = vi.fn();

    const proposalsUpdateBuilder = {
      eq: vi.fn(),
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "proposal-1" },
          error: null,
        }),
      })),
    };
    proposalsUpdateBuilder.eq.mockReturnValue(proposalsUpdateBuilder);
    const proposalsUpdate = vi.fn(() => proposalsUpdateBuilder);

    const deleteSectionsBuilder = {
      eq: vi.fn(),
      error: null,
    };
    deleteSectionsBuilder.eq.mockReturnValue(deleteSectionsBuilder);
    const deleteSections = vi.fn(() => deleteSectionsBuilder);

    const sectionsInsert = vi.fn().mockResolvedValue({ error: null });
    const auditInsert = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "customers") return customersTable;
      if (table === "jobs") return { select: jobsSelect };
      if (table === "employees") return actorEmployeeTable;
      if (table === "proposals") return { update: proposalsUpdate };
      if (table === "proposal_sections") return { delete: deleteSections, insert: sectionsInsert };
      if (table === "audit_logs") return { insert: auditInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await updateProposal("proposal-1", {
      customerId: "customer-1",
      title: "  Revised Proposal  ",
      status: "approved",
      notes: "   ",
      sections: [{ sectionType: "scope", heading: "Scope", content: "  Final approved scope.  " }],
    });

    expect(result).toEqual({ data: { id: "proposal-1" } });
    expect(jobsSelect).not.toHaveBeenCalled();
    expect(proposalsUpdate).toHaveBeenCalledWith({
      customer_id: "customer-1",
      job_id: null,
      title: "Revised Proposal",
      status: "approved",
      notes: null,
    });
    expect(deleteSections).toHaveBeenCalledOnce();
    expect(sectionsInsert).toHaveBeenCalledWith([
      {
        company_id: "company-1",
        proposal_id: "proposal-1",
        section_type: "scope",
        heading: "Scope",
        content: "Final approved scope.",
        sort_order: 0,
      },
    ]);
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        action_type: "proposal.updated",
        target_id: "proposal-1",
      }),
    );
  });
});
