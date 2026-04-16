"use client";

import { useState } from "react";
import { clockOutLatestEntry, createClockInEntry } from "@/lib/db/mutations";
import type { TimeOption } from "@/lib/db/queries";
import { useToast } from "@/components/ui/ToastProvider";
import {
  InlineNotice,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  selectClassName,
  surfaceClassName,
} from "@/components/ui/primitives";

export function EmployeeSelfClockCard({ employeeId, jobOptions, phaseOptions }: { employeeId: string; jobOptions: TimeOption[]; phaseOptions: TimeOption[] }) {
  const { pushToast } = useToast();
  const [jobId, setJobId] = useState("");
  const [jobPhaseId, setJobPhaseId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [loading, setLoading] = useState(false);

  async function handleClockIn() {
    if (!jobId) {
      setMessageType("error");
      setMessage("Select a job before clocking in.");
      pushToast({ tone: "error", title: "Select a job before clocking in." });
      return;
    }

    setLoading(true);
    setMessage(null);
    const result = await createClockInEntry({ employeeId, jobId, jobPhaseId: jobPhaseId || undefined });
    setMessageType(result.error ? "error" : "success");
    setMessage(result.error ? result.error : "Clock-in saved.");
    pushToast({
      tone: result.error ? "error" : "success",
      title: result.error ? "Clock in failed." : "Clock-in saved.",
      description: result.error ? "Please review the selected job and try again." : "Your shift is now running.",
    });
    setLoading(false);
  }

  async function handleClockOut() {
    setLoading(true);
    setMessage(null);
    const result = await clockOutLatestEntry({ employeeId, jobId: jobId || undefined });
    setMessageType(result.error ? "error" : "success");
    setMessage(result.error ? result.error : "Clock-out saved.");
    pushToast({
      tone: result.error ? "error" : "success",
      title: result.error ? "Clock out failed." : "Clock-out saved.",
      description: result.error ? "Please try again in a moment." : "Your latest open entry has been closed.",
    });
    setLoading(false);
  }

  return (
    <div className={`${surfaceClassName} p-6`}>
      <h2 className="text-xl font-semibold">My Time</h2>
      <p className="mt-3 text-zinc-600">Select your job and optional phase, then clock in or out.</p>
      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700">Job</label>
          <select value={jobId} onChange={(e) => setJobId(e.target.value)} className={selectClassName}>
            <option value="">Select job</option>
            {jobOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700">Phase (optional)</label>
          <select value={jobPhaseId} onChange={(e) => setJobPhaseId(e.target.value)} className={selectClassName}>
            <option value="">Select phase</option>
            {phaseOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <button onClick={handleClockIn} disabled={loading} className={primaryButtonClassName}>
            {loading ? "Saving..." : "Clock In"}
          </button>
          <button onClick={handleClockOut} disabled={loading} className={secondaryButtonClassName}>
            {loading ? "Saving..." : "Clock Out"}
          </button>
        </div>

        {message ? (
          <InlineNotice tone={messageType === "error" ? "error" : messageType === "success" ? "success" : "neutral"}>
            {message}
          </InlineNotice>
        ) : (
          <InlineNotice tone="neutral">Tip: if you leave job blank on clock out, the latest open entry is used.</InlineNotice>
        )}
      </div>
    </div>
  );
}
