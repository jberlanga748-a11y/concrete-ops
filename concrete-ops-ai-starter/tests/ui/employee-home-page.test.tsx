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

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

import EmployeeHomePage from "@/app/employee/page";

function buildMaybeSingleBuilder<T>(result: { data: T | null; error: Error | null }) {
  const builder = {
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  builder.eq.mockReturnValue(builder);
  return builder;
}

function buildTimeEntryBuilder(result: { data: unknown; error: Error | null }) {
  const builder = {
    eq: vi.fn(),
    is: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  builder.eq.mockReturnValue(builder);
  builder.is.mockReturnValue(builder);
  builder.in.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.limit.mockReturnValue(builder);
  return builder;
}

function buildJobFilesBuilder(result: { data: unknown; error: Error | null }) {
  const builder = {
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn().mockResolvedValue(result),
  };
  builder.eq.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  return builder;
}

function buildClient({
  authUser = { id: "auth-user-1" },
  appUserResult = { data: { id: "app-user-1" }, error: null as Error | null },
  employeeResult = { data: { id: "employee-1" }, error: null as Error | null },
  openEntryResult = { data: null, error: null as Error | null },
  uploadsResult = { data: [], error: null as Error | null },
}: {
  authUser?: { id: string } | null;
  appUserResult?: { data: { id: string } | null; error: Error | null };
  employeeResult?: { data: { id: string } | null; error: Error | null };
  openEntryResult?: { data: unknown; error: Error | null };
  uploadsResult?: { data: unknown[]; error: Error | null };
}) {
  const usersBuilder = buildMaybeSingleBuilder(appUserResult);
  const employeesBuilder = buildMaybeSingleBuilder(employeeResult);
  const timeEntriesBuilder = buildTimeEntryBuilder(openEntryResult);
  const jobFilesBuilder = buildJobFilesBuilder(uploadsResult);

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: authUser },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      if (table === "users") return { select: vi.fn(() => usersBuilder) };
      if (table === "employees") return { select: vi.fn(() => employeesBuilder) };
      if (table === "time_entries") return { select: vi.fn(() => timeEntriesBuilder) };
      if (table === "job_files") return { select: vi.fn(() => jobFilesBuilder) };
      throw new Error(`Unexpected table ${table}`);
    }),
  } as never;
}

describe("EmployeeHomePage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("keeps the waiting-state guidance when the employee record is missing", async () => {
    mockCreateClient.mockResolvedValue(
      buildClient({
        employeeResult: { data: null, error: null },
      }),
    );

    render(await EmployeeHomePage());

    expect(screen.getByText("Waiting on employee setup")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open policies" })).toHaveAttribute("href", "/employee/policies");
  });

  it("shows an error panel when the app-user lookup fails", async () => {
    mockCreateClient.mockResolvedValue(
      buildClient({
        appUserResult: { data: null, error: new Error("boom") },
      }),
    );

    render(await EmployeeHomePage());

    expect(screen.getByText("We couldn’t load your employee portal right now")).toBeInTheDocument();
    expect(screen.getByText("We couldn’t verify your app profile against the employee portal. Try refreshing the page or come back in a moment.")).toBeInTheDocument();
  });

  it("shows an error panel when shift or upload activity queries fail", async () => {
    mockCreateClient.mockResolvedValue(
      buildClient({
        openEntryResult: { data: null, error: new Error("boom") },
      }),
    );

    render(await EmployeeHomePage());

    expect(screen.getByText("We couldn’t load your employee portal right now")).toBeInTheDocument();
    expect(screen.getByText("We couldn’t load your latest shift or upload activity. Try refreshing the page or come back in a moment.")).toBeInTheDocument();
  });
});
