"use client";

import { ErrorPanel } from "@/components/ui/feedback";

export default function EmployeeError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-6">
      <ErrorPanel
        title="The employee portal hit a snag"
        description="We couldn’t load this employee workspace right now. Try again, and if it keeps happening, let the office know so they can check your setup."
        action={
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-rose-100"
          >
            Try again
          </button>
        }
      />
    </div>
  );
}
