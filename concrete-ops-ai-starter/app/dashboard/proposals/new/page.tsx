import Link from "next/link";
import { ProposalForm } from "@/components/proposals/ProposalForm";
import { KpiTile, PageHeader } from "@/components/ui/page-primitives";
import { getCustomerOptions, getDailyReportJobOptions } from "@/lib/db/queries";

export default async function NewProposalPage() {
  const [customerOptions, jobOptions] = await Promise.all([
    getCustomerOptions(true),
    getDailyReportJobOptions(),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Office"
        title="New Proposal"
        description="Draft a proposal with reusable scope, exclusions, and terms sections."
        actions={
          <Link href="/dashboard/proposals" className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-blue-50">
            Back to Proposals
          </Link>
        }
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <KpiTile label="Customers" value={String(customerOptions.length)} helper="Active customers available for proposal drafts." />
          <KpiTile label="Linked jobs" value={String(jobOptions.length)} helper="Available job records for context." />
        </div>
        <ProposalForm customerOptions={customerOptions} jobOptions={jobOptions} />
      </div>
    </div>
  );
}
