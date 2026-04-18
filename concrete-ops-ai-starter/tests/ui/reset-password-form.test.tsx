// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const replace = vi.fn();
const refresh = vi.fn();
const updateUser = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace,
    refresh,
  }),
}));

vi.mock("@/lib/supabase/browser", () => ({
  createClient: () => ({
    auth: {
      updateUser,
    },
  }),
}));

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    replace.mockReset();
    refresh.mockReset();
    updateUser.mockReset();
  });

  it("updates the password and routes back into the app", async () => {
    updateUser.mockResolvedValue({ error: null });

    render(<ResetPasswordForm />);

    await userEvent.type(screen.getByLabelText("New password"), "newpassword123");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "newpassword123");
    await userEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect(updateUser).toHaveBeenCalledWith({ password: "newpassword123" });
    expect(await screen.findByText("Password updated. Redirecting...")).toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/dashboard");
    expect(refresh).toHaveBeenCalled();
  });
});
