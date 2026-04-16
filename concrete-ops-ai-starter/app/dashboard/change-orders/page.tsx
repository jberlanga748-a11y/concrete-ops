import Link from "next/link";
import { getChangeOrders, getDailyReportJobOptions, type ChangeOrderListRow } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";

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
  const supabase = await createClient();
  const params = searchParams ?? {};
  const selectedJobId = params.jobId?.trim() || "";
  const selectedStatus = params.status?.trim() || "";
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: appUser } = user
    ? await supabase.from("users").select("role").eq("auth_user_id", user.id).maybeSingle()
    : { data: null };
  const isForeman = appUser?.role === "foreman";

  const [{ data: changeOrders }, jobOptions] = await Promise.all([
    getChangeOrders({ jobId: selectedJobId || undefined, status: selectedStatus || undefined }),
    getDailyReportJobOptions(),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Change Orders</h1>
            <p className="mt-2 text-zinc-600">Manage scope/cost changes backed by optional daily report and field-proof uploads.</p>
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
                  No change orders found. Start by creating a new change order.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
