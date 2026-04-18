"use client";

import { useState } from "react";
import { clockOutLatestEntry, createClockInEntry } from "@/lib/db/mutations";
import type { TimeOption } from "@/lib/db/queries";

export function EmployeeSelfClockCard({ employeeId, jobOptions, phaseOptions }: { employeeId: string; jobOptions: TimeOption[]; phaseOptions: TimeOption[] }) {
  const [jobId, setJobId] = useState("");
  const [jobPhaseId, setJobPhaseId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [loading, setLoading] = useState(false);
  const hasJobs = jobOptions.length > 0;
  const hasPhases = phaseOptions.length > 0;

  async function handleClockIn() {
    if (!hasJobs) {
      setMessageType("error");
      setMessage("You do not have any active job assignments yet. Ask the office to assign you before clocking in.");
      return;
    }

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
      <div className="mt-6 space-y-4">
        <div>
          <p className="mb-2 text-sm text-zinc-600">Job</p>
          <select
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            disabled={!hasJobs || loading}
            className="w-full rounded-2xl border px-4 py-3 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500"
          >
            <option value="">{hasJobs ? "Select job" : "No active job assignments"}</option>
            {jobOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
          {!hasJobs ? (
            <p className="mt-2 text-xs text-amber-700">Your time card is ready, but job options only appear after an active assignment is added.</p>
          ) : null}
        </div>

        <div>
          <p className="mb-2 text-sm text-zinc-600">Phase (optional)</p>
          <select
            value={jobPhaseId}
            onChange={(e) => setJobPhaseId(e.target.value)}
            disabled={!hasPhases || loading}
            className="w-full rounded-2xl border px-4 py-3 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500"
          >
            <option value="">{hasPhases ? "Select phase" : "No phases available"}</option>
            {phaseOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
          {!hasPhases ? <p className="mt-2 text-xs text-zinc-500">Phase tracking has not been set up yet, so you can clock time against the job only.</p> : null}
        </div>

        <div className="flex gap-3">
          <button onClick={handleClockIn} disabled={loading || !hasJobs} className="rounded-2xl bg-zinc-900 px-5 py-3 text-white disabled:opacity-50">
            {loading ? "Saving..." : "Clock In"}
          </button>
          <button onClick={handleClockOut} disabled={loading} className="rounded-2xl border px-5 py-3 disabled:opacity-50">
            {loading ? "Saving..." : "Clock Out"}
          </button>
        </div>

        {message ? (
          <p className={`text-sm ${messageType === "error" ? "text-red-600" : messageType === "success" ? "text-green-700" : "text-zinc-600"}`}>{message}</p>
        ) : (
          <p className="text-sm text-zinc-500">Tip: if you leave job blank on clock out, the latest open entry is used.</p>
        )}
      </div>
    </div>
  );
}
