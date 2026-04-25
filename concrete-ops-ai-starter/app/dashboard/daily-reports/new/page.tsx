import Link from "next/link";
import { DailyReportForm } from "@/components/daily-reports/DailyReportForm";
import { KpiTile, PageHeader } from "@/components/ui/page-primitives";
import { getActiveJobAssignmentOptions, getDailyReportJobOptions } from "@/lib/db/queries";

export default async function NewDailyReportPage() {
  const [jobOptions, assignmentOptions] = await Promise.all([
    getDailyReportJobOptions(),
    getActiveJobAssignmentOptions(),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Daily Reports"
        title="Capture a daily record the whole team can trust on the first pass."
        description="Start with the job, date, and production notes that matter most. This workflow keeps the reporting record focused on readable field context, clearer crew details, and faster shared follow-up."
        actions={
          <Link href="/dashboard/daily-reports" className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-blue-50">
              Back to daily reports
            </Link>
        }
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <KpiTile label="Available jobs" value={String(jobOptions.length)} helper="Projects ready to receive a report." />
          <KpiTile label="Active crew options" value={String(assignmentOptions.length)} helper="Scoped assignment choices for crew rows." />
          <KpiTile label="Required inputs" value="3" helper="Job, report date, and work completed." />
        </div>

        <DailyReportForm jobOptions={jobOptions} assignmentOptions={assignmentOptions} />
      </div>
    </div>
  );
}
