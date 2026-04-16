import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildDbSeed } from "../fixtures/databaseSeed";
import { createSupabaseMock, getLatestBuilder } from "../helpers/supabaseMock";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { POST } from "@/app/api/uploads/route";

const mockedCreateClient = vi.mocked(createClient);

function buildRequest(fields?: {
  jobId?: string;
  dailyReportId?: string;
  tag?: string;
  note?: string;
  file?: File | string | null;
}) {
  const formData = new FormData();
  if (fields?.jobId !== undefined) formData.set("jobId", fields.jobId);
  if (fields?.dailyReportId !== undefined) formData.set("dailyReportId", fields.dailyReportId);
  if (fields?.tag !== undefined) formData.set("tag", fields.tag);
  if (fields?.note !== undefined) formData.set("note", fields.note);
  if (fields?.file !== undefined && fields.file !== null) {
    if (fields.file instanceof File) {
      formData.set("file", fields.file);
    } else {
      formData.set("file", fields.file);
    }
  }

  return new Request("http://localhost/api/uploads", {
    method: "POST",
    body: formData,
  });
}

describe("app/api/uploads/route.ts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-16T18:00:00.000Z"));
    mockedCreateClient.mockReset();
  });

  it("rejects unauthenticated upload requests", async () => {
    const supabase = createSupabaseMock({
      authUserResult: { data: { user: null }, error: null },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    const response = await POST(buildRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("validates required job, tag, and file fields", async () => {
    const supabase = createSupabaseMock();
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    const response = await POST(buildRequest({ jobId: "job-1", tag: "", file: null }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Job, tag, and file are required." });
  });

  it("returns an error when the app user cannot be resolved", async () => {
    const supabase = createSupabaseMock({
      tables: {
        users: {
          select: {
            singleResult: { data: null, error: { message: "no app user" } },
          },
        },
      },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    const response = await POST(
      buildRequest({
        jobId: "job-1",
        tag: "progress",
        file: new File(["progress"], "Progress Photo.JPG", { type: "image/jpeg" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Could not resolve app user." });
  });

  it("returns the storage upload error without inserting a job file", async () => {
    const seed = buildDbSeed();
    const supabase = createSupabaseMock({
      tables: {
        users: {
          select: { singleResult: { data: seed.appUser, error: null } },
        },
        employees: {
          select: { maybeSingleResult: { data: seed.employee, error: null } },
        },
      },
      storage: {
        uploadResult: { error: { message: "upload failed" } },
      },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    const response = await POST(
      buildRequest({
        jobId: "job-1",
        tag: "progress",
        file: new File(["progress"], "Progress Photo.JPG", { type: "image/jpeg" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "upload failed" });
    expect(supabase.builders.job_files).toBeUndefined();
  });

  it("rolls back the storage object when the metadata insert fails", async () => {
    const seed = buildDbSeed();
    const supabase = createSupabaseMock({
      tables: {
        users: {
          select: { singleResult: { data: seed.appUser, error: null } },
        },
        employees: {
          select: { maybeSingleResult: { data: seed.employee, error: null } },
        },
        job_files: {
          insert: {
            awaitResult: { data: null, error: { message: "insert failed" } },
          },
        },
      },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    const response = await POST(
      buildRequest({
        jobId: "job-1",
        dailyReportId: "daily-report-1",
        tag: "progress",
        note: "Fresh pour photo",
        file: new File(["progress"], "Progress Photo.JPG", { type: "image/jpeg" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "insert failed" });
    expect(supabase.storageRemove).toHaveBeenCalledWith(["company-1/job-1/1776362400000-progress-photo.jpg"]);
  });

  it("uploads the file, sanitizes the storage path, and stores job file metadata", async () => {
    const seed = buildDbSeed();
    const supabase = createSupabaseMock({
      tables: {
        users: {
          select: { singleResult: { data: seed.appUser, error: null } },
        },
        employees: {
          select: { maybeSingleResult: { data: seed.employee, error: null } },
        },
        job_files: {
          insert: {
            awaitResult: { data: null, error: null },
          },
        },
      },
    });
    mockedCreateClient.mockResolvedValue(supabase.client as never);

    const response = await POST(
      buildRequest({
        jobId: "job-1",
        dailyReportId: "daily-report-1",
        tag: "progress",
        note: " Fresh pour photo ",
        file: new File(["progress"], "Progress Photo.JPG", { type: "image/jpeg" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(supabase.storageUpload).toHaveBeenCalledWith(
      "company-1/job-1/1776362400000-progress-photo.jpg",
      expect.any(Buffer),
      { contentType: "image/jpeg", upsert: false },
    );

    const builder = getLatestBuilder(supabase.builders, "job_files");
    expect(builder.calls[0]).toEqual({
      method: "insert",
      args: [
        {
          company_id: "company-1",
          job_id: "job-1",
          daily_report_id: "daily-report-1",
          uploaded_by_user_id: "app-user-1",
          uploaded_by_employee_id: "employee-1",
          file_name: "Progress Photo.JPG",
          file_type: "image/jpeg",
          storage_path: "company-1/job-1/1776362400000-progress-photo.jpg",
          tag: "progress",
          note: "Fresh pour photo",
        },
      ],
    });
  });
});
