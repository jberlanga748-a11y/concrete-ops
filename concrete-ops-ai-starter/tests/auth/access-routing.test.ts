import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const redirectMock = vi.hoisted(() =>
  vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
);

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import { createClient } from "@/lib/supabase/server";
import { requireForemanUser, requireOfficeUser } from "@/lib/auth/server";

function buildClient({
  authUserId,
  appUser,
}: {
  authUserId: string | null;
  appUser: { id: string; company_id: string; role: "owner" | "office_admin" | "foreman" | "employee"; email: string; full_name: string } | null;
}) {
  const usersBuilder = {
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: appUser, error: null }),
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: authUserId ? { id: authUserId } : null },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => usersBuilder),
    })),
  } as never;
}

describe("auth access routing", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("sends unauthenticated office routes back through the same office destination", async () => {
    vi.mocked(createClient).mockResolvedValue(
      buildClient({
        authUserId: null,
        appUser: null,
      }),
    );

    await expect(requireOfficeUser("/dashboard/audit-logs")).rejects.toThrow(
      "NEXT_REDIRECT:/login?next=/dashboard/audit-logs",
    );
    expect(redirectMock).toHaveBeenCalledWith("/login?next=/dashboard/audit-logs");
  });

  it("keeps foremen out of office-only routes by returning them to the foreman home", async () => {
    vi.mocked(createClient).mockResolvedValue(
      buildClient({
        authUserId: "auth-user-1",
        appUser: {
          id: "user-1",
          company_id: "company-1",
          role: "foreman",
          email: "foreman@example.com",
          full_name: "Foreman User",
        },
      }),
    );

    await expect(requireOfficeUser("/dashboard/approvals")).rejects.toThrow("NEXT_REDIRECT:/dashboard/foreman");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard/foreman");
  });

  it("keeps office users out of the foreman-only landing", async () => {
    vi.mocked(createClient).mockResolvedValue(
      buildClient({
        authUserId: "auth-user-1",
        appUser: {
          id: "user-1",
          company_id: "company-1",
          role: "office_admin",
          email: "ops@example.com",
          full_name: "Office User",
        },
      }),
    );

    await expect(requireForemanUser()).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });
});
