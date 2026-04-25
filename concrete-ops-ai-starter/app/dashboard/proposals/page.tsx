import Link from "next/link";
import { FileTextIcon, SendIcon, UsersIcon } from "lucide-react";
import { EmptyState, ErrorPanel, StatusChip } from "@/components/ui/feedback";
import { FilterBar, KpiTile, PageHeader, RecordPreview } from "@/components/ui/page-primitives";
import {
  DataTable,
  TableActionLink,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeadCell,
  TableRow,
  TableShell,
  TableToolbar,
} from "@/components/ui/table";
import { getProposals, type ProposalListRow } from "@/lib/db/queries";
import { formatTimestampDateOnly } from "@/lib/time/formatting";

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

function getProposalStatusTone(status: string): "neutral" | "success" | "info" | "error" | "warning" {
  const normalized = status.toLowerCase();
  if (normalized.includes("approved") || normalized.includes("accepted")) return "success";
  if (normalized.includes("sent") || normalized.includes("submitted") || normalized.includes("pending")) return "warning";
  if (normalized.includes("rejected") || normalized.includes("declined")) return "error";
  if (normalized.includes("draft")) return "info";
  return "neutral";
}

export default async function ProposalsPage({
  searchParams,
}: {
  searchParams?: { status?: string };
} = {}) {
  const selectedStatus = searchParams?.status?.trim() ?? "all";
  const { data: proposals, error } = await getProposals(selectedStatus === "all" ? undefined : { status: selectedStatus });
  const proposalRows = proposals ?? [];
  const linkedCustomers = new Set(proposalRows.map((proposal) => getCustomer(proposal.customers)).filter((name) => name !== "—")).size;
  const linkedJobs = new Set(proposalRows.map((proposal) => proposal.job_id).filter(Boolean)).size;
  const readyToSend = proposalRows.filter((proposal) => ["draft", "sent"].includes(proposal.status)).length;
  const latestProposal = proposalRows[0] ?? null;
  const filterOptions = [
    { label: "All", href: "/dashboard/proposals", active: selectedStatus === "all" },
    { label: "Draft", href: "/dashboard/proposals?status=draft", active: selectedStatus === "draft" },
    { label: "Sent", href: "/dashboard/proposals?status=sent", active: selectedStatus === "sent" },
    { label: "Approved", href: "/dashboard/proposals?status=approved", active: selectedStatus === "approved" },
    { label: "Rejected", href: "/dashboard/proposals?status=rejected", active: selectedStatus === "rejected" },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Office"
        title="Proposals"
        description="Client-facing proposals need the same operational clarity as the rest of the office queue: status, customer, linked job, and the next action at first scan."
        actions={
          <>
            {latestProposal ? (
              <Link href={`/dashboard/proposals/${latestProposal.id}`} className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-blue-50">
                Open Latest
              </Link>
            ) : null}
            <Link href="/dashboard/proposals/new" className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800">
              New Proposal
            </Link>
          </>
        }
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <KpiTile label="Proposals in view" value={proposalRows.length.toString()} helper="Records matching current filter" icon={<FileTextIcon className="h-4 w-4" />} />
          <KpiTile label="Linked jobs" value={linkedJobs.toString()} helper={`${linkedCustomers} customer${linkedCustomers === 1 ? "" : "s"} represented`} icon={<UsersIcon className="h-4 w-4" />} />
          <KpiTile label="Needs movement" value={readyToSend.toString()} helper="Draft or sent proposals" icon={<SendIcon className="h-4 w-4" />} />
        </div>

        {error ? (
          <ErrorPanel
            title="We couldn’t load proposals right now"
            description="The proposal board is temporarily unavailable. Try refreshing the page or come back in a moment."
            actionHref="/dashboard/proposals"
            actionLabel="Try again"
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <div className="min-w-0">
              <FilterBar options={filterOptions} />
              <TableShell
                toolbar={
                  <TableToolbar
                    title="Proposal board"
                    description="Review customer-facing scope and send status without bouncing through individual records."
                    countLabel={`${proposalRows.length} proposal${proposalRows.length === 1 ? "" : "s"}`}
                  />
                }
              >
                <DataTable>
                  <TableHead>
                    <tr>
                      <TableHeadCell>Proposal</TableHeadCell>
                      <TableHeadCell className="hidden md:table-cell">Customer</TableHeadCell>
                      <TableHeadCell className="hidden lg:table-cell">Job</TableHeadCell>
                      <TableHeadCell>Status</TableHeadCell>
                      <TableHeadCell className="hidden sm:table-cell">Created</TableHeadCell>
                      <TableHeadCell className="w-32">Action</TableHeadCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {proposalRows.map((proposal) => (
                      <TableRow key={proposal.id}>
                        <TableCell className="min-w-[18rem]">
                          <p className="font-black text-slate-950">{proposal.title}</p>
                          <p className="mt-1 text-xs font-bold text-slate-500 md:hidden">{getCustomer(proposal.customers)} · {formatTimestampDateOnly(proposal.created_at)}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{getCustomer(proposal.customers)}</TableCell>
                        <TableCell className="hidden lg:table-cell">{getJob(proposal.jobs)}</TableCell>
                        <TableCell>
                          <StatusChip tone={getProposalStatusTone(proposal.status)}>{proposal.status}</StatusChip>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{formatTimestampDateOnly(proposal.created_at)}</TableCell>
                        <TableCell>
                          <TableActionLink href={`/dashboard/proposals/${proposal.id}`} label="Open" />
                        </TableCell>
                      </TableRow>
                    ))}
                    {proposalRows.length === 0 ? (
                      <TableEmptyRow colSpan={6}>
                        <EmptyState
                          icon="file"
                          title="No proposals created yet"
                          description="Create the first proposal so customer-facing scope, exclusions, and terms have a ready-to-send draft."
                          actionHref="/dashboard/proposals/new"
                          actionLabel="Create proposal"
                        />
                      </TableEmptyRow>
                    ) : null}
                  </TableBody>
                </DataTable>
              </TableShell>
            </div>

            <RecordPreview
              title={latestProposal?.title}
              rows={[
                ["Customer", latestProposal ? getCustomer(latestProposal.customers) : "—"],
                ["Status", latestProposal?.status ?? "—"],
                ["Job", latestProposal ? getJob(latestProposal.jobs) : "—"],
                ["Created", latestProposal ? formatTimestampDateOnly(latestProposal.created_at) : "—"],
              ]}
              actions={
                latestProposal ? (
                  <Link href={`/dashboard/proposals/${latestProposal.id}`} className="inline-flex rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">
                    Open Proposal
                  </Link>
                ) : null
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
