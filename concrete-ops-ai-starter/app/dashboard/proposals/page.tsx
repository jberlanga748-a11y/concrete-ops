import Link from "next/link";
import { EmptyState, ErrorPanel } from "@/components/ui/feedback";
import { getProposals, type ProposalListRow } from "@/lib/db/queries";

function getCustomer(customers: ProposalListRow["customers"]) {
  if (!customers) return "—";
  if (Array.isArray(customers)) return customers[0]?.name ?? "—";
  return customers.name;
}

function getJob(jobs: ProposalListRow["jobs"]) {
  if (!jobs) return "—";
  if (Array.isArray(jobs)) {
    const job = jobs[0];
    return job ? `${job.job_number} · ${job.name}` : "—";
  }
  return `${jobs.job_number} · ${jobs.name}`;
}

export default async function ProposalsPage() {
  const { data: proposals, error } = await getProposals();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Proposals</h1>
            <p className="mt-2 text-zinc-600">Create client-facing proposals with clear scope, exclusions, and terms.</p>
          </div>
          <Link href="/dashboard/proposals/new" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white">
            New Proposal
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        {error ? (
          <div className="p-4">
            <ErrorPanel
              title="We couldn’t load proposals right now"
              description="The proposal board is temporarily unavailable. Try refreshing the page or come back in a moment."
              actionHref="/dashboard/proposals"
              actionLabel="Try again"
            />
          </div>
        ) : (proposals ?? []).length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon="file"
              title="No proposals created yet"
              description="Create the first proposal so customer-facing scope, exclusions, and terms have a ready-to-send draft."
              actionHref="/dashboard/proposals/new"
              actionLabel="Create proposal"
            />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-100">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Job</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Open</th>
              </tr>
            </thead>
            <tbody>
              {(proposals ?? []).map((proposal) => (
                <tr key={proposal.id} className="border-t">
                  <td className="px-4 py-4">{proposal.title}</td>
                  <td className="px-4 py-4">{getCustomer(proposal.customers)}</td>
                  <td className="px-4 py-4">{getJob(proposal.jobs)}</td>
                  <td className="px-4 py-4">{proposal.status}</td>
                  <td className="px-4 py-4">
                    <Link href={`/dashboard/proposals/${proposal.id}`} className="underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
