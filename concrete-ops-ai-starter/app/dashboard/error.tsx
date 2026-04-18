"use client";

import { ErrorPanel } from "@/components/ui/feedback";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Operations Workspace</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">We hit a snag loading this operations view.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
          Labor, reporting, uploads, or follow-up data did not load cleanly. You can retry here without leaving the dashboard.
        </p>
      </section>

      <ErrorPanel
        title="Dashboard data could not load"
        description={error.message || "Please try again. If the problem keeps happening, verify your access level and refresh the workspace."}
        action={
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-rose-100"
          >
            Try again
          </button>
        }
      />
    </div>
  );
}
