import Link from "next/link";
import { ProposalForm } from "@/components/proposals/ProposalForm";
import { getCustomerOptions, getDailyReportJobOptions } from "@/lib/db/queries";

export default async function NewProposalPage() {
  const [customerOptions, jobOptions] = await Promise.all([
    getCustomerOptions(true),
    getDailyReportJobOptions(),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">New Proposal</h1>
            <p className="mt-2 text-zinc-600">Draft a proposal with reusable scope, exclusions, and terms sections.</p>
          </div>
          <Link href="/dashboard/proposals" className="rounded-xl border px-4 py-2 text-sm">
            Back to Proposals
          </Link>
        </div>
      </div>

      <ProposalForm customerOptions={customerOptions} jobOptions={jobOptions} />
    </div>
  );
}
