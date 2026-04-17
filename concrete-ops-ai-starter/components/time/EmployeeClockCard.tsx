"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clockOutLatestEntryAction, createClockInEntryAction } from "@/components/time/actions";
import type { TimeOption } from "@/lib/db/queries";
import { useToast } from "@/components/ui/ToastProvider";

function getOptionLabel(options: TimeOption[], id: string, fallback: string) {
  return options.find((option) => option.id === id)?.label ?? fallback;
}

function StatTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">{label}</p>
      <p className="mt-3 text-xl font-semibold tracking-tight text-white">{value}</p>
    </article>
  );
}

function SelectionPill({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div
      className={`rounded-[22px] border px-4 py-4 transition ${
        active ? "border-amber-200 bg-white shadow-sm" : "border-zinc-200 bg-zinc-50/90"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className={`mt-2 text-sm font-medium leading-6 ${active ? "text-zinc-950" : "text-zinc-500"}`}>{value}</p>
    </div>
  );
}

function SelectField({
  label,
  required = false,
  value,
  onChange,
  options,
  placeholder,
  hint,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: TimeOption[];
  placeholder: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {label}
        {required ? <span className="ml-1 text-amber-600">*</span> : null}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[20px] border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <p className="mt-2 text-sm leading-6 text-zinc-500">{hint}</p> : null}
    </div>
  );
}

export function EmployeeClockCard({
  employeeOptions,
  jobOptions,
  phaseOptions,
}: {
  employeeOptions: TimeOption[];
  jobOptions: TimeOption[];
  phaseOptions: TimeOption[];
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [jobId, setJobId] = useState("");
  const [jobPhaseId, setJobPhaseId] = useState("");
  const [loadingAction, setLoadingAction] = useState<"clock-in" | "clock-out" | null>(null);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const router = useRouter();
  const { pushToast } = useToast();

  const selectedEmployeeLabel = getOptionLabel(employeeOptions, employeeId, "Select crew member");
  const selectedJobLabel = getOptionLabel(jobOptions, jobId, "Select assignment");
  const selectedPhaseLabel = getOptionLabel(phaseOptions, jobPhaseId, "Phase is optional");
  const isLoading = loadingAction !== null || isRefreshing;

  function refreshLaborBoard() {
    startRefreshTransition(() => {
      router.refresh();
    });
  }

  async function handleClockIn() {
    if (!employeeId || !jobId) {
      pushToast({
        tone: "error",
        title: "Select employee and job first",
        description: "Clock-in needs both an employee and a job before the entry can be created.",
      });
      return;
    }

    setLoadingAction("clock-in");

    try {
      const result = await createClockInEntryAction({ employeeId, jobId, jobPhaseId: jobPhaseId || undefined });

      if (result.error) {
        pushToast({
          tone: "error",
          title: "Clock-in failed",
          description: "We couldn’t save that clock-in right now. Try again in a moment.",
        });
        return;
      }

      pushToast({
        tone: "success",
        title: "Clock-in saved",
        description: "Clock-in saved. Refreshing the labor board now.",
      });
      refreshLaborBoard();
    } catch {
      pushToast({
        tone: "error",
        title: "Clock-in failed",
        description: "We couldn’t save that clock-in right now. Try again in a moment.",
      });
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleClockOut() {
    if (!employeeId) {
      pushToast({
        tone: "error",
        title: "Select an employee first",
        description: "Choose the employee you want to clock out before submitting the update.",
      });
      return;
    }

    setLoadingAction("clock-out");

    try {
      const result = await clockOutLatestEntryAction({ employeeId, jobId: jobId || undefined });

      if (result.error) {
        pushToast({
          tone: "error",
          title: "Clock-out failed",
          description: "We couldn’t close that time entry right now. Try again in a moment.",
        });
        return;
      }

      pushToast({
        tone: "success",
        title: "Clock-out saved",
        description: "Clock-out saved. Refreshing the labor board now.",
      });
      refreshLaborBoard();
    } catch {
      pushToast({
        tone: "error",
        title: "Clock-out failed",
        description: "We couldn’t close that time entry right now. Try again in a moment.",
      });
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.08)]">
      <div className="border-b border-zinc-900 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_34%),linear-gradient(145deg,#171b18_0%,#232826_50%,#0f1110_100%)] px-6 py-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-300">Crew Dispatch</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">Clock field labor without leaving the board.</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-300">
          Match employee, job, and phase selections with a more deliberate control surface for supervisors, operations, and
          payroll support.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <StatTile label="Active Crew" value={`${employeeOptions.length} available`} />
          <StatTile label="Assignments" value={`${jobOptions.length} jobs`} />
          <StatTile label="Phase Tags" value={`${phaseOptions.length} options`} />
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="rounded-[28px] border border-zinc-200 bg-[linear-gradient(180deg,rgba(250,250,249,1)_0%,rgba(245,245,244,0.94)_100%)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-600">Run Sheet</p>
          <div className="mt-4 grid gap-3">
            <SelectionPill label="Employee" value={selectedEmployeeLabel} active={Boolean(employeeId)} />
            <SelectionPill label="Job" value={selectedJobLabel} active={Boolean(jobId)} />
            <SelectionPill label="Phase" value={selectedPhaseLabel} active={Boolean(jobPhaseId)} />
          </div>
        </div>

        <div className="space-y-4">
          <SelectField
            label="Employee"
            required
            value={employeeId}
            onChange={setEmployeeId}
            options={employeeOptions}
            placeholder="Select employee"
          />
          <SelectField
            label="Job"
            required
            value={jobId}
            onChange={setJobId}
            options={jobOptions}
            placeholder="Select job"
            hint="Clock-out can use employee only, but selecting a job narrows the update to a specific assignment."
          />
          <SelectField
            label="Phase"
            value={jobPhaseId}
            onChange={setJobPhaseId}
            options={phaseOptions}
            placeholder="Select phase"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleClockIn}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-[22px] bg-amber-400 px-5 py-4 text-sm font-semibold text-zinc-950 shadow-[0_18px_40px_rgba(245,158,11,0.24)] transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingAction === "clock-in" ? "Clocking in..." : "Clock in"}
          </button>
          <button
            type="button"
            onClick={handleClockOut}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-[22px] bg-zinc-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingAction === "clock-out" ? "Clocking out..." : "Clock out"}
          </button>
        </div>

        <div className="rounded-[24px] border border-zinc-200 bg-zinc-50/90 p-4 text-sm leading-6 text-zinc-600">
          Clock-in creates a new open shift immediately. Clock-out closes the latest matching open entry for the selected
          employee, and successful saves trigger a fresh labor board reload beside this panel.
        </div>
      </div>
    </section>
  );
}
