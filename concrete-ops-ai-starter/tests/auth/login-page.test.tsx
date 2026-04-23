// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  resolveAppUser: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/auth/app-user", () => ({
  AUTH_ROUTE_ERROR_MESSAGES: {
    profile_not_ready:
      "Your account is signed in, but it is not linked to an app user in this environment yet. For demo QA, rerun the demo seed after creating the auth users or enable the service-role auto-link path on the deploy.",
  },
  resolveAppUser: mocks.resolveAppUser,
}));

vi.mock("@/lib/auth/roles", () => ({
  getRoleHomePath: vi.fn(),
}));

vi.mock("@/components/auth/LoginForm", () => ({
  LoginForm: () => <div>Mock Login Form</div>,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

import LoginPage from "@/app/(auth)/login/page";

describe("LoginPage", () => {
  it("renders the profile-link warning instead of redirecting when the signed-in user has no app user row", async () => {
    mocks.createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "auth-user-1",
              email: "demo.owner@concreteops.example",
            },
          },
        }),
      },
    });
    mocks.resolveAppUser.mockResolvedValue({ appUser: null, error: null });

    render(await LoginPage({ searchParams: { error: "profile_not_ready" } }));

    expect(screen.getByRole("alert")).toHaveTextContent("not linked to an app user");
    expect(screen.getByText("Mock Login Form")).toBeInTheDocument();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
