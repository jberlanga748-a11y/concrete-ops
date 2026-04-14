import Link from "next/link";
import { EmployeeUploadForm } from "@/components/uploads/EmployeeUploadForm";
import { getDailyReportJobOptions, getDailyReportOptions } from "@/lib/db/queries";

export default async function EmployeeUploadsPage() {
  const [jobOptions, dailyReportOptions] = await Promise.all([getDailyReportJobOptions(), getDailyReportOptions()]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/employee"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition-all hover:bg-muted"
        >
          <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Upload Photo</h1>
          <p className="text-sm text-muted-foreground">Attach photos and documents to jobs</p>
        </div>
      </div>

      <EmployeeUploadForm jobOptions={jobOptions} dailyReportOptions={dailyReportOptions} />
    </div>
  );
}
