import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { createCustomer, createEmployee, updateCustomer, updateEmployee } from "@/lib/db/mutations";

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

describe("customer and employee mutations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects employee creation for non-office roles", async () => {
    const usersTable = createAppUserTable("foreman");
    const employeesInsert = vi.fn();

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "employees") return { insert: employeesInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createEmployee({
      fullName: "Maria Santos",
      isActive: true,
    });

    expect(result).toEqual({ error: "Only owner and office admin users can manage employees." });
    expect(employeesInsert).not.toHaveBeenCalled();
  });

  it("creates an employee with trimmed optional fields", async () => {
    const usersTable = createAppUserTable();
    const employeesInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "employee-1" },
          error: null,
        }),
      })),
    }));

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "employees") return { insert: employeesInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createEmployee({
      fullName: "  Maria Santos  ",
      phone: " 555-0100 ",
      email: " maria@example.com ",
      crewName: " Crew A ",
      jobTitle: " Finisher ",
      hireDate: "2026-04-01",
      isActive: true,
    });

    expect(result).toEqual({ data: { id: "employee-1" } });
    expect(employeesInsert).toHaveBeenCalledWith({
      company_id: "company-1",
      full_name: "Maria Santos",
      phone: "555-0100",
      email: "maria@example.com",
      crew_name: "Crew A",
      job_title: "Finisher",
      hire_date: "2026-04-01",
      is_active: true,
    });
  });

  it("updates an employee with trimmed values and company scoping", async () => {
    const usersTable = createAppUserTable("owner");
    const employeesUpdateBuilder = {
      eq: vi.fn(),
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "employee-1" },
          error: null,
        }),
      })),
    };
    employeesUpdateBuilder.eq.mockReturnValue(employeesUpdateBuilder);
    const employeesUpdate = vi.fn(() => employeesUpdateBuilder);

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "employees") return { update: employeesUpdate };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await updateEmployee("employee-1", {
      fullName: "  Maria Santos  ",
      phone: "   ",
      email: " maria@example.com ",
      crewName: " Crew B ",
      jobTitle: " Lead Finisher ",
      hireDate: "",
      isActive: false,
    });

    expect(result).toEqual({ data: { id: "employee-1" } });
    expect(employeesUpdate).toHaveBeenCalledWith({
      full_name: "Maria Santos",
      phone: null,
      email: "maria@example.com",
      crew_name: "Crew B",
      job_title: "Lead Finisher",
      hire_date: null,
      is_active: false,
    });
  });

  it("rejects customer creation for non-office roles", async () => {
    const usersTable = createAppUserTable("employee");
    const customersInsert = vi.fn();

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "customers") return { insert: customersInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createCustomer({
      name: "Northshore Properties",
      status: "active",
    });

    expect(result).toEqual({ error: "Only owner and office admin users can manage customers." });
    expect(customersInsert).not.toHaveBeenCalled();
  });

  it("creates a customer with trimmed optional fields", async () => {
    const usersTable = createAppUserTable();
    const customersInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "customer-1" },
          error: null,
        }),
      })),
    }));

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "customers") return { insert: customersInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createCustomer({
      name: "  Northshore Properties  ",
      contactName: "  Dana Reed ",
      email: " billing@example.com ",
      phone: " 555-0199 ",
      billingAddress: " 123 Main St ",
      notes: " Priority account ",
      status: "active",
    });

    expect(result).toEqual({ data: { id: "customer-1" } });
    expect(customersInsert).toHaveBeenCalledWith({
      company_id: "company-1",
      name: "Northshore Properties",
      contact_name: "Dana Reed",
      email: "billing@example.com",
      phone: "555-0199",
      billing_address: "123 Main St",
      notes: "Priority account",
      status: "active",
    });
  });

  it("updates a customer with trimmed values and company scoping", async () => {
    const usersTable = createAppUserTable("owner");
    const customersUpdateBuilder = {
      eq: vi.fn(),
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "customer-1" },
          error: null,
        }),
      })),
    };
    customersUpdateBuilder.eq.mockReturnValue(customersUpdateBuilder);
    const customersUpdate = vi.fn(() => customersUpdateBuilder);

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "customers") return { update: customersUpdate };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await updateCustomer("customer-1", {
      name: "  Northshore Properties  ",
      contactName: "  ",
      email: " ops@example.com ",
      phone: "  ",
      billingAddress: " 456 Center Ave ",
      notes: "  ",
      status: "inactive",
    });

    expect(result).toEqual({ data: { id: "customer-1" } });
    expect(customersUpdate).toHaveBeenCalledWith({
      name: "Northshore Properties",
      contact_name: null,
      email: "ops@example.com",
      phone: null,
      billing_address: "456 Center Ave",
      notes: null,
      status: "inactive",
    });
  });
});
