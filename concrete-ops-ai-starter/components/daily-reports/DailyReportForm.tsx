"use client";

import { useMemo, useState, type ReactNode } from "react";
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
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error" | "info">("info");
  const [crewEntries, setCrewEntries] = useState<CrewRow[]>(
    initialValues?.crewEntries.map((entry) => ({
      employeeId: entry.employeeId,
      hours: String(entry.hours),
      notes: entry.notes ?? "",
    })) ?? [{ employeeId: "", hours: "", notes: "" }],
  );
  const [loading, setLoading] = useState(false);

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
    setCrewEntries((current) =>
      current.length === 1 ? [{ employeeId: "", hours: "", notes: "" }] : current.filter((_, entryIndex) => entryIndex !== index),
    );
  }

  async function handleCleanupWithAI() {
    if (workCompleted.trim().length < 10) {
      setMessageTone("error");
      setMessage("Add at least a short work-completed note before running the assistant.");
      return;
    }

    setAssistantLoading(true);
    setMessage(null);

    try {
      const selectedJob = jobOptions.find((job) => job.id === jobId);
      const response = await fetch("/api/ai/daily-report-cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobLabel: selectedJob?.label,
          reportDate,
          workCompleted,
          delaysIssues,
          materialsDeliveries,
          safetyNotes,
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | {
            cleaned?: {
              workCompleted: string;
              delaysIssues: string;
              materialsDeliveries: string;
              safetyNotes: string;
              officeSummary?: string;
            };
            error?: string;
          }
        | null;

      if (!response.ok || !body?.cleaned) {
        setMessageTone("error");
        setMessage(body?.error || "Daily Report Assistant is unavailable right now. Please try again.");
        setAssistantLoading(false);
        return;
      }

      setWorkCompleted(body.cleaned.workCompleted);
      setDelaysIssues(body.cleaned.delaysIssues);
      setMaterialsDeliveries(body.cleaned.materialsDeliveries);
      setSafetyNotes(body.cleaned.safetyNotes);

      setMessageTone("success");
      setMessage(body.cleaned.officeSummary || "Notes cleaned into concise office-ready language.");
    } catch {
      setMessageTone("error");
      setMessage("Daily Report Assistant is unavailable right now. Please try again.");
    } finally {
      setAssistantLoading(false);
    }
  }

  async function handleSubmit() {
    if (!jobId || !reportDate || !workCompleted.trim()) {
      setMessageTone("error");
      setMessage("Job, report date, and work completed are required before saving.");
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
      setMessageTone("error");
      setMessage("Any crew row included on the report needs hours greater than zero.");
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
      setMessageTone("error");
      setMessage("We couldn't save that report right now. Please try again.");
      setLoading(false);
      return;
    }

    setMessageTone("success");
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
      <div>
        <h2 className="text-2xl font-semibold">Foreman Daily Report</h2>
        <p className="mt-2 text-sm text-zinc-600">Capture production notes and a clean crew breakdown while the day is still fresh.</p>
      </div>

      <div className="mt-5 space-y-4">
        <FormSection
          title="Report details"
          description="Start with the basics so the office can understand what happened, where, and when."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel required>Job</FieldLabel>
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
              <FieldLabel required>Report date</FieldLabel>
              <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="w-full rounded-2xl border px-4 py-3" />
            </div>
          </div>

          <div>
            <FieldLabel required>Work completed</FieldLabel>
            <textarea value={workCompleted} onChange={(e) => setWorkCompleted(e.target.value)} placeholder="What was completed today?" className="min-h-32 w-full rounded-2xl border px-4 py-3" />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCleanupWithAI}
                disabled={assistantLoading || loading}
                className="rounded-2xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-50"
              >
                {assistantLoading ? "Cleaning..." : "Clean Up With AI"}
              </button>
              <p className="text-xs leading-5 text-zinc-500">Rewrites notes into concise office-ready language without changing underlying facts.</p>
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Crew entries"
          description="Add the people who worked this job today, how many hours they put in, and any notes worth keeping."
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm leading-6 text-zinc-600">Crew rows are optional, but they make the report more useful downstream.</p>
            <button onClick={addCrewEntry} type="button" className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50">
              Add crew row
            </button>
          </div>

          <div className="space-y-3">
            {crewEntries.map((entry, index) => (
              <div key={`${index}-${entry.employeeId}`} className="rounded-2xl border p-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="xl:col-span-2">
                    <FieldLabel>Employee</FieldLabel>
                    <select value={entry.employeeId} onChange={(e) => updateCrewEntry(index, { employeeId: e.target.value })} className="w-full rounded-2xl border px-4 py-3">
                      <option value="">Select crew member</option>
                      {scopedAssignmentOptions.map((option) => (
                        <option key={`${option.jobId}-${option.employeeId}`} value={option.employeeId}>
                          {option.employeeLabel}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <FieldLabel>Hours</FieldLabel>
                    <input type="number" min="0" step="0.25" value={entry.hours} onChange={(e) => updateCrewEntry(index, { hours: e.target.value })} className="w-full rounded-2xl border px-4 py-3" placeholder="Hours" />
                  </div>

                  <div className="flex items-end">
                    <button onClick={() => removeCrewEntry(index)} type="button" className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50">
                      Remove row
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <FieldLabel>Notes</FieldLabel>
                  <textarea value={entry.notes} onChange={(e) => updateCrewEntry(index, { notes: e.target.value })} placeholder="Crew notes" className="min-h-24 w-full rounded-2xl border px-4 py-3" />
                </div>
              </div>
            ))}

            {jobId && scopedAssignmentOptions.length === 0 ? (
              <p className="text-sm leading-6 text-zinc-500">
                No active crew assignments are available for this job yet. Add assignments from the Job Hub first if you want a scoped crew list here.
              </p>
            ) : null}
          </div>
        </FormSection>

        <FormSection title="Operations notes" description="Capture the small details that usually get asked about later.">
          <div>
            <FieldLabel>Delays / issues</FieldLabel>
            <textarea value={delaysIssues} onChange={(e) => setDelaysIssues(e.target.value)} placeholder="Anything blocking progress?" className="min-h-24 w-full rounded-2xl border px-4 py-3" />
          </div>

          <div>
            <FieldLabel>Materials / deliveries</FieldLabel>
            <textarea value={materialsDeliveries} onChange={(e) => setMaterialsDeliveries(e.target.value)} placeholder="Deliveries, shortages, substitutions" className="min-h-24 w-full rounded-2xl border px-4 py-3" />
          </div>

          <div>
            <FieldLabel>Safety notes</FieldLabel>
            <textarea value={safetyNotes} onChange={(e) => setSafetyNotes(e.target.value)} placeholder="Safety observations or incidents" className="min-h-24 w-full rounded-2xl border px-4 py-3" />
          </div>
        </FormSection>

        <FormActions hint="Required fields: job, date, and work completed. Crew rows are optional but help the office understand who was on site.">
          <button onClick={handleSubmit} disabled={loading} className="rounded-2xl bg-zinc-900 px-5 py-3 text-white disabled:opacity-50">
            {loading ? "Saving..." : reportId ? "Save Daily Report" : "Submit Daily Report"}
          </button>
        </FormActions>

        {message ? (
          <p
            className={`rounded-2xl border px-4 py-3 text-sm ${
              messageTone === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : messageTone === "success"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700"
            }`}
          >
            {message}
          </p>
        ) : (
          <p className="text-sm text-zinc-500">Keep notes brief and factual so office review stays fast and clear.</p>
        )}
      </div>
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border p-5">
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? <p className="mt-1 text-sm text-zinc-600">{description}</p> : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function FormActions({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border bg-zinc-50 px-4 py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">{children}</div>
        {hint ? <p className="text-sm text-zinc-600 md:text-right">{hint}</p> : null}
      </div>
    </div>
  );
}

function FieldLabel({ children, required = false }: { children: ReactNode; required?: boolean }) {
  return (
    <p className="mb-2 text-sm font-medium text-zinc-700">
      {children}
      {required ? <span className="ml-1 text-orange-600">*</span> : null}
    </p>
  );
}
