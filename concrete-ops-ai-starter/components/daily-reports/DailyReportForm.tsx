"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDailyReport } from "@/lib/db/mutations";
import type { TimeOption } from "@/lib/db/queries";

export function DailyReportForm({ jobOptions }: { jobOptions: TimeOption[] }) {
  const router = useRouter();
  const [jobId, setJobId] = useState("");
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [workCompleted, setWorkCompleted] = useState("");
  const [delaysIssues, setDelaysIssues] = useState("");
  const [materialsDeliveries, setMaterialsDeliveries] = useState("");
  const [safetyNotes, setSafetyNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit() {
    if (!jobId || !reportDate || !workCompleted.trim()) {
      setMessage("Job, report date, and work completed are required.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const result = await createDailyReport({
      jobId,
      reportDate,
      workCompleted,
      delaysIssues,
      materialsDeliveries,
      safetyNotes,
    });

    if (result.error) {
      setMessage(result.error);
      setLoading(false);
      return;
    }

    setMessage("Daily report submitted.");
    setWorkCompleted("");
    setDelaysIssues("");
    setMaterialsDeliveries("");
    setSafetyNotes("");
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold">Foreman Daily Report</h2>
      <p className="mt-2 text-sm text-zinc-600">Submit daily production notes for one job.</p>

      <div className="mt-5 space-y-4">
        <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="w-full rounded-2xl border px-4 py-3">
          <option value="">Select job</option>
          {jobOptions.map((job) => (
            <option key={job.id} value={job.id}>
              {job.label}
            </option>
          ))}
        </select>

        <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="w-full rounded-2xl border px-4 py-3" />

        <textarea
          value={workCompleted}
          onChange={(e) => setWorkCompleted(e.target.value)}
          placeholder="Work completed"
          className="min-h-28 w-full rounded-2xl border px-4 py-3"
        />

        <textarea
          value={delaysIssues}
          onChange={(e) => setDelaysIssues(e.target.value)}
          placeholder="Delays / issues"
          className="min-h-20 w-full rounded-2xl border px-4 py-3"
        />

        <textarea
          value={materialsDeliveries}
          onChange={(e) => setMaterialsDeliveries(e.target.value)}
          placeholder="Materials / deliveries"
          className="min-h-20 w-full rounded-2xl border px-4 py-3"
        />

        <textarea
          value={safetyNotes}
          onChange={(e) => setSafetyNotes(e.target.value)}
          placeholder="Safety notes"
          className="min-h-20 w-full rounded-2xl border px-4 py-3"
        />

        <button onClick={handleSubmit} disabled={loading} className="rounded-2xl bg-zinc-900 px-5 py-3 text-white disabled:opacity-50">
          {loading ? "Submitting..." : "Submit Report"}
        </button>

        {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
      </div>
    </div>
  );
}
