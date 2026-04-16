import { EmployeeUploadForm } from "@/components/uploads/EmployeeUploadForm";
import { PageHeader } from "@/components/ui/primitives";
import { getDailyReportJobOptions, getDailyReportOptions } from "@/lib/db/queries";

export default async function EmployeeUploadsPage() {
  const [jobOptions, dailyReportOptions] = await Promise.all([getDailyReportJobOptions(), getDailyReportOptions()]);

  return (
    <div className="space-y-6">
      <PageHeader title="Employee Uploads" description="Upload progress photos or supporting documents from the field without extra admin steps." />

      <EmployeeUploadForm jobOptions={jobOptions} dailyReportOptions={dailyReportOptions} />
    </div>
  );
}
