import Link from "next/link";
import { EmployeeUploadForm } from "@/components/uploads/EmployeeUploadForm";
import { getDailyReportOptions, getDailyReportJobOptions } from "@/lib/db/queries";

export default async function NewUploadPage() {
  const [jobOptions, dailyReportOptions] = await Promise.all([getDailyReportJobOptions(), getDailyReportOptions()]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">New Upload</h1>
            <p className="mt-2 text-zinc-600">Photo and document upload tied to job records.</p>
          </div>
          <Link href="/dashboard/uploads" className="rounded-xl border px-4 py-2 text-sm">
            Back to Uploads
          </Link>
        </div>
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
  );
}
