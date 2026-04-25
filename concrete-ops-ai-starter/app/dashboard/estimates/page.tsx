import Link from "next/link";
import { EmptyState, ErrorPanel, StatusChip } from "@/components/ui/feedback";
import { FilterBar, PageHeader, RecordPreview } from "@/components/ui/page-primitives";
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
import { getEstimates, type EstimateListRow } from "@/lib/db/queries";

function getCustomer(customers: EstimateListRow["customers"]) {
  if (!customers) return "—";
  if (Array.isArray(customers)) return customers[0]?.name ?? "—";
  return customers.name;
}

function getJob(jobs: EstimateListRow["jobs"]) {
  if (!jobs) return "—";
  if (Array.isArray(jobs)) {
    const job = jobs[0];
    return job ? `${job.job_number} · ${job.name}` : "—";
  }
  return `${jobs.job_number} · ${jobs.name}`;
}

function getEstimateStatusTone(status: string): "neutral" | "success" | "info" | "error" | "warning" {
  const normalized = status.toLowerCase();
  if (normalized.includes("approved") || normalized.includes("accepted")) return "success";
  if (normalized.includes("sent") || normalized.includes("submitted") || normalized.includes("pending")) return "warning";
  if (normalized.includes("rejected") || normalized.includes("declined")) return "error";
  if (normalized.includes("draft")) return "info";
  return "neutral";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function EstimatesPage({
  searchParams,
}: {
  searchParams?: { status?: string };
} = {}) {
  const selectedStatus = searchParams?.status?.trim() ?? "all";
  const { data: estimates, error } = await getEstimates(selectedStatus === "all" ? undefined : { status: selectedStatus });
  const estimateRows = estimates ?? [];
  const latestEstimate = estimateRows[0] ?? null;
  const filterOptions = [
    { label: "All", href: "/dashboard/estimates", active: selectedStatus === "all" },
    { label: "Draft", href: "/dashboard/estimates?status=draft", active: selectedStatus === "draft" },
    { label: "Sent", href: "/dashboard/estimates?status=sent", active: selectedStatus === "sent" },
    { label: "Approved", href: "/dashboard/estimates?status=approved", active: selectedStatus === "approved" },
    { label: "Rejected", href: "/dashboard/estimates?status=rejected", active: selectedStatus === "rejected" },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Office"
        title="Estimates"
        description="A pricing board should read like a work queue: customer, status, value, linked job, and the next record action are visible without opening every estimate."
        actions={
          <>
            {latestEstimate ? (
              <Link href={`/dashboard/estimates/${latestEstimate.id}`} className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-blue-50">
                Open Latest
              </Link>
            ) : null}
            <Link href="/dashboard/estimates/new" className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800">
              New Estimate
            </Link>
          </>
        }
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        {error ? (
          <ErrorPanel
            title="We couldn’t load estimates right now"
            description="The estimate board is temporarily unavailable. Try refreshing the page or come back in a moment."
            actionHref="/dashboard/estimates"
            actionLabel="Try again"
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <div className="min-w-0">
              <TableShell
                toolbar={
                  <TableToolbar
                    title="Estimate board"
                    description="Review estimate scope, pricing posture, and linked project context without losing the customer-facing thread."
                    countLabel={`${estimateRows.length} estimate${estimateRows.length === 1 ? "" : "s"}`}
                  />
                }
                filters={<FilterBar options={filterOptions} />}
              >
                <DataTable>
                  <TableHead>
                    <tr>
                      <TableHeadCell>Estimate</TableHeadCell>
                      <TableHeadCell className="hidden md:table-cell">Customer</TableHeadCell>
                      <TableHeadCell className="hidden lg:table-cell">Job</TableHeadCell>
                      <TableHeadCell>Status</TableHeadCell>
                      <TableHeadCell className="hidden sm:table-cell">Subtotal</TableHeadCell>
                      <TableHeadCell className="w-32">Action</TableHeadCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {estimateRows.map((estimate) => (
                      <TableRow key={estimate.id}>
                        <TableCell className="min-w-[18rem]">
                          <p className="font-black text-slate-950">{estimate.title}</p>
                          <p className="mt-1 text-xs font-bold text-slate-500 md:hidden">{getCustomer(estimate.customers)} · {formatCurrency(estimate.subtotal)}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{getCustomer(estimate.customers)}</TableCell>
                        <TableCell className="hidden lg:table-cell">{getJob(estimate.jobs)}</TableCell>
                        <TableCell>
                          <StatusChip tone={getEstimateStatusTone(estimate.status)}>{estimate.status}</StatusChip>
                        </TableCell>
                        <TableCell className="hidden font-black text-slate-950 sm:table-cell">{formatCurrency(estimate.subtotal)}</TableCell>
                        <TableCell>
                          <TableActionLink href={`/dashboard/estimates/${estimate.id}`} label="Open" />
                        </TableCell>
                      </TableRow>
                    ))}
                    {estimateRows.length === 0 ? (
                      <TableEmptyRow colSpan={6}>
                        <EmptyState
                          icon="file"
                          title="No estimates match this board"
                          description="Create the first estimate or clear the status filter so pricing work can show here."
                          actionHref="/dashboard/estimates/new"
                          actionLabel="Create estimate"
                        />
                      </TableEmptyRow>
                    ) : null}
                  </TableBody>
                </DataTable>
              </TableShell>
            </div>

            <RecordPreview
              title={latestEstimate?.title}
              rows={[
                ["Customer", latestEstimate ? getCustomer(latestEstimate.customers) : "—"],
                ["Status", latestEstimate?.status ?? "—"],
                ["Value", latestEstimate ? formatCurrency(latestEstimate.subtotal) : "—"],
                ["Job", latestEstimate ? getJob(latestEstimate.jobs) : "—"],
              ]}
              actions={
                latestEstimate ? (
                  <Link href={`/dashboard/estimates/${latestEstimate.id}`} className="inline-flex rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">
                    Open Estimate
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
