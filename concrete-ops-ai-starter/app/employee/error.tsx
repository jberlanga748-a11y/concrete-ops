"use client";

import { ErrorPanel } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-primitives";

export default function EmployeeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <PageHeader
        eyebrow="Employee Portal"
        title="We hit a snag loading your employee workspace."
        description="Your time, uploads, or compliance data did not load cleanly. You can retry here without leaving the portal."
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
      <ErrorPanel
        title="Employee portal data could not load"
        description={error.message || "Please try again. If the problem keeps happening, ask the office team to verify your account access and assignments."}
        action={
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-black text-rose-700 transition hover:bg-rose-100"
          >
            Try again
          </button>
        }
      />
      </div>
    </div>
  );
}
