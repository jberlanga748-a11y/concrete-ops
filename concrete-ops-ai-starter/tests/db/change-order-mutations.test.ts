import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { createChangeOrder } from "@/lib/db/mutations";

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

function createUsersTable(role: "owner" | "office_admin" | "employee" = "office_admin", recipientIds: string[] = ["office-1"]) {
  const appUserBuilder: {
    eq: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
  } = {
    eq: vi.fn(),
    single: vi.fn().mockResolvedValue({
      data: { id: "user-1", company_id: "company-1", role },
      error: null,
    }),
  };
  appUserBuilder.eq.mockReturnValue(appUserBuilder);

  const recipientsBuilder: {
    eq: ReturnType<typeof vi.fn>;
    in: ReturnType<typeof vi.fn>;
  } = {
    eq: vi.fn(),
    in: vi.fn().mockResolvedValue({
      data: recipientIds.map((id) => ({ id })),
      error: null,
    }),
  };
  recipientsBuilder.eq.mockReturnValue(recipientsBuilder);

  return {
    select: vi.fn((columns: string) => (columns.includes("company_id") ? appUserBuilder : recipientsBuilder)),
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
    maybeSingle: ReturnType<typeof vi.fn>;
  } = {
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({
      data,
      error: null,
    }),
  };
  builder.eq.mockReturnValue(builder);
  return builder;
}

describe("createChangeOrder", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects a daily report that is not linked to the selected job", async () => {
    const usersTable = createUsersTable();
    const dailyReportBuilder = createMaybeSingleBuilder(null);
    const changeOrdersInsert = vi.fn();

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "daily_reports") return { select: vi.fn(() => dailyReportBuilder) };
      if (table === "change_orders") return { insert: changeOrdersInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createChangeOrder({
      jobId: "job-1",
      dailyReportId: "report-1",
      title: "Extra slab prep",
      description: "Additional edge work",
      status: "draft",
      directCostTotal: 100,
      markupPercent: 10,
      totalAmount: 110,
      proofFileIds: [],
    });

    expect(result).toEqual({ error: "Selected daily report is not available for this change order." });
    expect(changeOrdersInsert).not.toHaveBeenCalled();
  });

  it("rejects proof files that do not belong to the selected job", async () => {
    const usersTable = createUsersTable();
    const jobFilesSelectBuilder = {
      eq: vi.fn(),
      in: vi.fn().mockResolvedValue({
        data: [{ id: "file-1", job_id: "job-2" }],
        error: null,
      }),
    };
    jobFilesSelectBuilder.eq.mockReturnValue(jobFilesSelectBuilder);
    const changeOrdersInsert = vi.fn();

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "job_files") return { select: vi.fn(() => jobFilesSelectBuilder) };
      if (table === "change_orders") return { insert: changeOrdersInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createChangeOrder({
      jobId: "job-1",
      title: "Extra slab prep",
      description: "Additional edge work",
      status: "draft",
      directCostTotal: 100,
      markupPercent: 10,
      totalAmount: 110,
      proofFileIds: ["file-1"],
    });

    expect(result).toEqual({ error: "Selected proof files must belong to the same job as the change order." });
    expect(changeOrdersInsert).not.toHaveBeenCalled();
  });

  it("creates a change order when the daily report and proof files match the selected job", async () => {
    const usersTable = createUsersTable("office_admin", ["office-1", "office-2"]);
    const employeesTable = createActorEmployeeTable();
    const dailyReportBuilder = createMaybeSingleBuilder({ id: "report-1" });
    const jobFilesValidationBuilder = {
      eq: vi.fn(),
      in: vi.fn().mockResolvedValue({
        data: [
          { id: "file-1", job_id: "job-1" },
          { id: "file-2", job_id: "job-1" },
        ],
        error: null,
      }),
    };
    jobFilesValidationBuilder.eq.mockReturnValue(jobFilesValidationBuilder);
    const changeOrdersInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "change-order-1" },
          error: null,
        }),
      })),
    }));
    const changeOrderFilesInsert = vi.fn().mockResolvedValue({ error: null });

    const documentSelectBuilder = {
      eq: vi.fn(),
      maybeSingle: vi.fn()
        .mockResolvedValueOnce({ data: { id: "document-1" }, error: null })
        .mockResolvedValueOnce({ data: { id: "document-2" }, error: null }),
    };
    documentSelectBuilder.eq.mockReturnValue(documentSelectBuilder);

    const documentLinksUpsert = vi.fn().mockResolvedValue({ error: null });
    const notificationsInsert = vi.fn().mockResolvedValue({ error: null });
    const auditInsert = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn((table: string) => {
      if (table === "users") return usersTable;
      if (table === "employees") return employeesTable;
      if (table === "daily_reports") return { select: vi.fn(() => dailyReportBuilder) };
      if (table === "job_files") return { select: vi.fn(() => jobFilesValidationBuilder) };
      if (table === "change_orders") return { insert: changeOrdersInsert };
      if (table === "change_order_files") return { insert: changeOrderFilesInsert };
      if (table === "documents") return { select: vi.fn(() => documentSelectBuilder) };
      if (table === "document_links") return { upsert: documentLinksUpsert };
      if (table === "notifications") return { insert: notificationsInsert };
      if (table === "audit_logs") return { insert: auditInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue(createAuthenticatedClient(from));

    const result = await createChangeOrder({
      jobId: "job-1",
      dailyReportId: "report-1",
      title: "Extra slab prep",
      description: "Additional edge work",
      status: "submitted",
      directCostTotal: 100,
      markupPercent: 10,
      totalAmount: 110,
      proofFileIds: ["file-1", "file-2", "file-1"],
    });

    expect(result).toEqual({ data: { id: "change-order-1" } });
    expect(changeOrdersInsert).toHaveBeenCalledWith({
      company_id: "company-1",
      job_id: "job-1",
      daily_report_id: "report-1",
      title: "Extra slab prep",
      description: "Additional edge work",
      status: "submitted",
      direct_cost_total: 100,
      markup_percent: 10,
      total_amount: 110,
      created_by_user_id: "user-1",
    });
    expect(changeOrderFilesInsert).toHaveBeenCalledWith([
      {
        company_id: "company-1",
        change_order_id: "change-order-1",
        job_file_id: "file-1",
      },
      {
        company_id: "company-1",
        change_order_id: "change-order-1",
        job_file_id: "file-2",
      },
    ]);
    expect(documentLinksUpsert).toHaveBeenCalledTimes(2);
    expect(notificationsInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          company_id: "company-1",
          user_id: "office-1",
          related_id: "change-order-1",
        }),
        expect.objectContaining({
          company_id: "company-1",
          user_id: "office-2",
          related_id: "change-order-1",
        }),
      ]),
    );
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        action_type: "change_order.created",
        target_id: "change-order-1",
      }),
    );
  });
});
