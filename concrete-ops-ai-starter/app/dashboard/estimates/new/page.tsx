import Link from "next/link";
import { EstimateForm } from "@/components/estimates/EstimateForm";
import { getCustomerOptions, getDailyReportJobOptions } from "@/lib/db/queries";

export default async function NewEstimatePage() {
  const [customerOptions, jobOptions] = await Promise.all([
    getCustomerOptions(true),
    getDailyReportJobOptions(),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">New Estimate</h1>
            <p className="mt-2 text-zinc-600">Create a working estimate with practical line items before job execution.</p>
          </div>
          <Link href="/dashboard/estimates" className="rounded-xl border px-4 py-2 text-sm">
            Back to Estimates
          </Link>
        </div>
      </div>

      <EstimateForm customerOptions={customerOptions} jobOptions={jobOptions} />
    </div>
  );
}
