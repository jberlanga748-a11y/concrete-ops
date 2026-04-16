import Link from "next/link";
import { ChangeOrderForm } from "@/components/change-orders/ChangeOrderForm";
import { getDailyReportJobOptions, getDailyReportOptions, getJobFiles } from "@/lib/db/queries";

export default async function NewChangeOrderPage() {
  const [jobOptions, dailyReportOptions, { data: proofFiles }] = await Promise.all([
    getDailyReportJobOptions(),
    getDailyReportOptions(),
    getJobFiles(),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Create Change Order</h1>
            <p className="mt-2 text-zinc-600">Link to job, optional daily report, and optional field proof uploads.</p>
          </div>
          <Link href="/dashboard/change-orders" className="rounded-xl border px-4 py-2 text-sm">Back to Change Orders</Link>
        </div>
      </div>

      <ChangeOrderForm jobOptions={jobOptions} dailyReportOptions={dailyReportOptions} proofFiles={proofFiles ?? []} />
    </div>
  );
}
