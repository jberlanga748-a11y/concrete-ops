import Link from "next/link";
import { notFound } from "next/navigation";
import { DailyReportForm } from "@/components/daily-reports/DailyReportForm";
import { KpiTile, PageHeader } from "@/components/ui/page-primitives";
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
    <div>
      <PageHeader
        eyebrow="Daily Reports"
        title="Edit Daily Report"
        description="Refresh the jobsite narrative, tune crew rows, and keep the field record clear for the next reviewer."
        actions={
          <Link href={`/dashboard/daily-reports/${report.id}`} className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-blue-50">
              Back to report
            </Link>
        }
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <KpiTile label="Report date" value={formatDateOnly(report.report_date)} helper="Current field record date." />
          <KpiTile label="Crew rows" value={String((crewEntries ?? []).length)} helper={`${totalCrewHours.toFixed(2)} hrs currently captured.`} />
          <KpiTile label="Job" value="Selected" helper={selectedJobLabel} />
        </div>

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
    </div>
  );
}
