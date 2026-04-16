"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createDailyReport, updateDailyReport } from "@/lib/db/mutations";
import type { JobAssignmentOptionRow, TimeOption } from "@/lib/db/queries";
import { FieldLabel, FormActions, FormSection } from "@/components/ui/form";
import { useToast } from "@/components/ui/ToastProvider";

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
  const [assistantLoading, setAssistantLoading] = useState(false);
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
      pushToast({
        tone: "error",
        title: "Add more work notes first",
        description: "Provide at least a short work-completed note before running the assistant.",
      });
      return;
    }

    setAssistantLoading(true);

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
        pushToast({
          tone: "error",
          title: "Daily Report Assistant unavailable",
          description: body?.error || "We couldn't clean up the report notes right now. Please try again.",
        });
        setAssistantLoading(false);
        return;
      }

      setWorkCompleted(body.cleaned.workCompleted);
      setDelaysIssues(body.cleaned.delaysIssues);
      setMaterialsDeliveries(body.cleaned.materialsDeliveries);
      setSafetyNotes(body.cleaned.safetyNotes);

      pushToast({
        tone: "success",
        title: "Notes cleaned for office review",
        description: body.cleaned.officeSummary || "The report sections were tightened into concise, office-ready language.",
      });
    } catch {
      pushToast({
        tone: "error",
        title: "Daily Report Assistant unavailable",
        description: "We couldn't reach the assistant service right now. Please try again.",
      });
    } finally {
      setAssistantLoading(false);
    }
  }

  async function handleSubmit() {
    if (!jobId || !reportDate || !workCompleted.trim()) {
      pushToast({
        tone: "error",
        title: "Missing required report details",
        description: "Job, report date, and work completed are required before the report can be saved.",
      });
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
      pushToast({
        tone: "error",
        title: "Crew hours need attention",
        description: "Any crew row you keep on the report needs hours greater than zero.",
      });
      return;
    }

    setLoading(true);

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
      pushToast({
        tone: "error",
        title: "Daily report not saved",
        description: "We couldn’t save that report right now. Try again in a moment.",
      });
      setLoading(false);
      return;
    }

    pushToast({
      tone: "success",
      title: reportId ? "Daily report updated" : "Daily report submitted",
      description: reportId
        ? "Your field notes and crew entries are updated."
        : "The new report is ready for office review.",
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
    <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Field Report</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">Foreman Daily Report</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Capture production notes and a clean crew breakdown while the day is still fresh.
        </p>
      </div>

      <div className="mt-5 space-y-4">
        <FormSection
          title="Report details"
          description="Start with the basics so the office can understand what happened, where, and when."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel required>Job</FieldLabel>
              <select
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
              >
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
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
              />
            </div>
          </div>

          <div>
            <FieldLabel required>Work completed</FieldLabel>
            <textarea
              value={workCompleted}
              onChange={(e) => setWorkCompleted(e.target.value)}
              placeholder="What was completed today?"
              className="min-h-32 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
            />
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
            <button
              onClick={addCrewEntry}
              type="button"
              className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
            >
              Add crew row
            </button>
          </div>

          <div className="space-y-3">
            {crewEntries.map((entry, index) => (
              <div key={`${index}-${entry.employeeId}`} className="rounded-[24px] border border-zinc-200 bg-white p-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="xl:col-span-2">
                    <FieldLabel>Employee</FieldLabel>
                    <select
                      value={entry.employeeId}
                      onChange={(e) => updateCrewEntry(index, { employeeId: e.target.value })}
                      className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
                    >
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
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      value={entry.hours}
                      onChange={(e) => updateCrewEntry(index, { hours: e.target.value })}
                      className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
                      placeholder="Hours"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => removeCrewEntry(index)}
                      type="button"
                      className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
                    >
                      Remove row
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <FieldLabel>Notes</FieldLabel>
                  <textarea
                    value={entry.notes}
                    onChange={(e) => updateCrewEntry(index, { notes: e.target.value })}
                    placeholder="Crew notes"
                    className="min-h-24 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
                  />
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

        <FormSection
          title="Operations notes"
          description="Capture the small details that usually get asked about later."
        >
          <div>
            <FieldLabel>Delays / issues</FieldLabel>
            <textarea
              value={delaysIssues}
              onChange={(e) => setDelaysIssues(e.target.value)}
              placeholder="Anything blocking progress?"
              className="min-h-24 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
            />
          </div>

          <div>
            <FieldLabel>Materials / deliveries</FieldLabel>
            <textarea
              value={materialsDeliveries}
              onChange={(e) => setMaterialsDeliveries(e.target.value)}
              placeholder="Deliveries, shortages, substitutions"
              className="min-h-24 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
            />
          </div>

          <div>
            <FieldLabel>Safety notes</FieldLabel>
            <textarea
              value={safetyNotes}
              onChange={(e) => setSafetyNotes(e.target.value)}
              placeholder="Safety observations or incidents"
              className="min-h-24 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
            />
          </div>
        </FormSection>

        <FormActions hint="Required fields: job, date, and work completed. Crew rows are optional but help the office understand who was on site.">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Saving..." : reportId ? "Save Daily Report" : "Submit Daily Report"}
          </button>
        </FormActions>
      </div>
    </div>
  );
}
