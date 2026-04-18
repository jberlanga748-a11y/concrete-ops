import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/exports/recordDocuments", () => ({
  buildExportPdf: vi.fn(),
}));

vi.mock("@/lib/email/sendRecordEmail", () => ({
  sendRecordEmail: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { buildExportPdf } from "@/lib/exports/recordDocuments";
import { sendRecordEmail } from "@/lib/email/sendRecordEmail";
import { POST as recordEmailsPost } from "@/app/api/record-emails/route";

function buildRequest(overrides?: Partial<{
  recordType: "proposal" | "change_order" | "daily_report";
  recordId: string;
  to: string;
  subject: string;
}>) {
  return new Request("http://localhost/api/record-emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recordType: overrides?.recordType ?? "proposal",
      recordId: overrides?.recordId ?? "11111111-1111-4111-8111-111111111111",
      to: overrides?.to ?? "client@example.com",
      subject: overrides?.subject ?? "Proposal PDF",
    }),
  });
}

describe("/api/record-emails", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("requires an authenticated user", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    } as never);

    const response = await recordEmailsPost(buildRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
    expect(buildExportPdf).not.toHaveBeenCalled();
    expect(sendRecordEmail).not.toHaveBeenCalled();
  });

  it("returns 404 when the requested export record does not exist", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "auth-user-1" } },
        }),
      },
    } as never);
    vi.mocked(buildExportPdf).mockResolvedValue(null);

    const response = await recordEmailsPost(buildRequest());
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "Record not found." });
    expect(sendRecordEmail).not.toHaveBeenCalled();
  });

  it("returns the delivery error when email sending fails", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "auth-user-1" } },
        }),
      },
    } as never);
    vi.mocked(buildExportPdf).mockResolvedValue({
      fileName: "proposal.pdf",
      pdf: Buffer.from("pdf"),
      title: "Proposal",
      subject: "Proposal PDF",
      defaultTo: "client@example.com",
      lines: ["Line 1"],
    });
    vi.mocked(sendRecordEmail).mockResolvedValue({ error: "SMTP unavailable" });

    const response = await recordEmailsPost(buildRequest());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "SMTP unavailable" });
  });

  it("sends the generated PDF when delivery succeeds", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "auth-user-1" } },
        }),
      },
    } as never);
    vi.mocked(buildExportPdf).mockResolvedValue({
      fileName: "proposal.pdf",
      pdf: Buffer.from("pdf"),
      title: "Proposal",
      subject: "Proposal PDF",
      defaultTo: "client@example.com",
      lines: ["Line 1"],
    });
    vi.mocked(sendRecordEmail).mockResolvedValue({ data: true });

    const response = await recordEmailsPost(buildRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(sendRecordEmail).toHaveBeenCalledWith({
      to: "client@example.com",
      subject: "Proposal PDF",
      fileName: "proposal.pdf",
      pdf: Buffer.from("pdf"),
      recordType: "proposal",
    });
  });
});
