import Link from "next/link";
import { EstimateForm } from "@/components/estimates/EstimateForm";
import { KpiTile, PageHeader } from "@/components/ui/page-primitives";
import { getCustomerOptions, getDailyReportJobOptions } from "@/lib/db/queries";

export default async function NewEstimatePage() {
  const [customerOptions, jobOptions] = await Promise.all([
    getCustomerOptions(true),
    getDailyReportJobOptions(),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Office"
        title="New Estimate"
        description="Create a working estimate with practical line items before job execution."
        actions={
          <Link href="/dashboard/estimates" className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-blue-50">
            Back to Estimates
          </Link>
        }
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <KpiTile label="Customers" value={String(customerOptions.length)} helper="Active customer options ready for pricing." />
          <KpiTile label="Linked jobs" value={String(jobOptions.length)} helper="Available jobs for estimate context." />
        </div>
        <EstimateForm customerOptions={customerOptions} jobOptions={jobOptions} />
      </div>
    </div>
  );
}
