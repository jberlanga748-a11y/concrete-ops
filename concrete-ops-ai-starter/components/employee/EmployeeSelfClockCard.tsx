"use client";

import { useState } from "react";
import { clockOutLatestEntry, createClockInEntry } from "@/lib/db/mutations";
import type { TimeOption } from "@/lib/db/queries";
import { formatTimestamp } from "@/lib/time/formatting";

type ActiveShiftSummary = {
  clockInAt: string;
  status: string;
  jobLabel: string | null;
};

export function EmployeeSelfClockCard({
  employeeId,
  jobOptions,
  phaseOptions,
  activeShift,
}: {
  employeeId: string;
  jobOptions: TimeOption[];
  phaseOptions: TimeOption[];
  activeShift?: ActiveShiftSummary | null;
}) {
  const [jobId, setJobId] = useState("");
  const [jobPhaseId, setJobPhaseId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [loading, setLoading] = useState(false);
  const hasAssignableJobs = jobOptions.length > 0;

  async function handleClockIn() {
    if (!jobId) {
      setMessageType("error");
      setMessage("Select a job before clocking in.");
      return;
    }

    setLoading(true);
    setMessage(null);
    const result = await createClockInEntry({ employeeId, jobId, jobPhaseId: jobPhaseId || undefined });
    setMessageType(result.error ? "error" : "success");
    setMessage(result.error ? result.error : "Clock-in saved.");
    setLoading(false);
  }

  async function handleClockOut() {
    setLoading(true);
    setMessage(null);
    const result = await clockOutLatestEntry({ employeeId, jobId: jobId || undefined });
    setMessageType(result.error ? "error" : "success");
    setMessage(result.error ? result.error : "Clock-out saved.");
    setLoading(false);
  }

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">My Time</h2>
      <p className="mt-3 text-zinc-600">Select your job and optional phase, then clock in or out.</p>

      {activeShift ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-zinc-700">
          <p className="font-semibold text-zinc-900">Active shift on file</p>
          <p className="mt-2 leading-6">
            {`Started ${formatTimestamp(activeShift.clockInAt, { includeYear: false })}`}
            {activeShift.jobLabel ? ` on ${activeShift.jobLabel}` : ""}. Status: {activeShift.status.replaceAll("_", " ")}.
          </p>
        </div>
      ) : null}

      {!hasAssignableJobs ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-zinc-700">
          <p className="font-semibold text-zinc-900">No active assignments available for new clock-ins</p>
          <p className="mt-2 leading-6">
            New clock-ins stay disabled until you are assigned to an active job. If you still have an open shift, you can
            clock out below without choosing a job.
          </p>
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        <div>
          <p className="mb-2 text-sm text-zinc-600">Job</p>
          <select
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            disabled={!hasAssignableJobs}
            className="w-full rounded-2xl border px-4 py-3 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500"
          >
            <option value="">Select job</option>
            {jobOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-2 text-sm text-zinc-600">Phase (optional)</p>
          <select
            value={jobPhaseId}
            onChange={(e) => setJobPhaseId(e.target.value)}
            disabled={!hasAssignableJobs || phaseOptions.length === 0}
            className="w-full rounded-2xl border px-4 py-3 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500"
          >
            <option value="">Select phase</option>
            {phaseOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClockIn}
            disabled={loading || !hasAssignableJobs}
            className="rounded-2xl bg-zinc-900 px-5 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Saving..." : "Clock In"}
          </button>
          <button onClick={handleClockOut} disabled={loading} className="rounded-2xl border px-5 py-3 disabled:opacity-50">
            {loading ? "Saving..." : "Clock Out"}
          </button>
        </div>

        {message ? (
          <p className={`text-sm ${messageType === "error" ? "text-red-600" : messageType === "success" ? "text-green-700" : "text-zinc-600"}`}>{message}</p>
        ) : (
          <p className="text-sm text-zinc-500">
            {hasAssignableJobs
              ? "Tip: if you leave job blank on clock out, the latest open entry is used."
              : "Tip: use clock out without a selected job to close your latest open shift if one is still active."}
          </p>
        )}
      </div>
    </div>
  );
}
