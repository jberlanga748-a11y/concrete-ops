"use client";

import { useState } from "react";
import { clockOutLatestEntry, createClockInEntry } from "@/lib/db/mutations";
import type { TimeOption } from "@/lib/db/queries";

export function EmployeeSelfClockCard({ 
  employeeId, 
  jobOptions, 
  phaseOptions 
}: { 
  employeeId: string; 
  jobOptions: TimeOption[]; 
  phaseOptions: TimeOption[];
}) {
  const [jobId, setJobId] = useState("");
  const [jobPhaseId, setJobPhaseId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"in" | "out" | null>(null);

  async function handleClockIn() {
    if (!jobId) {
      setMessageType("error");
      setMessage("Please select a job before clocking in.");
      return;
    }

    setLoading(true);
    setLoadingAction("in");
    setMessage(null);
    const result = await createClockInEntry({ employeeId, jobId, jobPhaseId: jobPhaseId || undefined });
    setMessageType(result.error ? "error" : "success");
    setMessage(result.error ? result.error : "You are now clocked in. Have a great shift!");
    setLoading(false);
    setLoadingAction(null);
  }

  async function handleClockOut() {
    setLoading(true);
    setLoadingAction("out");
    setMessage(null);
    const result = await clockOutLatestEntry({ employeeId, jobId: jobId || undefined });
    setMessageType(result.error ? "error" : "success");
    setMessage(result.error ? result.error : "You are now clocked out. Good work today!");
    setLoading(false);
    setLoadingAction(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Clock In/Out Buttons - Primary Focus */}
      <div className="rounded-2xl border bg-white p-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-zinc-900">Time Clock</h2>
          <p className="mt-1 text-sm text-zinc-500">Clock in to start tracking your shift</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={handleClockIn}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-4 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {loadingAction === "in" ? (
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
              </svg>
            )}
            Clock In
          </button>
          <button
            onClick={handleClockOut}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 py-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            {loadingAction === "out" ? (
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
              </svg>
            )}
            Clock Out
          </button>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`mt-4 flex items-start gap-3 rounded-xl p-4 ${
              messageType === "error"
                ? "bg-red-50 text-red-600"
                : messageType === "success"
                ? "bg-green-50 text-green-600"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {messageType === "error" ? (
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            ) : messageType === "success" ? (
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            )}
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}
      </div>

      {/* Job Selection */}
      <div className="rounded-2xl border bg-white p-6">
        <h3 className="text-sm font-semibold text-zinc-900">Job Details</h3>
        <p className="mt-1 text-sm text-zinc-500">Select the job you are working on</p>

        <div className="mt-5 flex flex-col gap-4">
          <div>
            <label htmlFor="job-select" className="mb-2 block text-sm font-medium text-zinc-900">
              Job <span className="text-red-500">*</span>
            </label>
            <select
              id="job-select"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="w-full rounded-xl border bg-white px-4 py-3 text-sm text-zinc-900 transition-colors focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="">Select a job</option>
              {jobOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="phase-select" className="mb-2 block text-sm font-medium text-zinc-900">
              Phase <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <select
              id="phase-select"
              value={jobPhaseId}
              onChange={(e) => setJobPhaseId(e.target.value)}
              className="w-full rounded-xl border bg-white px-4 py-3 text-sm text-zinc-900 transition-colors focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="">Select a phase</option>
              {phaseOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-5 flex items-start gap-2 rounded-lg bg-zinc-100 p-3">
          <svg className="h-4 w-4 shrink-0 text-zinc-500 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <p className="text-xs text-zinc-500">
            Tip: When clocking out, if no job is selected, your most recent open time entry will be used.
          </p>
        </div>
      </div>
    </div>
  );
}
