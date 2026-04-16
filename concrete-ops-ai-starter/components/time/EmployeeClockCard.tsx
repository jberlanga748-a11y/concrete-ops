"use client";

import { useState } from "react";
import { clockOutLatestEntry, createClockInEntry } from "@/lib/db/mutations";
import type { TimeOption } from "@/lib/db/queries";
import { FormActions, FormSection, FieldLabel } from "@/components/ui/form";
import { useToast } from "@/components/ui/ToastProvider";

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
  const [loading, setLoading] = useState(false);
  const { pushToast } = useToast();

  async function handleClockIn() {
    if (!employeeId || !jobId) {
      pushToast({
        tone: "error",
        title: "Select employee and job first",
        description: "Clock-in needs both an employee and a job before the entry can be created.",
      });
      return;
    }

    setLoading(true);

    const result = await createClockInEntry({ employeeId, jobId, jobPhaseId: jobPhaseId || undefined });

    if (result.error) {
      pushToast({
        tone: "error",
        title: "Clock-in failed",
        description: "We couldn’t save that clock-in right now. Try again in a moment.",
      });
    } else {
      pushToast({
        tone: "success",
        title: "Clock-in saved",
        description: "The labor log has a new entry and can be reviewed in the table next to this form.",
      });
    }

    setLoading(false);
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

    setLoading(true);

    const result = await clockOutLatestEntry({ employeeId, jobId: jobId || undefined });

    if (result.error) {
      pushToast({
        tone: "error",
        title: "Clock-out failed",
        description: "We couldn’t close that time entry right now. Try again in a moment.",
      });
    } else {
      pushToast({
        tone: "success",
        title: "Clock-out saved",
        description: "The latest matching time entry has been updated.",
      });
    }

    setLoading(false);
  }

  return (
    <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Quick Entry</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">Employee Time</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Choose an employee, job, and optional phase, then clock in or clock out from the same panel.
        </p>
      </div>

      <div className="mt-5 space-y-4">
        <FormSection
          title="Time details"
          description="The same records created here appear immediately in the admin labor log."
        >
          <div>
            <FieldLabel required>Employee</FieldLabel>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
            >
              <option value="">Select employee</option>
              {employeeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel required>Job</FieldLabel>
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
            >
              <option value="">Select job</option>
              {jobOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel>Phase</FieldLabel>
            <select
              value={jobPhaseId}
              onChange={(e) => setJobPhaseId(e.target.value)}
              className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
            >
              <option value="">Select phase</option>
              {phaseOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </FormSection>

        <FormActions hint="Tip: when job is left blank on clock out, the latest open entry for the selected employee is used.">
          <button
            onClick={handleClockIn}
            disabled={loading}
            className="rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Clock In"}
          </button>
          <button
            onClick={handleClockOut}
            disabled={loading}
            className="rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Clock Out"}
          </button>
        </FormActions>
      </div>
    </div>
  );
}
