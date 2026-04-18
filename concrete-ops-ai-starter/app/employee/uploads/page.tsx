import { EmployeeUploadForm } from "@/components/uploads/EmployeeUploadForm";
import { EmptyState } from "@/components/ui/feedback";
import { getEmployeeUploadDailyReportOptions, getEmployeeUploadJobOptions } from "@/lib/db/queries";

export default async function EmployeeUploadsPage() {
  const [jobOptions, dailyReportOptions] = await Promise.all([
    getEmployeeUploadJobOptions(),
    getEmployeeUploadDailyReportOptions(),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">Employee Uploads</h1>
        <p className="mt-3 text-zinc-600">Upload progress photos or supporting documents and keep them tied to the right assigned job.</p>
      </div>

      {jobOptions.length === 0 ? (
        <EmptyState
          icon="file"
          title="No assigned jobs are available for uploads"
          description="Uploads have to be tied to an active job assignment so the office can use them as real field proof. Ask for an assignment, then come right back here."
          actionHref="/employee"
          actionLabel="Back to portal home"
        />
      ) : null}

      <EmployeeUploadForm jobOptions={jobOptions} dailyReportOptions={dailyReportOptions} />
    </div>
  );
}
