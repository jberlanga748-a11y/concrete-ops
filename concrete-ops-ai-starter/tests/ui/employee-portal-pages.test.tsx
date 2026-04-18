// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const { mockGetEmployeePortalContext, mockGetMyPPEItems } = vi.hoisted(() => ({
  mockGetEmployeePortalContext: vi.fn(),
  mockGetMyPPEItems: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/employee/portal", () => ({
  getEmployeePortalContext: mockGetEmployeePortalContext,
}));

vi.mock("@/lib/db/queries", () => ({
  getMyPPEItems: mockGetMyPPEItems,
}));

import EmployeeUploadsPage from "@/app/employee/uploads/page";
import EmployeePPEPage from "@/app/employee/ppe/page";

describe("employee portal pages", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows the no-assignment guidance on the uploads page", async () => {
    mockGetEmployeePortalContext.mockResolvedValue({
      supabase: {},
      appUser: {
        id: "user-1",
        companyId: "company-1",
        role: "employee",
        fullName: "Alex Crew",
      },
      employee: {
        id: "employee-1",
        full_name: "Alex Crew",
        crew_name: "Crew A",
        job_title: "Laborer",
      },
      assignedJobIds: [],
      contextError: null,
    });

    render(await EmployeeUploadsPage());

    expect(screen.getByText("No active job assignments are ready for uploads")).toBeInTheDocument();
    expect(screen.getByText(/Uploads stay tied to your active job assignments/)).toBeInTheDocument();
  });

  it("shows the setup state on the PPE page when the employee record is missing", async () => {
    mockGetEmployeePortalContext.mockResolvedValue({
      supabase: {},
      appUser: {
        id: "user-1",
        companyId: "company-1",
        role: "employee",
        fullName: "Alex Crew",
      },
      employee: null,
      assignedJobIds: [],
      contextError: null,
    });
    mockGetMyPPEItems.mockResolvedValue({ data: [], error: null });

    render(await EmployeePPEPage());

    expect(screen.getByText("Your employee profile still needs office setup")).toBeInTheDocument();
    expect(screen.getByText(/before time, uploads, and PPE tracking become available here/)).toBeInTheDocument();
  });
});
