import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as dailyReportCleanupPost } from "@/app/api/ai/daily-report-cleanup/route";
import { POST as changeOrderRewritePost } from "@/app/api/ai/change-order-rewrite/route";
import { POST as proposalScopePost } from "@/app/api/ai/proposal-scope/route";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("assistant routes basic error handling", () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_MODEL = "test-model";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
    process.env.OPENAI_API_KEY = originalApiKey;
  });

  it("returns 502 for malformed JSON model output on daily report cleanup", async () => {
    global.fetch = vi.fn(async () =>
      jsonResponse({
        output_text: "this is not json",
      }),
    ) as typeof fetch;

    const request = new NextRequest("http://localhost/api/ai/daily-report-cleanup", {
      method: "POST",
      body: JSON.stringify({
        workCompleted: "Completed slab prep and formed curb line at east side.",
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await dailyReportCleanupPost(request);
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({ error: "AI returned an invalid JSON response." });
  });

  it("returns 400 for invalid change order payload", async () => {
    const request = new NextRequest("http://localhost/api/ai/change-order-rewrite", {
      method: "POST",
      body: JSON.stringify({
        description: "too short",
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await changeOrderRewritePost(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid request payload.");
  });

  it("returns OpenAI error message on proposal scope upstream failure", async () => {
    global.fetch = vi.fn(async () =>
      jsonResponse(
        {
          error: {
            message: "rate limit exceeded",
          },
        },
        429,
      ),
    ) as typeof fetch;

    const request = new NextRequest("http://localhost/api/ai/proposal-scope", {
      method: "POST",
      body: JSON.stringify({
        roughScopeText: "Sawcut and remove existing damaged concrete at loading dock apron.",
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await proposalScopePost(request);
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({ error: "rate limit exceeded" });
  });
});
