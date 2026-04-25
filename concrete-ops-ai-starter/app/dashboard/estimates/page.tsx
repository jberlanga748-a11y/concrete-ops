import Link from "next/link";
import { EmptyState, ErrorPanel, StatusChip } from "@/components/ui/feedback";
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

function getEstimateStatusTone(status: string): "neutral" | "success" | "info" | "error" {
  const normalized = status.toLowerCase();

  if (normalized.includes("approved") || normalized.includes("accepted")) return "success";
  if (normalized.includes("sent") || normalized.includes("submitted") || normalized.includes("pending")) return "info";
  if (normalized.includes("rejected") || normalized.includes("declined")) return "error";
  return "neutral";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function BoardStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="bg-white/92 px-5 py-4">
      <p className="font-app-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <p className="mt-3 text-[1.45rem] font-semibold tracking-[-0.05em] text-zinc-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{detail}</p>
    </div>
  );
}

function BoardFocusItem({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[20px] border border-white bg-white/92 px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
      <p className="font-app-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-zinc-950">{value}</p>
      <p className="mt-1 text-xs leading-5 text-zinc-600">{detail}</p>
    </div>
  );
}

export default async function EstimatesPage() {
  const { data: estimates, error } = await getEstimates();
  const estimateRows = estimates ?? [];
  const linkedCustomers = new Set(estimateRows.map((estimate) => getCustomer(estimate.customers)).filter((name) => name !== "—")).size;
  const linkedJobs = new Set(estimateRows.map((estimate) => estimate.job_id).filter(Boolean)).size;
  const boardSubtotal = estimateRows.reduce((total, estimate) => total + estimate.subtotal, 0);
  const latestEstimate = estimateRows[0] ?? null;

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-zinc-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(245,247,248,0.92))] p-6 shadow-[0_20px_48px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)] xl:items-start">
          <div className="min-w-0">
            <p className="font-app-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Estimating Workflow</p>
            <h1 className="mt-4 text-[clamp(2rem,3vw,3.35rem)] font-semibold tracking-[-0.06em] text-[#101828]">
              Keep scope, customer context, and pricing confidence on one board.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-600 sm:text-base">
              Review estimate work with a calmer desktop composition, then move straight into the record that still needs scope refinement, pricing review, or customer follow-up.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/dashboard/estimates/new"
                className="inline-flex items-center justify-center rounded-[22px] bg-[#101828] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1b2432]"
              >
                New estimate
              </Link>
              {latestEstimate ? (
                <Link
                  href={`/dashboard/estimates/${latestEstimate.id}`}
                  className="inline-flex items-center justify-center rounded-[22px] border border-zinc-200 bg-white px-5 py-3.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
                >
                  Open latest estimate
                </Link>
              ) : null}
            </div>
          </div>

          <div className="rounded-[30px] border border-[#d7e2ec] bg-[linear-gradient(135deg,#f4f8fb_0%,#ffffff_100%)] p-6 shadow-[0_20px_42px_rgba(15,23,42,0.06)]">
            <p className="font-app-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Board focus</p>
            <h2 className="mt-3 text-[1.3rem] font-semibold tracking-[-0.04em] text-zinc-950">Use this board for active pricing follow-up.</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-600">
              Keep the estimate log readable from the office side, then move into the exact record that still needs scope refinement or customer-ready polish.
            </p>
            <p className="mt-3 text-sm font-medium text-zinc-900">
              {latestEstimate
                ? `${latestEstimate.title} · ${getCustomer(latestEstimate.customers)}`
                : "Create the first estimate to start the estimating workflow."}
            </p>

            <div className="mt-5 grid gap-3">
              <BoardFocusItem
                label="Latest estimate"
                value={latestEstimate?.title ?? "No estimate in view"}
                detail={latestEstimate ? "Use the freshest pricing record as the next follow-up entry point." : "Create the first estimate to start the workflow."}
              />
              <BoardFocusItem
                label="Customer context"
                value={latestEstimate ? getCustomer(latestEstimate.customers) : "No customer linked yet"}
                detail="Keep customer and scope context visible before diving into line-item review."
              />
              <BoardFocusItem
                label="Job alignment"
                value={latestEstimate ? getJob(latestEstimate.jobs) : "No linked job yet"}
                detail="The estimating board should lead naturally into the matching project record."
              />
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-[28px] border border-white/85 bg-white/88 shadow-[0_18px_38px_rgba(15,23,42,0.05)]">
          <div className="grid gap-px bg-zinc-200/80 xl:grid-cols-3">
            <BoardStat
              label="Estimates in view"
              value={estimateRows.length}
              detail="Estimate records currently visible on the board."
            />
            <BoardStat
              label="Linked jobs"
              value={linkedJobs}
              detail="Projects already tied to pricing work in this view."
            />
            <BoardStat
              label="Board subtotal"
              value={formatCurrency(boardSubtotal)}
              detail={`${linkedCustomers} customer${linkedCustomers === 1 ? "" : "s"} represented across the board.`}
            />
          </div>
        </div>
      </section>

      {error ? (
        <ErrorPanel
          title="We couldn’t load estimates right now"
          description="The estimate board is temporarily unavailable. Try refreshing the page or come back in a moment."
          actionHref="/dashboard/estimates"
          actionLabel="Try again"
        />
      ) : (
        <TableShell
          toolbar={
            <TableToolbar
              title="Estimate board"
              description="Review estimate scope, pricing posture, and linked project context without losing the customer-facing thread."
              countLabel={`${estimateRows.length} estimate${estimateRows.length === 1 ? "" : "s"}`}
              actions={
                <Link
                  href="/dashboard/estimates/new"
                  className="inline-flex items-center justify-center rounded-[20px] border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  Add estimate
                </Link>
              }
            >
              <div className="rounded-[24px] border border-white bg-white/88 p-5 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
                <p className="font-app-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Board orientation</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3 sm:divide-x sm:divide-zinc-200">
                  <div className="sm:pr-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Customers</p>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.04em] text-zinc-950">{linkedCustomers}</p>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">Customer relationships currently represented in this view.</p>
                  </div>
                  <div className="sm:px-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Jobs</p>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.04em] text-zinc-950">{linkedJobs}</p>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">Projects already tied to estimate work.</p>
                  </div>
                  <div className="sm:pl-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Pricing posture</p>
                    <p className="mt-2 text-sm font-semibold tracking-[-0.03em] text-zinc-950">
                      {estimateRows.length > 0 ? "Review the board for scope movement and pricing follow-up." : "No estimate activity yet."}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">Use the board as the clean starting point for pricing conversations.</p>
                  </div>
                </div>
              </div>
            </TableToolbar>
          }
        >
          <DataTable>
            <TableHead>
              <tr>
                <TableHeadCell>Estimate</TableHeadCell>
                <TableHeadCell className="hidden md:table-cell">Customer</TableHeadCell>
                <TableHeadCell className="hidden lg:table-cell">Job</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell className="hidden sm:table-cell">Subtotal</TableHeadCell>
                <TableHeadCell className="w-40">Actions</TableHeadCell>
              </tr>
            </TableHead>
            <TableBody>
              {estimateRows.map((estimate) => (
                <TableRow key={estimate.id}>
                  <TableCell className="min-w-[18rem]">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-app-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">Estimate</p>
                          <p className="mt-2 text-base font-semibold tracking-[-0.03em] text-zinc-950">{estimate.title}</p>
                        </div>
                        <StatusChip tone={getEstimateStatusTone(estimate.status)}>{estimate.status}</StatusChip>
                      </div>

                      <div className="grid gap-2 text-xs text-zinc-600 md:hidden">
                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-3 py-2">
                          <p className="font-app-mono uppercase tracking-[0.16em] text-zinc-500">Customer</p>
                          <p className="mt-1 text-sm font-medium text-zinc-900">{getCustomer(estimate.customers)}</p>
                        </div>
                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-3 py-2">
                          <p className="font-app-mono uppercase tracking-[0.16em] text-zinc-500">Job</p>
                          <p className="mt-1 text-sm font-medium text-zinc-900">{getJob(estimate.jobs)}</p>
                        </div>
                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-3 py-2 sm:hidden">
                          <p className="font-app-mono uppercase tracking-[0.16em] text-zinc-500">Subtotal</p>
                          <p className="mt-1 text-sm font-medium text-zinc-900">{formatCurrency(estimate.subtotal)}</p>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="font-medium text-zinc-900">{getCustomer(estimate.customers)}</p>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <p className="font-medium text-zinc-900">{getJob(estimate.jobs)}</p>
                  </TableCell>
                  <TableCell>
                    <StatusChip tone={getEstimateStatusTone(estimate.status)}>{estimate.status}</StatusChip>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <p className="font-medium text-zinc-900">{formatCurrency(estimate.subtotal)}</p>
                  </TableCell>
                  <TableCell>
                    <TableActionLink href={`/dashboard/estimates/${estimate.id}`} label="Open record" />
                  </TableCell>
                </TableRow>
              ))}
              {estimateRows.length === 0 ? (
                <TableEmptyRow colSpan={6}>
                  <EmptyState
                    icon="briefcase"
                    title="No estimates created yet"
                    description="Create the first estimate so labor, material, and equipment scope have a clean starting point."
                    actionHref="/dashboard/estimates/new"
                    actionLabel="Create estimate"
                  />
                </TableEmptyRow>
              ) : null}
            </TableBody>
          </DataTable>
        </TableShell>
      )}
    </div>
  );
}
