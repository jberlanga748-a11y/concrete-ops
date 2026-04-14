import { EmployeeUploadForm } from "@/components/uploads/EmployeeUploadForm";
import { getDailyReportJobOptions, getDailyReportOptions } from "@/lib/db/queries";

export default async function EmployeeUploadsPage() {
  const [jobOptions, dailyReportOptions] = await Promise.all([getDailyReportJobOptions(), getDailyReportOptions()]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">Employee Uploads</h1>
        <p className="mt-3 text-zinc-600">Upload progress photos or supporting documents.</p>
      </div>

      <EmployeeUploadForm jobOptions={jobOptions} dailyReportOptions={dailyReportOptions} />
    </div>
  );
}
