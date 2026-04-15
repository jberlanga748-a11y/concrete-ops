import Link from "next/link";
import { DailyReportForm } from "@/components/daily-reports/DailyReportForm";
import { getDailyReportJobOptions } from "@/lib/db/queries";

export default async function NewDailyReportPage() {
  const jobOptions = await getDailyReportJobOptions();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">New Daily Report</h1>
            <p className="mt-2 text-zinc-600">Foreman-focused submission form for daily job notes.</p>
          </div>
          <Link href="/dashboard/daily-reports" className="rounded-xl border px-4 py-2 text-sm">
            Back to Reports
          </Link>
        </div>
      </div>

      <DailyReportForm jobOptions={jobOptions} />
    </div>
  );
}
