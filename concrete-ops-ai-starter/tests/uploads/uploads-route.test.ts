import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/uploads/employeeAccess", () => ({
  getEmployeeUploadAccessFromClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { getEmployeeUploadAccessFromClient } from "@/lib/uploads/employeeAccess";
import { POST as uploadsPost } from "@/app/api/uploads/route";

function buildFormData(overrides?: { jobId?: string; dailyReportId?: string }) {
  const formData = new FormData();
  formData.set("jobId", overrides?.jobId ?? "job-123");
  formData.set("dailyReportId", overrides?.dailyReportId ?? "");
  formData.set("tag", "progress");
  formData.set("note", "Fresh pour progress");
  formData.set("file", new File(["hello"], "photo.png", { type: "image/png" }));
  return formData;
}

describe("/api/uploads", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects uploads for jobs outside the employee assignment scope", async () => {
    const upload = vi.fn();
    const remove = vi.fn();
    const from = vi.fn();

    vi.mocked(createClient).mockResolvedValue({
      storage: {
        from: vi.fn(() => ({ upload, remove })),
      },
      from,
    } as never);

    vi.mocked(getEmployeeUploadAccessFromClient).mockResolvedValue({
      data: {
        appUserId: "user-1",
        companyId: "company-1",
        role: "employee",
        employeeId: "employee-1",
        assignedJobIds: ["job-allowed"],
      },
    });

    const response = await uploadsPost(
      new Request("http://localhost/api/uploads", {
        method: "POST",
        body: buildFormData(),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "You can only upload to jobs assigned to you." });
    expect(upload).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it("creates job file, document, and document links for an assigned upload", async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const remove = vi.fn();
    const jobFilesInsert = vi.fn().mockResolvedValue({ error: null });
    const documentsInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: { id: "document-1" }, error: null }),
      })),
    }));
    const documentLinksInsert = vi.fn().mockResolvedValue({ error: null });

    const jobFilesSelectBuilder = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "job-file-1" }, error: null }),
    };
    const dailyReportsBuilder = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: "report-1" }, error: null }),
    };

    const from = vi.fn((table: string) => {
      if (table === "daily_reports") {
        return {
          select: vi.fn(() => dailyReportsBuilder),
        };
      }

      if (table === "job_files") {
        return {
          insert: jobFilesInsert,
          select: vi.fn(() => jobFilesSelectBuilder),
        };
      }

      if (table === "documents") {
        return {
          insert: documentsInsert,
        };
      }

      if (table === "document_links") {
        return {
          insert: documentLinksInsert,
        };
      }

      return {
        delete: vi.fn(() => ({
          eq: vi.fn().mockReturnThis(),
        })),
      };
    });

    vi.mocked(createClient).mockResolvedValue({
      storage: {
        from: vi.fn(() => ({ upload, remove })),
      },
      from,
    } as never);

    vi.mocked(getEmployeeUploadAccessFromClient).mockResolvedValue({
      data: {
        appUserId: "user-1",
        companyId: "company-1",
        role: "employee",
        employeeId: "employee-1",
        assignedJobIds: ["job-123"],
      },
    });

    const response = await uploadsPost(
      new Request("http://localhost/api/uploads", {
        method: "POST",
        body: buildFormData({ dailyReportId: "report-1" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(upload).toHaveBeenCalledOnce();
    expect(jobFilesInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        company_id: "company-1",
        job_id: "job-123",
        uploaded_by_user_id: "user-1",
        uploaded_by_employee_id: "employee-1",
      }),
    );
    expect(documentsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        company_id: "company-1",
        source_job_file_id: "job-file-1",
        job_id: "job-123",
        daily_report_id: "report-1",
      }),
    );
    expect(documentLinksInsert).toHaveBeenCalledWith([
      {
        company_id: "company-1",
        document_id: "document-1",
        link_type: "job",
        linked_record_id: "job-123",
      },
      {
        company_id: "company-1",
        document_id: "document-1",
        link_type: "daily_report",
        linked_record_id: "report-1",
      },
    ]);
    expect(remove).not.toHaveBeenCalled();
  });
});
