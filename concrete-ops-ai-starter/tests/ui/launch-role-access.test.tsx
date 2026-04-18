import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
}));

const redirectMock = vi.hoisted(() =>
  vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
);

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("@/components/layout/AppShell", () => ({
  AppShell: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("@/components/layout/EmployeeShell", () => ({
  EmployeeShell: ({ children }: { children: ReactNode }) => children,
}));

import DashboardLayout from "@/app/dashboard/layout";
import EmployeeLayout from "@/app/employee/layout";

function buildRoleClient(role: "owner" | "office_admin" | "foreman" | "employee") {
  const usersBuilder = {
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: { role },
      error: null,
    }),
  };
  usersBuilder.eq.mockReturnValue(usersBuilder);

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "auth-user-1" } },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => usersBuilder),
    })),
  } as never;
}

describe("launch role access boundaries", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects employee users away from the admin dashboard shell", async () => {
    mockCreateClient.mockResolvedValue(buildRoleClient("employee"));

    await expect(DashboardLayout({ children: <div>dashboard child</div> })).rejects.toThrow("NEXT_REDIRECT:/employee");
    expect(redirectMock).toHaveBeenCalledWith("/employee");
  });

  it("redirects office users away from the employee portal shell", async () => {
    mockCreateClient.mockResolvedValue(buildRoleClient("office_admin"));

    await expect(EmployeeLayout({ children: <div>employee child</div> })).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });

  it("redirects foremen away from the employee portal shell", async () => {
    mockCreateClient.mockResolvedValue(buildRoleClient("foreman"));

    await expect(EmployeeLayout({ children: <div>employee child</div> })).rejects.toThrow("NEXT_REDIRECT:/dashboard/foreman");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard/foreman");
  });
});
