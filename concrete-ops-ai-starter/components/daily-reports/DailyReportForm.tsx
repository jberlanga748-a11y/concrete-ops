"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createDailyReport, updateDailyReport } from "@/lib/db/mutations";
import type { JobAssignmentOptionRow, TimeOption } from "@/lib/db/queries";

type CrewRow = {
  employeeId: string;
  hours: string;
  notes: string;
};

type DailyReportFormValues = {
  jobId: string;
  reportDate: string;
  workCompleted: string;
  delaysIssues: string | null;
  materialsDeliveries: string | null;
  safetyNotes: string | null;
  crewEntries: {
    employeeId: string;
    hours: number;
    notes: string | null;
  }[];
};

export function DailyReportForm({
  reportId,
  jobOptions,
  assignmentOptions,
  initialValues,
}: {
  reportId?: string;
  jobOptions: TimeOption[];
  assignmentOptions: JobAssignmentOptionRow[];
  initialValues?: DailyReportFormValues;
}) {
  const router = useRouter();
  const [jobId, setJobId] = useState(initialValues?.jobId ?? "");
  const [reportDate, setReportDate] = useState(initialValues?.reportDate ?? new Date().toISOString().slice(0, 10));
  const [workCompleted, setWorkCompleted] = useState(initialValues?.workCompleted ?? "");
  const [delaysIssues, setDelaysIssues] = useState(initialValues?.delaysIssues ?? "");
  const [materialsDeliveries, setMaterialsDeliveries] = useState(initialValues?.materialsDeliveries ?? "");
  const [safetyNotes, setSafetyNotes] = useState(initialValues?.safetyNotes ?? "");
  const [crewEntries, setCrewEntries] = useState<CrewRow[]>(
    initialValues?.crewEntries.map((entry) => ({
      employeeId: entry.employeeId,
      hours: String(entry.hours),
      notes: entry.notes ?? "",
    })) ?? [{ employeeId: "", hours: "", notes: "" }],
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  const scopedAssignmentOptions = useMemo(
    () => assignmentOptions.filter((option) => !jobId || option.jobId === jobId),
    [assignmentOptions, jobId],
  );

  function updateCrewEntry(index: number, patch: Partial<CrewRow>) {
    setCrewEntries((current) =>
      current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, ...patch } : entry)),
    );
  }

  function addCrewEntry() {
    setCrewEntries((current) => [...current, { employeeId: "", hours: "", notes: "" }]);
  }

  function removeCrewEntry(index: number) {
    setCrewEntries((current) => (current.length === 1 ? [{ employeeId: "", hours: "", notes: "" }] : current.filter((_, entryIndex) => entryIndex !== index)));
  }

  async function handleSubmit() {
    if (!jobId || !reportDate || !workCompleted.trim()) {
      setMessageType("error");
      setMessage("Job, report date, and work completed are required.");
      return;
    }

    const normalizedCrewEntries = crewEntries
      .filter((entry) => entry.employeeId)
      .map((entry) => ({
        employeeId: entry.employeeId,
        hours: Number(entry.hours) || 0,
        notes: entry.notes,
      }));

    if (normalizedCrewEntries.some((entry) => entry.hours <= 0)) {
      setMessageType("error");
      setMessage("Crew entry hours must be greater than zero.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const payload = {
      jobId,
      reportDate,
      workCompleted,
      delaysIssues,
      materialsDeliveries,
      safetyNotes,
      crewEntries: normalizedCrewEntries,
    };

    const result = reportId ? await updateDailyReport(reportId, payload) : await createDailyReport(payload);

    if (result.error || !result.data) {
      setMessageType("error");
      setMessage(result.error || "Failed to save daily report.");
      setLoading(false);
      return;
    }

    setMessageType("success");
    setMessage(reportId ? "Daily report updated." : "Daily report submitted.");
    setLoading(false);

    if (reportId) {
      router.push(`/dashboard/daily-reports/${reportId}`);
      router.refresh();
    } else {
      router.push(`/dashboard/daily-reports/${result.data.id}`);
    }
  }

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold">Foreman Daily Report</h2>
      <p className="mt-2 text-sm text-zinc-600">Capture production notes and a simple crew breakdown while the day is still fresh.</p>

      <div className="mt-5 space-y-4">
        <div>
          <p className="mb-2 text-sm text-zinc-600">Job</p>
          <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="w-full rounded-2xl border px-4 py-3">
            <option value="">Select job</option>
            {jobOptions.map((job) => (
              <option key={job.id} value={job.id}>
                {job.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-2 text-sm text-zinc-600">Report date</p>
          <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="w-full rounded-2xl border px-4 py-3" />
        </div>

        <div>
          <p className="mb-2 text-sm text-zinc-600">Work completed *</p>
          <textarea value={workCompleted} onChange={(e) => setWorkCompleted(e.target.value)} placeholder="What was completed today?" className="min-h-28 w-full rounded-2xl border px-4 py-3" />
        </div>

        <div className="rounded-2xl border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">Crew Entries</p>
              <p className="mt-1 text-sm text-zinc-600">Add the people who worked this job today, how many hours they put in, and any notes worth keeping.</p>
            </div>
            <button onClick={addCrewEntry} type="button" className="rounded-xl border px-4 py-2 text-sm">
              Add Crew Row
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {crewEntries.map((entry, index) => (
              <div key={`${index}-${entry.employeeId}`} className="rounded-2xl border p-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <select value={entry.employeeId} onChange={(e) => updateCrewEntry(index, { employeeId: e.target.value })} className="rounded-2xl border px-4 py-3 xl:col-span-2">
                    <option value="">Select crew member</option>
                    {scopedAssignmentOptions.map((option) => (
                      <option key={`${option.jobId}-${option.employeeId}`} value={option.employeeId}>
                        {option.employeeLabel}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    value={entry.hours}
                    onChange={(e) => updateCrewEntry(index, { hours: e.target.value })}
                    className="rounded-2xl border px-4 py-3"
                    placeholder="Hours"
                  />
                  <button onClick={() => removeCrewEntry(index)} type="button" className="rounded-2xl border px-4 py-3 text-sm">
                    Remove
                  </button>
                </div>
                <textarea
                  value={entry.notes}
                  onChange={(e) => updateCrewEntry(index, { notes: e.target.value })}
                  placeholder="Crew notes"
                  className="mt-3 min-h-20 w-full rounded-2xl border px-4 py-3"
                />
              </div>
            ))}

            {jobId && scopedAssignmentOptions.length === 0 ? (
              <p className="text-sm text-zinc-500">No active crew assignments found for this job yet. You can add assignments from the Job Hub first.</p>
            ) : null}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-zinc-600">Delays / issues</p>
          <textarea value={delaysIssues} onChange={(e) => setDelaysIssues(e.target.value)} placeholder="Anything blocking progress?" className="min-h-20 w-full rounded-2xl border px-4 py-3" />
        </div>

        <div>
          <p className="mb-2 text-sm text-zinc-600">Materials / deliveries</p>
          <textarea value={materialsDeliveries} onChange={(e) => setMaterialsDeliveries(e.target.value)} placeholder="Deliveries, shortages, substitutions" className="min-h-20 w-full rounded-2xl border px-4 py-3" />
        </div>

        <div>
          <p className="mb-2 text-sm text-zinc-600">Safety notes</p>
          <textarea value={safetyNotes} onChange={(e) => setSafetyNotes(e.target.value)} placeholder="Safety observations or incidents" className="min-h-20 w-full rounded-2xl border px-4 py-3" />
        </div>

        <button onClick={handleSubmit} disabled={loading} className="rounded-2xl bg-zinc-900 px-5 py-3 text-white disabled:opacity-50">
          {loading ? "Saving..." : reportId ? "Save Daily Report" : "Submit Daily Report"}
        </button>

        {message ? (
          <p className={`text-sm ${messageType === "error" ? "text-red-600" : messageType === "success" ? "text-green-700" : "text-zinc-600"}`}>{message}</p>
        ) : (
          <p className="text-sm text-zinc-500">Required fields: job, date, and work completed. Crew rows are optional but field-friendly.</p>
        )}
      </div>
    </div>
  );
}
