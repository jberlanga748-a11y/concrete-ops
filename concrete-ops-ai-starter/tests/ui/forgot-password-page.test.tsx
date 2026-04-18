// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const forgotPasswordFormMock = vi.hoisted(() => vi.fn());

vi.mock("@/components/auth/ForgotPasswordForm", () => ({
  ForgotPasswordForm: ({ initialError }: { initialError?: string | null }) => {
    forgotPasswordFormMock(initialError);
    return <div>{initialError ?? "no-error"}</div>;
  },
}));

import ForgotPasswordPage from "@/app/(auth)/forgot-password/page";

describe("ForgotPasswordPage", () => {
  it("maps promised reset-link errors into the form state", async () => {
    render(await ForgotPasswordPage({ searchParams: Promise.resolve({ error: "missing_code" }) }));

    expect(forgotPasswordFormMock).toHaveBeenCalledWith(
      "That reset link is incomplete. Request a new one to continue.",
    );
    expect(screen.getByText("That reset link is incomplete. Request a new one to continue.")).toBeInTheDocument();
  });
});
