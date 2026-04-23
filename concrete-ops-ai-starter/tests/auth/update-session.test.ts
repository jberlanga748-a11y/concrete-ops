import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getEnv: vi.fn(),
  createServerClient: vi.fn(),
  resolveAppUser: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getEnv: mocks.getEnv,
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient,
}));

vi.mock("@/lib/auth/app-user", () => ({
  getProfileNotReadyRedirectPath: vi.fn((nextPath?: string) => {
    const searchParams = new URLSearchParams({ error: "profile_not_ready" });

    if (nextPath) {
      searchParams.set("next", nextPath);
    }

    return `/login?${searchParams.toString()}`;
  }),
  resolveAppUser: mocks.resolveAppUser,
}));

vi.mock("@/lib/auth/roles", () => ({
  adminRoles: ["owner", "office_admin", "foreman"],
  getRoleHomePath: vi.fn((role?: string | null) => {
    if (role === "foreman") return "/dashboard/foreman";
    if (role === "owner" || role === "office_admin") return "/dashboard";
    return "/employee";
  }),
}));

import { updateSession } from "@/utils/supabase/middleware";

describe("updateSession", () => {
  const getUser = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getEnv.mockReturnValue({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    });
    mocks.createServerClient.mockReturnValue({
      auth: {
        getUser,
      },
    });
    getUser.mockResolvedValue({
      data: {
        user: {
          id: "auth-user-1",
          email: "demo.owner@concreteops.example",
        },
      },
    });
  });

  it("redirects protected routes to a stable login error when the auth user is not linked", async () => {
    mocks.resolveAppUser.mockResolvedValue({ appUser: null, error: null });

    const request = new NextRequest("http://localhost/employee");
    const response = await updateSession(request);

    expect(response.headers.get("location")).toBe("http://localhost/login?error=profile_not_ready&next=%2Femployee");
  });

  it("does not redirect login back into the employee portal when the auth user is not linked", async () => {
    mocks.resolveAppUser.mockResolvedValue({ appUser: null, error: null });

    const request = new NextRequest("http://localhost/login");
    const response = await updateSession(request);

    expect(response.headers.get("location")).toBeNull();
  });
});
