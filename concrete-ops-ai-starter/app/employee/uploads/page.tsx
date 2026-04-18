import { EmployeeUploadForm } from "@/components/uploads/EmployeeUploadForm";
import { EmptyState, ErrorPanel } from "@/components/ui/feedback";
import { getEmployeeUploadDailyReportOptions, getEmployeeUploadJobOptions } from "@/lib/db/queries";

export default async function EmployeeUploadsPage() {
  const [jobOptionsResult, dailyReportOptionsResult] = await Promise.all([
    getEmployeeUploadJobOptions(),
    getEmployeeUploadDailyReportOptions(),
  ]);
  const jobOptions = jobOptionsResult.data;
  const dailyReportOptions = dailyReportOptionsResult.data;
  const loadError = jobOptionsResult.error || dailyReportOptionsResult.error;
  const missingEmployeeLink = loadError === "No employee record is linked to your user.";

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">Employee Uploads</h1>
        <p className="mt-3 text-zinc-600">Upload progress photos or supporting documents and keep them tied to the right assigned job.</p>
      </div>

      {loadError ? missingEmployeeLink ? (
        <EmptyState
          icon="users"
          title="Your employee record is still missing"
          description="Uploads only work after the office links your login to an employee record. Once that happens, your assigned jobs and report options will show up here."
          actionHref="/employee"
          actionLabel="Back to portal home"
        />
      ) : (
        <ErrorPanel
          title="We couldn’t load employee uploads right now"
          description="The employee upload workspace is temporarily unavailable. Try refreshing the page or come back in a moment."
          actionHref="/employee/uploads"
          actionLabel="Try again"
        />
      ) : jobOptions.length === 0 ? (
        <EmptyState
          icon="file"
          title="No assigned jobs are available for uploads"
          description="Uploads have to be tied to an active job assignment so the office can use them as real field proof. Ask for an assignment, then come right back here."
          actionHref="/employee"
          actionLabel="Back to portal home"
        />
      ) : null}

      {!loadError ? <EmployeeUploadForm jobOptions={jobOptions} dailyReportOptions={dailyReportOptions} /> : null}
    </div>
  );
}
