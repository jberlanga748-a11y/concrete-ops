import Link from "next/link";
import { notFound } from "next/navigation";
import { DailyReportForm } from "@/components/daily-reports/DailyReportForm";
import {
  getActiveJobAssignmentOptions,
  getDailyReportById,
  getDailyReportCrewEntries,
  getDailyReportJobOptions,
} from "@/lib/db/queries";
import { formatDateOnly } from "@/lib/time/formatting";

function getJobLabel(label: string | undefined) {
  return label ?? "Job not found";
}

export default async function EditDailyReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ data: report }, { data: crewEntries }, jobOptions, assignmentOptions] = await Promise.all([
    getDailyReportById(id),
    getDailyReportCrewEntries(id),
    getDailyReportJobOptions(),
    getActiveJobAssignmentOptions(),
  ]);

  if (!report) notFound();

  const selectedJobLabel = getJobLabel(jobOptions.find((job) => job.id === report.job_id)?.label);
  const totalCrewHours = (crewEntries ?? []).reduce((sum, entry) => sum + (Number(entry.hours) || 0), 0);

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-zinc-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(245,247,248,0.92))] p-6 shadow-[0_20px_48px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.35fr,0.95fr] xl:items-start">
          <div>
            <Link
              href={`/dashboard/daily-reports/${report.id}`}
              className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500 transition hover:text-zinc-900"
            >
              Back to report
            </Link>
            <p className="mt-4 font-app-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Update field record</p>
            <h1 className="mt-3 text-[clamp(2rem,3vw,3.4rem)] font-semibold tracking-[-0.06em] text-[#101828]">
              Tighten the report without disturbing the workflow around it.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-600 sm:text-base">
              Refresh the jobsite narrative, tune the crew details, and keep the record clear enough that the next reviewer can keep moving without a second call to the field.
            </p>
          </div>

          <div className="rounded-[28px] border border-[#18232d] bg-[#0f1820] p-5 text-zinc-100 shadow-[0_20px_48px_rgba(15,23,42,0.18)] sm:p-6">
            <p className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">Current record</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Report date</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">{formatDateOnly(report.report_date)}</p>
                <p className="mt-1 text-sm text-zinc-300">Current date attached to this field record.</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Crew rows</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">{(crewEntries ?? []).length}</p>
                <p className="mt-1 text-sm text-zinc-300">{totalCrewHours.toFixed(2)} hrs currently captured on the report.</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Job</p>
                <p className="mt-2 text-sm font-semibold tracking-[-0.03em] text-white">{selectedJobLabel}</p>
                <p className="mt-1 text-sm text-zinc-300">Project this report remains tied to.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <DailyReportForm
        reportId={report.id}
        jobOptions={jobOptions}
        assignmentOptions={assignmentOptions}
        initialValues={{
          jobId: report.job_id,
          reportDate: report.report_date,
          workCompleted: report.work_completed,
          delaysIssues: report.delays_issues,
          materialsDeliveries: report.materials_deliveries,
          safetyNotes: report.safety_notes,
          crewEntries: (crewEntries ?? []).map((entry) => ({
            employeeId: entry.employee_id,
            hours: entry.hours,
            notes: entry.notes,
          })),
        }}
      />
    </div>
  );
}
