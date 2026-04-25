"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clockOutLatestEntryAction, createClockInEntryAction } from "@/components/time/actions";
import type { TimeOption } from "@/lib/db/queries";
import { useToast } from "@/components/ui/ToastProvider";
import { SectionHeader } from "@/components/ui/page-primitives";

function getOptionLabel(options: TimeOption[], id: string, fallback: string) {
  return options.find((option) => option.id === id)?.label ?? fallback;
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
      <label className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-500">
        {label}
        {required ? <span className="ml-1 text-blue-700">*</span> : null}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{hint}</p> : null}
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
    <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-950/5">
      <SectionHeader title="Crew Clock" description="Clock field labor without leaving the labor board." />

      <div className="mb-4 grid gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
        <div className="grid grid-cols-[96px_1fr] gap-3">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Employee</p>
          <p className="text-sm font-bold text-slate-700">{selectedEmployeeLabel}</p>
        </div>
        <div className="grid grid-cols-[96px_1fr] gap-3">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Job</p>
          <p className="text-sm font-bold text-slate-700">{selectedJobLabel}</p>
        </div>
        <div className="grid grid-cols-[96px_1fr] gap-3">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Phase</p>
          <p className="text-sm font-bold text-slate-700">{selectedPhaseLabel}</p>
        </div>
      </div>

      <div className="space-y-3">
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
          hint="Clock-out can use employee only, but selecting a job narrows the update."
        />
        <SelectField
          label="Phase"
          value={jobPhaseId}
          onChange={setJobPhaseId}
          options={phaseOptions}
          placeholder="Select phase"
        />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleClockIn}
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-700 px-4 text-sm font-black text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingAction === "clock-in" ? "Clocking in..." : "Clock in"}
        </button>
        <button
          type="button"
          onClick={handleClockOut}
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-blue-100 bg-white px-4 text-sm font-black text-slate-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingAction === "clock-out" ? "Clocking out..." : "Clock out"}
        </button>
      </div>
    </section>
  );
}
