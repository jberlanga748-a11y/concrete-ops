"use client";

import { useState } from "react";
import { clockOutLatestEntry, createClockInEntry } from "@/lib/db/mutations";
import type { TimeOption } from "@/lib/db/queries";

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
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleClockIn() {
    if (!employeeId || !jobId) {
      setMessage("Select an employee and job before clocking in.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const result = await createClockInEntry({ employeeId, jobId, jobPhaseId: jobPhaseId || undefined });

    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Clock-in saved.");
    }

    setLoading(false);
  }

  async function handleClockOut() {
    if (!employeeId) {
      setMessage("Select an employee before clocking out.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const result = await clockOutLatestEntry({ employeeId, jobId: jobId || undefined });

    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Clock-out saved.");
    }

    setLoading(false);
  }

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Employee Time</h2>
      <p className="mt-3 text-zinc-600">Choose employee, job, and phase, then clock in or clock out.</p>
      <div className="mt-6 space-y-4">
        <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full rounded-2xl border px-4 py-3">
          <option value="">Select employee</option>
          {employeeOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>

        <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="w-full rounded-2xl border px-4 py-3">
          <option value="">Select job</option>
          {jobOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>

        <select value={jobPhaseId} onChange={(e) => setJobPhaseId(e.target.value)} className="w-full rounded-2xl border px-4 py-3">
          <option value="">Select phase (optional)</option>
          {phaseOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="flex gap-3">
          <button onClick={handleClockIn} disabled={loading} className="rounded-2xl bg-zinc-900 px-5 py-3 text-white disabled:opacity-50">
            {loading ? "Saving..." : "Clock In"}
          </button>
          <button onClick={handleClockOut} disabled={loading} className="rounded-2xl border px-5 py-3 disabled:opacity-50">
            {loading ? "Saving..." : "Clock Out"}
          </button>
        </div>

        {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
      </div>
    </div>
  );
}
