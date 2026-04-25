import Link from "next/link";
import { EmployeeUploadForm } from "@/components/uploads/EmployeeUploadForm";
import { KpiTile, PageHeader } from "@/components/ui/page-primitives";
import { getDailyReportOptions, getDailyReportJobOptions } from "@/lib/db/queries";

export default async function NewUploadPage() {
  const [jobOptions, dailyReportOptions] = await Promise.all([getDailyReportJobOptions(), getDailyReportOptions()]);

  return (
    <div>
      <PageHeader
        eyebrow="Uploads"
        title="New Upload"
        description="Photo and document upload tied to job records."
        actions={
          <Link href="/dashboard/uploads" className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-blue-50">
            Back to Uploads
          </Link>
        }
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <KpiTile label="Jobs" value={String(jobOptions.length)} helper="Available job records for upload links." />
          <KpiTile label="Daily reports" value={String(dailyReportOptions.length)} helper="Optional report records for context." />
        </div>

        <EmployeeUploadForm
          jobOptions={jobOptions}
          dailyReportOptions={dailyReportOptions}
          title="Job Upload"
          description="Attach job photos or files to jobs and optional daily reports."
          jobRequirementHint="Uploads need an assigned job so field and office teams can trace proof back to the right project."
          tipMessage="Tip: add a clear note so the office and field teams can trace this file back to the same job record quickly."
        />
      </div>
    </div>
  );
}
