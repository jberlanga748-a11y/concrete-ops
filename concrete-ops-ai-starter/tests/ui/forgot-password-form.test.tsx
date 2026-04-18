// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const resetPasswordForEmail = vi.fn();

vi.mock("@/lib/supabase/browser", () => ({
  createClient: () => ({
    auth: {
      resetPasswordForEmail,
    },
  }),
}));

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    resetPasswordForEmail.mockReset();
  });

  it("requests a password reset email with the auth callback redirect", async () => {
    resetPasswordForEmail.mockResolvedValue({ error: null });

    render(<ForgotPasswordForm />);

    await userEvent.type(screen.getByLabelText("Email"), "worker@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(resetPasswordForEmail).toHaveBeenCalledWith(
      "worker@example.com",
      expect.objectContaining({
        redirectTo: expect.stringContaining("/auth/callback?next=%2Freset-password"),
      }),
    );
    expect(await screen.findByText("If that email is registered, a password reset link is on its way.")).toBeInTheDocument();
  });
});
