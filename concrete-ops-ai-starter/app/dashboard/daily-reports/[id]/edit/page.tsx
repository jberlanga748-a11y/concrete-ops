import Link from "next/link";
import { notFound } from "next/navigation";
import { DailyReportForm } from "@/components/daily-reports/DailyReportForm";
import {
  getActiveJobAssignmentOptions,
  getDailyReportById,
  getDailyReportCrewEntries,
  getDailyReportJobOptions,
} from "@/lib/db/queries";

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

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Edit Daily Report</h1>
            <p className="mt-2 text-zinc-600">Update field notes and crew rows without changing the larger reporting flow.</p>
          </div>
          <Link href={`/dashboard/daily-reports/${report.id}`} className="rounded-xl border px-4 py-2 text-sm">
            Back to Report
          </Link>
        </div>
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
  );
}
