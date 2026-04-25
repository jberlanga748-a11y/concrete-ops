"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createDailyReport, updateDailyReport } from "@/lib/db/mutations";
import type { JobAssignmentOptionRow, TimeOption } from "@/lib/db/queries";
import { formatDateOnly } from "@/lib/time/formatting";
import { postJson } from "@/lib/ai/client";
import { StatusChip } from "@/components/ui/feedback";
import { FieldLabel } from "@/components/ui/form";
import { OperationalCard, SectionHeader } from "@/components/ui/page-primitives";
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

const fieldClassName =
  "w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500";
const textAreaClassName = `${fieldClassName} min-h-28 resize-y`;

function FormCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <OperationalCard className="p-4">
      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-blue-700">{eyebrow}</p>
      <SectionHeader title={title} description={description} />
      <div className="mt-4 space-y-4">{children}</div>
    </OperationalCard>
  );
}

function FieldHint({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-xs font-medium leading-5 text-slate-500">{children}</p>;
}

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
  const selectedJobLabel = jobOptions.find((job) => job.id === jobId)?.label ?? "No job selected yet";
  const populatedCrewEntries = crewEntries.filter((entry) => entry.employeeId);
  const totalCrewHours = populatedCrewEntries.reduce((sum, entry) => sum + (Number(entry.hours) || 0), 0);
  const followUpSections = [delaysIssues, materialsDeliveries, safetyNotes].filter((value) => value.trim().length > 0).length;

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
      const { response, data: body } = await postJson<{
        cleaned?: {
          workCompleted: string;
          delaysIssues: string;
          materialsDeliveries: string;
          safetyNotes: string;
          officeSummary?: string;
        };
        error?: string;
      }>("/api/ai/daily-report-cleanup", {
        jobLabel: selectedJob?.label,
        reportDate,
        workCompleted,
        delaysIssues,
        materialsDeliveries,
        safetyNotes,
      });

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
        title: "Notes cleaned for clearer review",
        description: body.cleaned.officeSummary || "The report sections were tightened into clearer handoff language.",
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
        : "The new report is ready to review.",
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
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),360px] xl:items-start">
        <div className="space-y-4">
          <OperationalCard className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-700">
                  {reportId ? "Update field report" : "New field report"}
                </p>
                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                  Capture the record payroll, PMs, and field leaders can read in one pass.
                </h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                  Keep the notes clear, the crew rows intentional, and the follow-up details easy to scan while the day is still fresh.
                </p>
              </div>
              <StatusChip tone={reportId ? "info" : "neutral"}>{reportId ? "Editing record" : "Ready to submit"}</StatusChip>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Job</p>
                <p className="mt-2 text-sm font-black text-slate-950">{selectedJobLabel}</p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Report date</p>
                <p className="mt-2 text-sm font-black text-slate-950">{formatDateOnly(reportDate)}</p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Crew rows</p>
                <p className="mt-2 text-sm font-black text-slate-950">
                  {populatedCrewEntries.length} ready · {totalCrewHours.toFixed(2)} hrs
                </p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Follow-up notes</p>
                <p className="mt-2 text-sm font-black text-slate-950">
                  {followUpSections > 0 ? `${followUpSections} section${followUpSections === 1 ? "" : "s"} ready` : "No follow-up notes yet"}
                </p>
              </div>
            </div>
          </OperationalCard>

          <FormCard
            eyebrow="Context"
            title="Report basics that anchor the record"
            description="Start with the project and date so the next reviewer can place this report correctly before reading the narrative."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel required>Job</FieldLabel>
                <select value={jobId} onChange={(e) => setJobId(e.target.value)} className={fieldClassName}>
                  <option value="">Select job</option>
                  {jobOptions.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.label}
                    </option>
                  ))}
                </select>
                <FieldHint>Choose the project this report should live under for downstream review, documents, and exports.</FieldHint>
              </div>

              <div>
                <FieldLabel required>Report date</FieldLabel>
                <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className={fieldClassName} />
                <FieldHint>Use the day the work happened so logs, uploads, and follow-up stay aligned.</FieldHint>
              </div>
            </div>
          </FormCard>

          <FormCard
            eyebrow="Production"
            title="Work completed"
            description="Write the core field narrative the next reviewer should understand without a follow-up call."
          >
            <div>
              <FieldLabel required>Work completed</FieldLabel>
              <textarea
                value={workCompleted}
                onChange={(e) => setWorkCompleted(e.target.value)}
                placeholder="Summarize the production work completed on site today."
                className={`${textAreaClassName} min-h-40`}
              />
              <FieldHint>Be specific about progress, areas worked, and major milestones or decisions that matter later.</FieldHint>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-black text-slate-950">Readable cleanup</p>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                    Tighten the narrative into clearer handoff language without changing the facts captured in the field note.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCleanupWithAI}
                  disabled={assistantLoading || loading}
                  className="inline-flex items-center justify-center rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {assistantLoading ? "Cleaning..." : "Clean up with AI"}
                </button>
              </div>
            </div>
          </FormCard>

          <FormCard
            eyebrow="Crew"
            title="Crew rows and labor context"
            description="Use crew rows when the record needs a clearer view of who was on site, how long they worked, and any notes worth keeping."
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium leading-6 text-slate-600">
                Crew rows are optional, but they help staffing questions, payroll review, and after-the-fact field context.
              </p>
              <button
                type="button"
                onClick={addCrewEntry}
                className="inline-flex items-center justify-center rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-blue-50"
              >
                Add crew row
              </button>
            </div>

            {!jobId && assignmentOptions.length > 0 ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-4">
                <p className="text-sm font-black text-slate-950">Pick a job to narrow the crew list.</p>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                  You can still add crew rows now, but selecting the job first keeps employee choices scoped to the right assignment list.
                </p>
              </div>
            ) : null}

            {jobId && scopedAssignmentOptions.length === 0 ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-4">
                <p className="text-sm font-black text-slate-950">No active crew assignments for this job yet.</p>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                  Add assignments from the Job Hub first if you want the crew row picker to show a scoped list for this project.
                </p>
              </div>
            ) : null}

            <div className="space-y-3">
              {crewEntries.map((entry, index) => {
                const crewLabel =
                  scopedAssignmentOptions.find((option) => option.employeeId === entry.employeeId)?.employeeLabel ||
                  assignmentOptions.find((option) => option.employeeId === entry.employeeId)?.employeeLabel ||
                  "Select crew member";

                return (
                  <div
                    key={`${index}-${entry.employeeId || "empty"}`}
                    className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-950/5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-700">
                          Crew row {String(index + 1).padStart(2, "0")}
                        </p>
                        <p className="mt-2 text-sm font-black text-slate-950">{crewLabel}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCrewEntry(index)}
                        className="inline-flex items-center justify-center rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-blue-50"
                      >
                        Remove row
                      </button>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-[1.4fr,0.6fr]">
                      <div>
                        <FieldLabel>Employee</FieldLabel>
                        <select
                          value={entry.employeeId}
                          onChange={(e) => updateCrewEntry(index, { employeeId: e.target.value })}
                          className={fieldClassName}
                        >
                          <option value="">Select crew member</option>
                          {scopedAssignmentOptions.map((option) => (
                            <option key={`${option.jobId}-${option.employeeId}`} value={option.employeeId}>
                              {option.employeeLabel}
                            </option>
                          ))}
                        </select>
                        <FieldHint>Choose the assigned crew member this row should represent.</FieldHint>
                      </div>

                      <div>
                        <FieldLabel>Hours</FieldLabel>
                        <input
                          type="number"
                          min="0"
                          step="0.25"
                          value={entry.hours}
                          onChange={(e) => updateCrewEntry(index, { hours: e.target.value })}
                          className={fieldClassName}
                          placeholder="Hours"
                        />
                        <FieldHint>Keep hours greater than zero for any row you plan to save.</FieldHint>
                      </div>
                    </div>

                    <div className="mt-4">
                      <FieldLabel>Notes</FieldLabel>
                      <textarea
                        value={entry.notes}
                        onChange={(e) => updateCrewEntry(index, { notes: e.target.value })}
                        placeholder="Add crew-specific notes if this row needs extra context."
                        className={`${textAreaClassName} min-h-24`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </FormCard>

          <FormCard
            eyebrow="Follow-up"
            title="Operations notes that tend to come up later"
            description="Capture delays, deliveries, and safety details once so later follow-up does not rely on memory."
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-blue-100 bg-white p-4">
                <FieldLabel>Delays / issues</FieldLabel>
                <textarea
                  value={delaysIssues}
                  onChange={(e) => setDelaysIssues(e.target.value)}
                  placeholder="Anything blocking progress?"
                  className={`${textAreaClassName} min-h-28`}
                />
                <FieldHint>Note hold-ups, inspections, access issues, or coordination gaps that need follow-up.</FieldHint>
              </div>

              <div className="rounded-xl border border-blue-100 bg-white p-4">
                <FieldLabel>Materials / deliveries</FieldLabel>
                <textarea
                  value={materialsDeliveries}
                  onChange={(e) => setMaterialsDeliveries(e.target.value)}
                  placeholder="Deliveries, shortages, substitutions"
                  className={`${textAreaClassName} min-h-28`}
                />
                <FieldHint>Call out arrivals, shortages, substitutions, or delivery timing that matters later.</FieldHint>
              </div>

              <div className="rounded-xl border border-blue-100 bg-white p-4">
                <FieldLabel>Safety notes</FieldLabel>
                <textarea
                  value={safetyNotes}
                  onChange={(e) => setSafetyNotes(e.target.value)}
                  placeholder="Safety observations or incidents"
                  className={`${textAreaClassName} min-h-28`}
                />
                <FieldHint>Capture safety observations, reminders, or incidents that should stay attached to the record.</FieldHint>
              </div>
            </div>
          </FormCard>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6">
          <OperationalCard className="p-4">
            <p className="text-xs font-black uppercase tracking-widest text-blue-700">Live summary</p>
            <h3 className="mt-1 text-lg font-black text-slate-950">
              {selectedJobLabel !== "No job selected yet" ? selectedJobLabel : "Daily report in progress"}
            </h3>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
              {workCompleted.trim() || "Add the work narrative and this panel becomes the quick summary anyone can scan before opening the full record."}
            </p>

            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Report date</p>
                <p className="mt-2 text-sm font-black text-slate-950">{formatDateOnly(reportDate)}</p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Crew rows ready</p>
                <p className="mt-2 text-sm font-black text-slate-950">
                  {populatedCrewEntries.length} row{populatedCrewEntries.length === 1 ? "" : "s"} · {totalCrewHours.toFixed(2)} hrs
                </p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Follow-up sections</p>
                <p className="mt-2 text-sm font-black text-slate-950">
                  {followUpSections > 0 ? `${followUpSections} section${followUpSections === 1 ? "" : "s"} filled` : "None yet"}
                </p>
              </div>
            </div>
          </OperationalCard>

          <OperationalCard className="p-4">
            <p className="text-xs font-black uppercase tracking-widest text-blue-700">Before you save</p>
            <ul className="mt-4 space-y-3 text-sm font-medium leading-6 text-slate-600">
              <li className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                Confirm the job and report date match the actual workday the team will reference later.
              </li>
              <li className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                Make the work narrative specific enough that a PM, payroll reviewer, or field lead can understand the day without calling the field.
              </li>
              <li className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                Add crew rows only when they improve clarity, and keep hours accurate for any row you plan to save.
              </li>
            </ul>
          </OperationalCard>
        </aside>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-sm shadow-blue-950/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-2xl text-sm font-medium leading-6 text-slate-600">
            Job, report date, and work completed are required. Save once the record is clear enough for the next person to act without asking the field to restate the day.
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Saving..." : reportId ? "Save report" : "Submit report"}
          </button>
        </div>
      </div>
    </div>
  );
}
