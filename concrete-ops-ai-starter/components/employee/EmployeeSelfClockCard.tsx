"use client";

import { useState } from "react";
import { FieldLabel } from "@/components/ui/form";
import { OperationalCard, SectionHeader } from "@/components/ui/page-primitives";
import { clockOutLatestEntry, createClockInEntry } from "@/lib/db/mutations";
import type { TimeOption } from "@/lib/db/queries";

const fieldClassName =
  "w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

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
    <OperationalCard className="p-4">
      <SectionHeader title="My Time" description="Select your job and optional phase, then clock in or out." />
      <div className="mt-4 space-y-4">
        <div>
          <FieldLabel>Job</FieldLabel>
          <select
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            disabled={!hasJobs || loading}
            className={fieldClassName}
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
          <FieldLabel>Phase (optional)</FieldLabel>
          <select
            value={jobPhaseId}
            onChange={(e) => setJobPhaseId(e.target.value)}
            disabled={!hasPhases || loading}
            className={fieldClassName}
          >
            <option value="">{hasPhases ? "Select phase" : "No phases available"}</option>
            {phaseOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
          {!hasPhases ? <p className="mt-2 text-xs font-medium text-slate-500">Phase tracking has not been set up yet, so you can clock time against the job only.</p> : null}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={handleClockIn} disabled={loading || !hasJobs} className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800 disabled:opacity-50">
            {loading ? "Saving..." : "Clock In"}
          </button>
          <button type="button" onClick={handleClockOut} disabled={loading} className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-blue-50 disabled:opacity-50">
            {loading ? "Saving..." : "Clock Out"}
          </button>
        </div>

        {message ? (
          <p className={`text-sm font-bold ${messageType === "error" ? "text-red-600" : messageType === "success" ? "text-emerald-700" : "text-slate-600"}`}>{message}</p>
        ) : (
          <p className="text-sm font-medium text-slate-500">Tip: if you leave job blank on clock out, the latest open entry is used.</p>
        )}
      </div>
    </OperationalCard>
  );
}
