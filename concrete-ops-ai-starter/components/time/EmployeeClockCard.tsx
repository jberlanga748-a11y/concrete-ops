"use client";

import { useState } from "react";
import { createClockInEntry } from "@/lib/db/mutations";

export function EmployeeClockCard() {
  const [employeeId, setEmployeeId] = useState("");
  const [jobId, setJobId] = useState("");
  const [jobPhaseId, setJobPhaseId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleClockIn() {
    setLoading(true);
    setMessage(null);
    try {
      const result = await createClockInEntry({ employeeId, jobId, jobPhaseId });
      if (result.error) {
        setMessage(result.error.message);
      } else {
        setMessage("Clock-in saved.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Employee Clock In</h2>
      <p className="mt-3 text-zinc-600">Use real IDs from your database once seed data exists.</p>
      <div className="mt-6 space-y-4">
        <input placeholder="employee_id" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full rounded-2xl border px-4 py-3" />
        <input placeholder="job_id" value={jobId} onChange={(e) => setJobId(e.target.value)} className="w-full rounded-2xl border px-4 py-3" />
        <input placeholder="job_phase_id" value={jobPhaseId} onChange={(e) => setJobPhaseId(e.target.value)} className="w-full rounded-2xl border px-4 py-3" />
        <button onClick={handleClockIn} disabled={loading} className="rounded-2xl bg-zinc-900 px-5 py-3 text-white disabled:opacity-50">
          {loading ? "Saving..." : "Clock In"}
        </button>
        {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
      </div>
    </div>
  );
}
