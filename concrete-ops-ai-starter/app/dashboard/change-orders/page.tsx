import Link from "next/link";
import { ClipboardListIcon, CircleDollarSignIcon, FolderKanbanIcon } from "lucide-react";
import { EmptyState, ErrorPanel, StatusChip } from "@/components/ui/feedback";
import { KpiTile, OperationalCard, PageHeader, RecordPreview, SectionHeader } from "@/components/ui/page-primitives";
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
import { getCurrentAppUserContext } from "@/lib/auth/server";
import { isForemanRole } from "@/lib/auth/roles";
import { getChangeOrders, getDailyReportJobOptions, type ChangeOrderListRow } from "@/lib/db/queries";
import { formatDateOnly } from "@/lib/time/formatting";

function getJobLabel(jobs: ChangeOrderListRow["jobs"]) {
  if (!jobs) return "—";
  if (Array.isArray(jobs)) {
    const job = jobs[0];
    return job ? `${job.job_number} · ${job.name}` : "—";
  }

  return `${jobs.job_number} · ${jobs.name}`;
}

function getReportDate(reports: ChangeOrderListRow["daily_reports"]) {
  if (!reports) return "—";
  if (Array.isArray(reports)) return reports[0]?.report_date ?? "—";
  return reports.report_date;
}

function getChangeOrderStatusTone(status: string): "neutral" | "success" | "info" | "error" | "warning" {
  const normalized = status.toLowerCase();
  if (normalized.includes("approved") || normalized.includes("executed")) return "success";
  if (normalized.includes("submitted") || normalized.includes("draft")) return "warning";
  if (normalized.includes("rejected")) return "error";
  return "info";
}

function formatCurrency(value: number | string | null | undefined) {
  const numericValue = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

function formatPercent(value: number | string | null | undefined) {
  const numericValue = Number(value ?? 0);
  return `${Number.isFinite(numericValue) ? numericValue.toFixed(1) : "0.0"}%`;
}

export default async function ChangeOrdersPage({
  searchParams,
}: {
  searchParams?: { jobId?: string; status?: string };
} = {}) {
  const params = searchParams ?? {};
  const selectedJobId = params.jobId?.trim() || "";
  const selectedStatus = params.status?.trim() || "";
  const appUser = await getCurrentAppUserContext();
  const isForeman = isForemanRole(appUser?.role);

  const [{ data: changeOrders, error }, jobOptions] = await Promise.all([
    getChangeOrders({ jobId: selectedJobId || undefined, status: selectedStatus || undefined }),
    getDailyReportJobOptions(),
  ]);
  const changeOrderRows = changeOrders ?? [];
  const totalAmount = changeOrderRows.reduce((total, changeOrder) => total + Number(changeOrder.total_amount ?? 0), 0);
  const linkedJobs = new Set(changeOrderRows.map((changeOrder) => changeOrder.job_id).filter(Boolean)).size;
  const openItems = changeOrderRows.filter((changeOrder) => !["approved", "executed", "rejected"].includes(changeOrder.status)).length;
  const latestChangeOrder = changeOrderRows[0] ?? null;
  const description = isForeman
    ? "Track scope shifts with linked field proof and a cleaner handoff into shared review."
    : "Manage scope and cost changes backed by optional daily reports and field-proof uploads.";
  const emptyDescription = isForeman
    ? "No change orders match this view yet. Start one when field conditions shift so the shared record has clean backup."
    : "No change orders match this view yet. Start one when scope or cost movement needs a documented record.";

  return (
    <div>
      <PageHeader
        eyebrow={isForeman ? "Field Ops" : "Office"}
        title="Change Orders"
        description={description}
        actions={
          <Link href="/dashboard/change-orders/new" className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800">
            New Change Order
          </Link>
        }
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <KpiTile label="Change orders in view" value={changeOrderRows.length.toString()} helper="Records matching current filter" icon={<ClipboardListIcon className="h-4 w-4" />} />
          <KpiTile label="Open movement" value={openItems.toString()} helper="Draft or submitted changes" icon={<FolderKanbanIcon className="h-4 w-4" />} />
          <KpiTile label="Total impact" value={isForeman ? "Shared" : formatCurrency(totalAmount)} helper={isForeman ? "Cost detail hidden for role" : `${linkedJobs} linked job${linkedJobs === 1 ? "" : "s"}`} icon={<CircleDollarSignIcon className="h-4 w-4" />} />
        </div>

        <OperationalCard className="p-4">
          <SectionHeader title="Board filters" description="Narrow by job or status while keeping the change-order queue connected to the same record list." />
          <form method="get" className="flex flex-wrap gap-3">
            <select name="jobId" defaultValue={selectedJobId} className="min-h-10 rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-500">
              <option value="">All jobs</option>
              {jobOptions.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.label}
                </option>
              ))}
            </select>

            <select name="status" defaultValue={selectedStatus} className="min-h-10 rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-500">
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="executed">Executed</option>
            </select>

            <button type="submit" className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-black text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800">
              Apply filters
            </button>
          </form>
        </OperationalCard>

        {error ? (
          <ErrorPanel
            title="We couldn’t load change orders right now"
            description="The change-order board is temporarily unavailable. Try refreshing the page or come back in a moment."
            actionHref="/dashboard/change-orders"
            actionLabel="Try again"
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <TableShell
              toolbar={
                <TableToolbar
                  title="Change-order queue"
                  description="Scope movement stays accountable when the field report, job, status, and amount sit in one dense board."
                  countLabel={`${changeOrderRows.length} change order${changeOrderRows.length === 1 ? "" : "s"}`}
                />
              }
            >
              <DataTable>
                <TableHead>
                  <tr>
                    <TableHeadCell>Change Order</TableHeadCell>
                    <TableHeadCell className="hidden md:table-cell">Job</TableHeadCell>
                    <TableHeadCell className="hidden lg:table-cell">Report</TableHeadCell>
                    <TableHeadCell>Status</TableHeadCell>
                    {!isForeman ? <TableHeadCell className="hidden xl:table-cell">Direct Cost</TableHeadCell> : null}
                    {!isForeman ? <TableHeadCell className="hidden xl:table-cell">Markup</TableHeadCell> : null}
                    {!isForeman ? <TableHeadCell className="hidden sm:table-cell">Total</TableHeadCell> : null}
                    <TableHeadCell className="w-32">Action</TableHeadCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {changeOrderRows.map((co) => (
                    <TableRow key={co.id}>
                      <TableCell className="min-w-[18rem]">
                        <p className="font-black text-slate-950">{co.title}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500 md:hidden">{getJobLabel(co.jobs)} · {formatCurrency(co.total_amount)}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{getJobLabel(co.jobs)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{formatDateOnly(getReportDate(co.daily_reports))}</TableCell>
                      <TableCell>
                        <StatusChip tone={getChangeOrderStatusTone(co.status)}>{co.status}</StatusChip>
                      </TableCell>
                      {!isForeman ? <TableCell className="hidden xl:table-cell">{formatCurrency(co.direct_cost_total)}</TableCell> : null}
                      {!isForeman ? <TableCell className="hidden xl:table-cell">{formatPercent(co.markup_percent)}</TableCell> : null}
                      {!isForeman ? <TableCell className="hidden font-black text-slate-950 sm:table-cell">{formatCurrency(co.total_amount)}</TableCell> : null}
                      <TableCell>
                        <TableActionLink href={`/dashboard/change-orders/${co.id}`} label="Open" />
                      </TableCell>
                    </TableRow>
                  ))}
                  {changeOrderRows.length === 0 ? (
                    <TableEmptyRow colSpan={isForeman ? 5 : 8}>
                      <EmptyState
                        icon="file"
                        title="No change orders match this view"
                        description={emptyDescription}
                        actionHref="/dashboard/change-orders/new"
                        actionLabel="New Change Order"
                      />
                    </TableEmptyRow>
                  ) : null}
                </TableBody>
              </DataTable>
            </TableShell>

            <RecordPreview
              title={latestChangeOrder?.title}
              rows={[
                ["Job", latestChangeOrder ? getJobLabel(latestChangeOrder.jobs) : "—"],
                ["Status", latestChangeOrder?.status ?? "—"],
                ["Report", latestChangeOrder ? formatDateOnly(getReportDate(latestChangeOrder.daily_reports)) : "—"],
                ["Impact", latestChangeOrder && !isForeman ? formatCurrency(latestChangeOrder.total_amount) : isForeman ? "Cost detail hidden" : "—"],
              ]}
              actions={
                latestChangeOrder ? (
                  <Link href={`/dashboard/change-orders/${latestChangeOrder.id}`} className="inline-flex rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">
                    Open Change Order
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
