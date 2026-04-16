import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { POST as adminOpsCopilotPost } from "@/app/api/ai/admin-ops-copilot/route";

type QueryResult = { data: unknown; error: unknown };

function makeFluentQuery(result: QueryResult) {
  const chain = {
    eq: () => chain,
    order: () => chain,
    limit: async () => result,
    maybeSingle: async () => result,
  };
  return {
    select: () => chain,
  };
}

function mockSupabaseClient(options?: {
  jobsError?: unknown;
  reportsError?: unknown;
  uploadsError?: unknown;
  changeOrdersError?: unknown;
}) {
  const client = {
    auth: {
      getUser: async () => ({
        data: { user: { id: "auth-user-1" } },
        error: null,
      }),
    },
    from: (table: string) => {
      if (table === "users") {
        return makeFluentQuery({
          data: {
            id: "user-1",
            company_id: "company-1",
            role: "owner",
          },
          error: null,
        });
      }

      if (table === "jobs") {
        return makeFluentQuery({
          data: [
            {
              id: "job-1",
              job_number: "J-100",
              name: "Warehouse Slab",
              status: "in_progress",
              start_date: "2026-04-10",
              target_finish_date: "2026-04-28",
              created_at: "2026-04-10T10:00:00.000Z",
            },
          ],
          error: options?.jobsError ?? null,
        });
      }

      if (table === "daily_reports") {
        return makeFluentQuery({
          data: [
            {
              id: "report-1",
              job_id: "job-1",
              report_date: "2026-04-14",
              work_completed: "Placed and finished 1200 SF slab section.",
              delays_issues: null,
              materials_deliveries: "Rebar delivered.",
              safety_notes: "No incidents reported.",
              created_at: "2026-04-14T17:00:00.000Z",
              jobs: { job_number: "J-100", name: "Warehouse Slab" },
            },
          ],
          error: options?.reportsError ?? null,
        });
      }

      if (table === "job_files") {
        return makeFluentQuery({
          data: [
            {
              id: "upload-1",
              job_id: "job-1",
              daily_report_id: "report-1",
              file_name: "progress-photo-1.jpg",
              tag: "progress",
              note: "Pour complete area A.",
              created_at: "2026-04-14T18:00:00.000Z",
              jobs: { job_number: "J-100", name: "Warehouse Slab" },
            },
          ],
          error: options?.uploadsError ?? null,
        });
      }

      if (table === "change_orders") {
        return makeFluentQuery({
          data: [
            {
              id: "co-1",
              job_id: "job-1",
              daily_report_id: "report-1",
              title: "Additional edge prep",
              description: "Extra edge grinding required at expansion joint.",
              status: "submitted",
              direct_cost_total: 1200,
              markup_percent: 15,
              total_amount: 1380,
              created_at: "2026-04-15T08:00:00.000Z",
              jobs: { job_number: "J-100", name: "Warehouse Slab" },
              daily_reports: { report_date: "2026-04-14" },
            },
          ],
          error: options?.changeOrdersError ?? null,
        });
      }

      throw new Error(`Unexpected table requested in test mock: ${table}`);
    },
  };

  return client;
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("admin ops copilot route safeguards", () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_MODEL = "test-model";
  });

  it("returns 502 when any grounded source query fails", async () => {
    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient({
      changeOrdersError: { message: "db unavailable" },
    }) as never);
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    const request = new NextRequest("http://localhost/api/ai/admin-ops-copilot", {
      method: "POST",
      body: JSON.stringify({
        question: "Which jobs have open change orders?",
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await adminOpsCopilotPost(request);
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toBe("Grounded data sources are unavailable. Admin Ops Copilot cannot answer safely right now.");
    expect(body.details.failedSources).toContain("change_orders");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns 502 when AI citations do not resolve to grounded snapshot records", async () => {
    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient() as never);
    global.fetch = vi.fn(async () =>
      jsonResponse({
        output_text: JSON.stringify({
          answer: "I found a matching job record.",
          confidence: "high",
          citations: [
            {
              entityType: "job",
              id: "job-does-not-exist",
              label: "Unknown",
              reason: "Referenced by model output.",
            },
          ],
        }),
      }),
    ) as typeof fetch;

    const request = new NextRequest("http://localhost/api/ai/admin-ops-copilot", {
      method: "POST",
      body: JSON.stringify({
        question: "What changed this week on J-100?",
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await adminOpsCopilotPost(request);
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toBe("AI returned citations that do not resolve to grounded records.");
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.OPENAI_API_KEY = originalApiKey;
  });
});
