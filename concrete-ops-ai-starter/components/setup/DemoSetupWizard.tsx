"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createDemoSetupData, deleteDemoSetupData } from "@/lib/db/mutations";

type ActionKind = "create" | "delete" | null;
type DemoSetupCounts = {
  customers: number;
  jobs: number;
  employees: number;
  jobAssignments: number;
  jobPhases: number;
  dailyReports: number;
  crewEntries: number;
  toolboxTalks: number;
  toolboxAttendees: number;
  incidents: number;
  documents: number;
};

type DemoSetupStatus = {
  configured: boolean;
  exists: boolean;
  counts: DemoSetupCounts;
  error?: string;
};

function countsList(counts: DemoSetupCounts) {
  return [
    { label: "Customers", value: counts.customers },
    { label: "Jobs", value: counts.jobs },
    { label: "Employees", value: counts.employees },
    { label: "Assignments", value: counts.jobAssignments },
    { label: "Phases", value: counts.jobPhases },
    { label: "Daily Reports", value: counts.dailyReports },
    { label: "Crew Rows", value: counts.crewEntries },
    { label: "Toolbox Talks", value: counts.toolboxTalks },
    { label: "Attendees", value: counts.toolboxAttendees },
    { label: "Incidents", value: counts.incidents },
    { label: "Documents", value: counts.documents },
  ];
}

export function DemoSetupWizard({ initialStatus }: { initialStatus: DemoSetupStatus }) {
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState<string | null>(initialStatus.error ?? null);
  const [isError, setIsError] = useState(Boolean(initialStatus.error));
  const [confirmingAction, setConfirmingAction] = useState<ActionKind>(null);
  const [pending, startTransition] = useTransition();

  function handleAction(action: ActionKind) {
    if (!action) return;

    startTransition(async () => {
      setMessage(null);
      setIsError(false);

      const result = action === "create" ? await createDemoSetupData() : await deleteDemoSetupData();
      if (result.error) {
        setMessage(result.error);
        setIsError(true);
        setConfirmingAction(null);
        return;
      }

      const counts = result.data?.counts ?? status.counts;
      const exists = action === "create" ? true : false;
      setStatus({
        configured: status.configured,
        exists: action === "create" ? true : exists && !result.data?.alreadyExists,
        counts,
      });
      setMessage(
        action === "create"
          ? result.data?.alreadyExists
            ? "Demo already exists for this company."
            : "Demo data created."
          : result.data?.alreadyExists
            ? "No demo data was found to delete."
            : "Demo data deleted. Shared job phases were left in place.",
      );
      setConfirmingAction(null);
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Demo Setup</h1>
            <p className="mt-3 max-w-3xl text-zinc-600">
              Create a safe set of owner test records in the default company so jobs, employees, daily reports, toolbox talks,
              and related workflows are immediately testable.
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${
              status.exists ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {status.exists ? "Demo present" : "Demo not created"}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={pending || !status.configured}
            onClick={() => setConfirmingAction("create")}
            className="rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {pending && confirmingAction === "create" ? "Creating..." : "Create Demo Data"}
          </button>
          <button
            type="button"
            disabled={pending || !status.configured}
            onClick={() => setConfirmingAction("delete")}
            className="rounded-2xl border px-5 py-3 text-sm font-medium disabled:opacity-50"
          >
            {pending && confirmingAction === "delete" ? "Deleting..." : "Delete Demo Data"}
          </button>
        </div>

        {message ? (
          <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${isError ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
            {message}
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {countsList(status.counts).map((item) => (
            <div key={item.label} className="rounded-2xl border bg-zinc-50 px-4 py-4">
              <p className="text-sm text-zinc-500">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard/jobs" className="rounded-2xl border px-4 py-3 text-sm font-medium hover:bg-zinc-100">
            View Jobs
          </Link>
          <Link href="/dashboard/employees" className="rounded-2xl border px-4 py-3 text-sm font-medium hover:bg-zinc-100">
            View Employees
          </Link>
          <Link href="/dashboard/customers" className="rounded-2xl border px-4 py-3 text-sm font-medium hover:bg-zinc-100">
            View Customers
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">How Demo Records Are Marked</h2>
        <div className="mt-4 space-y-2 text-sm text-zinc-600">
          <p>Customer name starts with `DEMO – `.</p>
          <p>Jobs use `DEMO-1001` and `DEMO-1002` job numbers.</p>
          <p>Employees use `DEMO – ` names and `demo.*@example.com` email addresses.</p>
          <p>Daily reports and incidents include the `[DEMO_SETUP]` marker in their content.</p>
          <p>Shared job phases are seeded as `Demo`, `Formwork`, `Placement`, and `Finish` only if they are missing.</p>
        </div>
      </section>

      {confirmingAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold">
              {confirmingAction === "create" ? "Create Demo Data" : "Delete Demo Data"}
            </h2>
            <p className="mt-3 text-sm text-zinc-600">
              {confirmingAction === "create"
                ? "This will create demo records in the database for the default company."
                : "This will delete the demo customer, jobs, employees, daily reports, toolbox talk, and incident records."}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmingAction(null)}
                className="flex-1 rounded-2xl border px-4 py-3 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAction(confirmingAction)}
                disabled={pending}
                className="flex-1 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                {pending ? "Working..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
