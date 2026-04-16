"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createDailyReport, updateDailyReport } from "@/lib/db/mutations";
import type { JobAssignmentOptionRow, TimeOption } from "@/lib/db/queries";
import { useToast } from "@/components/ui/ToastProvider";
import {
  InlineNotice,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  selectClassName,
  surfaceClassName,
  textareaClassName,
} from "@/components/ui/primitives";

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
  const { pushToast } = useToast();
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
      pushToast({ tone: "error", title: "Fill in the required report fields." });
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
      pushToast({ tone: "error", title: "Crew row hours must be greater than zero." });
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
      pushToast({ tone: "error", title: "Could not save daily report.", description: "Please review the report details and try again." });
      setLoading(false);
      return;
    }

    setMessageType("success");
    setMessage(reportId ? "Daily report updated." : "Daily report submitted.");
    pushToast({
      tone: "success",
      title: reportId ? "Daily report updated." : "Daily report submitted.",
      description: "The report and any crew rows are now saved.",
    });
    setLoading(false);

    if (reportId) {
      router.push(`/dashboard/daily-reports/${reportId}`);
      router.refresh();
    } else {
      router.push(`/dashboard/daily-reports/${result.data.id}`);
    }
  }

  return (
    <div className={`${surfaceClassName} p-6`}>
      <h2 className="text-2xl font-semibold">Foreman Daily Report</h2>
      <p className="mt-2 text-sm text-zinc-600">Capture production notes and a simple crew breakdown while the day is still fresh.</p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700">Job</label>
          <select value={jobId} onChange={(e) => setJobId(e.target.value)} className={selectClassName}>
            <option value="">Select job</option>
            {jobOptions.map((job) => (
              <option key={job.id} value={job.id}>
                {job.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700">Report date</label>
          <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className={inputClassName} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700">Work completed *</label>
          <textarea value={workCompleted} onChange={(e) => setWorkCompleted(e.target.value)} placeholder="What was completed today?" className={`${textareaClassName} min-h-28`} />
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">Crew Entries</p>
              <p className="mt-1 text-sm text-zinc-600">Add the people who worked this job today, how many hours they put in, and any notes worth keeping.</p>
            </div>
            <button onClick={addCrewEntry} type="button" className={secondaryButtonClassName}>
              Add Crew Row
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {crewEntries.map((entry, index) => (
              <div key={`${index}-${entry.employeeId}`} className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <select value={entry.employeeId} onChange={(e) => updateCrewEntry(index, { employeeId: e.target.value })} className={`${selectClassName} xl:col-span-2`}>
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
                    className={inputClassName}
                    placeholder="Hours"
                  />
                  <button onClick={() => removeCrewEntry(index)} type="button" className={secondaryButtonClassName}>
                    Remove
                  </button>
                </div>
                <textarea
                  value={entry.notes}
                  onChange={(e) => updateCrewEntry(index, { notes: e.target.value })}
                  placeholder="Crew notes"
                  className={`${textareaClassName} mt-3 min-h-20`}
                />
              </div>
            ))}

            {jobId && scopedAssignmentOptions.length === 0 ? (
              <p className="text-sm text-zinc-500">No active crew assignments found for this job yet. You can add assignments from the Job Hub first.</p>
            ) : null}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700">Delays / issues</label>
          <textarea value={delaysIssues} onChange={(e) => setDelaysIssues(e.target.value)} placeholder="Anything blocking progress?" className={`${textareaClassName} min-h-20`} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700">Materials / deliveries</label>
          <textarea value={materialsDeliveries} onChange={(e) => setMaterialsDeliveries(e.target.value)} placeholder="Deliveries, shortages, substitutions" className={`${textareaClassName} min-h-20`} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700">Safety notes</label>
          <textarea value={safetyNotes} onChange={(e) => setSafetyNotes(e.target.value)} placeholder="Safety observations or incidents" className={`${textareaClassName} min-h-20`} />
        </div>

        <div className="sticky bottom-24 z-10 -mx-2 rounded-3xl border border-zinc-200 bg-white/95 p-3 shadow-lg backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:shadow-none">
          <button onClick={handleSubmit} disabled={loading} className={primaryButtonClassName}>
            {loading ? "Saving..." : reportId ? "Save Daily Report" : "Submit Daily Report"}
          </button>
        </div>

        {message ? (
          <InlineNotice tone={messageType === "error" ? "error" : messageType === "success" ? "success" : "neutral"}>
            {message}
          </InlineNotice>
        ) : (
          <InlineNotice tone="neutral">Required fields: job, date, and work completed. Crew rows stay optional but field-friendly.</InlineNotice>
        )}
      </div>
    </div>
  );
}
