// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
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

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
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
    cleanup();
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

  it("shows an explicit dashboard access error when the app-user lookup fails", async () => {
    const usersBuilder = {
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: new Error("boom"),
      }),
    };
    usersBuilder.eq.mockReturnValue(usersBuilder);

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "auth-user-1" } },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => usersBuilder),
      })),
    } as never);

    render(await DashboardLayout({ children: <div>dashboard child</div> }));

    expect(screen.getByText("We couldn’t verify dashboard access right now")).toBeInTheDocument();
    expect(screen.getByText("Your session is still signed in, but the dashboard shell couldn’t confirm your app profile. Try refreshing the page or come back in a moment.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Try again" })).toHaveAttribute("href", "/dashboard");
  });

  it("shows an explicit employee portal access error when the app-user lookup fails", async () => {
    const usersBuilder = {
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: new Error("boom"),
      }),
    };
    usersBuilder.eq.mockReturnValue(usersBuilder);

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "auth-user-1" } },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => usersBuilder),
      })),
    } as never);

    render(await EmployeeLayout({ children: <div>employee child</div> }));

    expect(screen.getByText("We couldn’t verify employee portal access right now")).toBeInTheDocument();
    expect(screen.getByText("Your session is still signed in, but the employee portal couldn’t confirm your app profile. Try refreshing the page or come back in a moment.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Try again" })).toHaveAttribute("href", "/employee");
  });
});
