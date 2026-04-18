"use client";

import { ErrorPanel } from "@/components/ui/feedback";

export default function EmployeeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Employee Portal</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">We hit a snag loading your employee workspace.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
          Your time, uploads, or compliance data did not load cleanly. You can retry here without leaving the portal.
        </p>
      </section>

      <ErrorPanel
        title="Employee portal data could not load"
        description={error.message || "Please try again. If the problem keeps happening, ask the office team to verify your account access and assignments."}
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
