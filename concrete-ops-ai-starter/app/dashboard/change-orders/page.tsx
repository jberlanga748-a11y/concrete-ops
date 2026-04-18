import Link from "next/link";
import { EmptyState, ErrorPanel } from "@/components/ui/feedback";
import { getCurrentAppUserContext } from "@/lib/auth/server";
import { isForemanRole } from "@/lib/auth/roles";
import { getChangeOrders, getDailyReportJobOptions, type ChangeOrderListRow } from "@/lib/db/queries";

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

export default async function ChangeOrdersPage({
  searchParams,
}: {
  searchParams?: { jobId?: string; status?: string };
}) {
  const params = searchParams ?? {};
  const selectedJobId = params.jobId?.trim() || "";
  const selectedStatus = params.status?.trim() || "";
  const appUser = await getCurrentAppUserContext();
  const isForeman = isForemanRole(appUser?.role);

  const [{ data: changeOrders, error }, jobOptions] = await Promise.all([
    getChangeOrders({ jobId: selectedJobId || undefined, status: selectedStatus || undefined }),
    getDailyReportJobOptions(),
  ]);
  const description = isForeman
    ? "Track scope shifts with linked field proof and a cleaner handoff into office review."
    : "Manage scope and cost changes backed by optional daily reports and field-proof uploads.";
  const emptyDescription = isForeman
    ? "No change orders match this view yet. Start one when field conditions shift so the office has clean backup."
    : "No change orders match this view yet. Start one when scope or cost movement needs a documented record.";

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Change Orders</h1>
            <p className="mt-2 text-zinc-600">{description}</p>
          </div>
          <Link href="/dashboard/change-orders/new" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white">
            New Change Order
          </Link>
        </div>
      </div>

      <form method="get" className="flex flex-wrap gap-3 rounded-2xl border bg-white p-4">
        <select name="jobId" defaultValue={selectedJobId} className="rounded-xl border px-3 py-2 text-sm">
          <option value="">All jobs</option>
          {jobOptions.map((job) => (
            <option key={job.id} value={job.id}>
              {job.label}
            </option>
          ))}
        </select>

        <select name="status" defaultValue={selectedStatus} className="rounded-xl border px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="executed">Executed</option>
        </select>

        <button type="submit" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white">
          Apply filters
        </button>
      </form>

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        {error ? (
          <div className="p-4">
            <ErrorPanel
              title="We couldn’t load change orders right now"
              description="The change-order board is temporarily unavailable. Try refreshing the page or come back in a moment."
              actionHref="/dashboard/change-orders"
              actionLabel="Try again"
            />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-100">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Job</th>
                <th className="px-4 py-3 text-left">Report</th>
                <th className="px-4 py-3 text-left">Status</th>
                {!isForeman ? <th className="px-4 py-3 text-left">Direct Cost</th> : null}
                {!isForeman ? <th className="px-4 py-3 text-left">Markup %</th> : null}
                {!isForeman ? <th className="px-4 py-3 text-left">Total</th> : null}
                <th className="px-4 py-3 text-left">Open</th>
              </tr>
            </thead>
            <tbody>
              {(changeOrders ?? []).map((co) => (
                <tr key={co.id} className="border-t">
                  <td className="px-4 py-4">{co.title}</td>
                  <td className="px-4 py-4">{getJobLabel(co.jobs)}</td>
                  <td className="px-4 py-4">{getReportDate(co.daily_reports)}</td>
                  <td className="px-4 py-4">{co.status}</td>
                  {!isForeman ? <td className="px-4 py-4">{co.direct_cost_total}</td> : null}
                  {!isForeman ? <td className="px-4 py-4">{co.markup_percent}</td> : null}
                  {!isForeman ? <td className="px-4 py-4">{co.total_amount}</td> : null}
                  <td className="px-4 py-4">
                    <Link className="underline" href={`/dashboard/change-orders/${co.id}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
              {(changeOrders ?? []).length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-zinc-600" colSpan={isForeman ? 5 : 8}>
                    <EmptyState
                      icon="file"
                      title="No change orders match this view"
                      description={emptyDescription}
                      actionHref="/dashboard/change-orders/new"
                      actionLabel="New Change Order"
                    />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
