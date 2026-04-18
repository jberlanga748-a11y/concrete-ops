import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { GET as authCallbackGet } from "@/app/auth/callback/route";

function encodeCookieValue(value: string) {
  return `base64-${Buffer.from(value, "utf8").toString("base64url")}`;
}

describe("auth callback route", () => {
  const exchangeCodeForSession = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    exchangeCodeForSession.mockReset();
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        exchangeCodeForSession,
      },
    } as never);
  });

  it("sends generic code exchanges to login when no recovery signal is present", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const request = new NextRequest("http://localhost/auth/callback?code=signup-code");
    const response = await authCallbackGet(request);

    expect(exchangeCodeForSession).toHaveBeenCalledWith("signup-code");
    expect(response.headers.get("location")).toBe("http://localhost/login");
  });

  it("routes recovery callbacks to reset-password when type=recovery is present", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const request = new NextRequest("http://localhost/auth/callback?code=recovery-code&type=recovery");
    const response = await authCallbackGet(request);

    expect(response.headers.get("location")).toBe("http://localhost/reset-password");
  });

  it("routes PKCE recovery callbacks to reset-password when the recovery marker is stored in cookies", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const request = new NextRequest("http://localhost/auth/callback?code=recovery-code", {
      headers: {
        cookie: `sb-project-auth-token-code-verifier=${encodeCookieValue("pkce-verifier/PASSWORD_RECOVERY")}`,
      },
    });
    const response = await authCallbackGet(request);

    expect(response.headers.get("location")).toBe("http://localhost/reset-password");
  });

  it("keeps generic callback failures on login instead of forgot-password", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: { message: "expired" } });

    const request = new NextRequest("http://localhost/auth/callback?code=generic-code");
    const response = await authCallbackGet(request);

    expect(response.headers.get("location")).toBe("http://localhost/login");
  });
});
