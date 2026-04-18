import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { createEstimate, updateEstimate } from "@/lib/db/mutations";

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

describe("estimate mutations", () => {
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

    const result = await createEstimate({
      customerId: "customer-missing",
      jobId: "job-1",
      title: "South pad estimate",
      status: "draft",
      notes: "Initial pass",
      lineItems: [
        { itemType: "labor", description: "Crew", quantity: 2, unit: "hrs", unitCost: 80 },
      ],
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

    const result = await createEstimate({
      customerId: "customer-1",
      jobId: "job-1",
      title: "South pad estimate",
      status: "draft",
      notes: "Initial pass",
      lineItems: [
        { itemType: "labor", description: "Crew", quantity: 2, unit: "hrs", unitCost: 80 },
      ],
    });

    expect(result).toEqual({ error: "Selected job does not belong to the selected customer." });
  });

  it("creates an estimate after validating the selected customer and linked job", async () => {
    const usersTable = createAppUserTable();
    const customersTable = createMaybeSingleTable({ id: "customer-1" });
    const jobsTable = createMaybeSingleTable({ id: "job-1", customer_id: "customer-1" });
    const actorEmployeeTable = createActorEmployeeTable();

    const estimatesInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "estimate-1" },
          error: null,
        }),
      })),
    }));
    const lineItemsInsert = vi.fn().mockResolvedValue({ error: null });
    const auditInsert = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "customers") return customersTable;
      if (table === "jobs") return jobsTable;
      if (table === "employees") return actorEmployeeTable;
      if (table === "estimates") return { insert: estimatesInsert };
      if (table === "estimate_line_items") return { insert: lineItemsInsert };
      if (table === "audit_logs") return { insert: auditInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createEstimate({
      customerId: "customer-1",
      jobId: "job-1",
      title: "  South Pad Demo and Re-Pour  ",
      status: "sent",
      notes: "  Includes pump truck.  ",
      lineItems: [
        { itemType: "labor", description: "  Crew labor  ", quantity: 3, unit: " hrs ", unitCost: 125.5 },
        { itemType: "material", description: "   ", quantity: 5, unit: "ea", unitCost: 10 },
        { itemType: "equipment", description: " Pump truck ", quantity: 1.5, unit: " day ", unitCost: 400 },
      ],
    });

    expect(result).toEqual({ data: { id: "estimate-1" } });
    expect(estimatesInsert).toHaveBeenCalledWith({
      company_id: "company-1",
      customer_id: "customer-1",
      job_id: "job-1",
      created_by_user_id: "user-1",
      title: "South Pad Demo and Re-Pour",
      status: "sent",
      notes: "Includes pump truck.",
      subtotal: 976.5,
    });
    expect(lineItemsInsert).toHaveBeenCalledWith([
      {
        company_id: "company-1",
        estimate_id: "estimate-1",
        item_type: "labor",
        description: "Crew labor",
        quantity: 3,
        unit: "hrs",
        unit_cost: 125.5,
        line_total: 376.5,
      },
      {
        company_id: "company-1",
        estimate_id: "estimate-1",
        item_type: "equipment",
        description: "Pump truck",
        quantity: 1.5,
        unit: "day",
        unit_cost: 400,
        line_total: 600,
      },
    ]);
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        company_id: "company-1",
        actor_user_id: "user-1",
        actor_employee_id: "employee-actor",
        action_type: "estimate.created",
        target_table: "estimates",
        target_id: "estimate-1",
      }),
    );
  });

  it("updates an estimate, replaces line items, and allows clearing the linked job", async () => {
    const usersTable = createAppUserTable();
    const customersTable = createMaybeSingleTable({ id: "customer-1" });
    const actorEmployeeTable = createActorEmployeeTable();
    const jobsSelect = vi.fn();

    const estimatesUpdateBuilder = {
      eq: vi.fn(),
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "estimate-1" },
          error: null,
        }),
      })),
    };
    estimatesUpdateBuilder.eq.mockReturnValue(estimatesUpdateBuilder);
    const estimatesUpdate = vi.fn(() => estimatesUpdateBuilder);

    const deleteLineItemsBuilder = {
      eq: vi.fn(),
      error: null,
    };
    deleteLineItemsBuilder.eq.mockReturnValue(deleteLineItemsBuilder);
    const deleteLineItems = vi.fn(() => deleteLineItemsBuilder);

    const lineItemsInsert = vi.fn().mockResolvedValue({ error: null });
    const auditInsert = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "customers") return customersTable;
      if (table === "jobs") return { select: jobsSelect };
      if (table === "employees") return actorEmployeeTable;
      if (table === "estimates") return { update: estimatesUpdate };
      if (table === "estimate_line_items") return { delete: deleteLineItems, insert: lineItemsInsert };
      if (table === "audit_logs") return { insert: auditInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await updateEstimate("estimate-1", {
      customerId: "customer-1",
      title: "  Revised Estimate  ",
      status: "approved",
      notes: "   ",
      lineItems: [
        { itemType: "material", description: " Reinforcing steel ", quantity: 2, unit: " tons ", unitCost: 900 },
      ],
    });

    expect(result).toEqual({ data: { id: "estimate-1" } });
    expect(jobsSelect).not.toHaveBeenCalled();
    expect(estimatesUpdate).toHaveBeenCalledWith({
      customer_id: "customer-1",
      job_id: null,
      title: "Revised Estimate",
      status: "approved",
      notes: null,
      subtotal: 1800,
    });
    expect(deleteLineItems).toHaveBeenCalledOnce();
    expect(lineItemsInsert).toHaveBeenCalledWith([
      {
        company_id: "company-1",
        estimate_id: "estimate-1",
        item_type: "material",
        description: "Reinforcing steel",
        quantity: 2,
        unit: "tons",
        unit_cost: 900,
        line_total: 1800,
      },
    ]);
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        action_type: "estimate.updated",
        target_id: "estimate-1",
      }),
    );
  });
});
