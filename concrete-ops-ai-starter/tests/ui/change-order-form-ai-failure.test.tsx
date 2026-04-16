// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/db/mutations", () => ({
  createChangeOrder: vi.fn(async () => ({ data: null, error: null })),
}));

import { ChangeOrderForm } from "@/components/change-orders/ChangeOrderForm";

describe("ChangeOrderForm AI failure path", () => {
  it("shows inline validation when Rewrite with AI is clicked with short description", async () => {
    render(
      <ChangeOrderForm
        jobOptions={[]}
        dailyReportOptions={[]}
        proofFiles={[]}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Rewrite with AI" }));

    expect(await screen.findByText("Add a short rough description first before using Rewrite with AI.")).toBeInTheDocument();
  });
});
