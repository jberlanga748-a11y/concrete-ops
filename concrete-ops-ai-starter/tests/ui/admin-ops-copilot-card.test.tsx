// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { AdminOpsCopilotCard } from "@/components/copilot/AdminOpsCopilotCard";

describe("AdminOpsCopilotCard", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
    cleanup();
  });

  it("shows validation feedback when question is too short", async () => {
    render(
      <ToastProvider>
        <AdminOpsCopilotCard />
      </ToastProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Ask Copilot" }));

    expect(await screen.findByText("Add a clearer question")).toBeInTheDocument();
  });

  it("shows error toast when API call fails", async () => {
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ error: "service unavailable" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }),
    ) as typeof fetch;

    render(
      <ToastProvider>
        <AdminOpsCopilotCard />
      </ToastProvider>,
    );

    await userEvent.type(
      screen.getAllByPlaceholderText("Example: Which jobs had both a daily report and a change order in the last week?")[0],
      "Which open change orders were created this week?",
    );
    await userEvent.click(screen.getByRole("button", { name: "Ask Copilot" }));

    expect(await screen.findByText("Copilot unavailable")).toBeInTheDocument();
  });
});
