import Link from "next/link";
import { EmptyState, ErrorPanel } from "@/components/ui/feedback";
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
import { getDailyReportJobOptions, getDailyReports, type DailyReportListRow } from "@/lib/db/queries";

function getJobLabel(jobs: DailyReportListRow["jobs"]) {
  if (!jobs) return "—";
  if (Array.isArray(jobs)) {
    const job = jobs[0];
    return job ? `${job.job_number} · ${job.name}` : "—";
  }

  return `${jobs.job_number} · ${jobs.name}`;
}

function getSubmitter(users: DailyReportListRow["users"]) {
  if (!users) return "—";
  if (Array.isArray(users)) return users[0]?.full_name ?? "—";
  return users.full_name;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
}

export default async function DailyReportsPage({
  searchParams,
}: {
  searchParams?: { jobId?: string; date?: string };
}) {
  const params = searchParams ?? {};
  const selectedJobId = params.jobId?.trim() || "";
  const selectedDate = params.date?.trim() || "";

  const [{ data: reports, error }, jobOptions] = await Promise.all([
    getDailyReports({ jobId: selectedJobId || undefined, date: selectedDate || undefined }),
    getDailyReportJobOptions(),
  ]);

  const dailyReports = reports ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Field Ops</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">Daily Reports</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600">
              Review submitted field reports, filter by job or date, and jump into the full report when the office needs context fast.
            </p>
          </div>
          <Link
            href="/dashboard/daily-reports/new"
            className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(249,115,22,0.28)] transition hover:bg-orange-400"
          >
            New Report
          </Link>
        </div>
      </div>

      {error ? (
        <ErrorPanel
          title="We couldn’t load daily reports right now"
          description="The reporting list is temporarily unavailable. Try refreshing the page or come back in a moment."
          actionHref="/dashboard/daily-reports"
          actionLabel="Try again"
        />
      ) : (
        <TableShell
          toolbar={
            <TableToolbar
              title="Report log"
              description="Filter the report list to find the right field update without digging through unrelated jobs."
              countLabel={`${dailyReports.length} report${dailyReports.length === 1 ? "" : "s"}`}
              actions={
                <Link
                  href="/dashboard/daily-reports/new"
                  className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:border-orange-300 hover:bg-orange-50"
                >
                  Add report
                </Link>
              }
            >
              <form method="get" className="flex flex-wrap items-end gap-3">
                <div className="min-w-[220px] flex-1">
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Job</label>
                  <select
                    name="jobId"
                    defaultValue={selectedJobId}
                    className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm"
                  >
                    <option value="">All jobs</option>
                    {jobOptions.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-[180px]">
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Date</label>
                  <input
                    name="date"
                    type="date"
                    defaultValue={selectedDate}
                    className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  Apply filters
                </button>
                <Link
                  href="/dashboard/daily-reports"
                  className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
                >
                  Reset
                </Link>
              </form>
            </TableToolbar>
          }
        >
          <DataTable>
            <TableHead>
              <tr>
                <TableHeadCell>Date</TableHeadCell>
                <TableHeadCell>Job</TableHeadCell>
                <TableHeadCell>Submitted By</TableHeadCell>
                <TableHeadCell>Work Completed</TableHeadCell>
                <TableHeadCell className="w-32">Actions</TableHeadCell>
              </tr>
            </TableHead>
            <TableBody>
              {dailyReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{formatDate(report.report_date)}</TableCell>
                  <TableCell>{getJobLabel(report.jobs)}</TableCell>
                  <TableCell>{getSubmitter(report.users)}</TableCell>
                  <TableCell className="max-w-[28rem]">
                    <p className="line-clamp-2">{report.work_completed}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <TableActionLink href={`/dashboard/daily-reports/${report.id}`} label="Open" />
                      <TableActionLink href={`/dashboard/daily-reports/${report.id}/edit`} label="Edit" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {dailyReports.length === 0 ? (
                <TableEmptyRow colSpan={5}>
                  <EmptyState
                    icon="file"
                    title="No daily reports match this view"
                    description="Clear the filters or file a new report so the office and field teams have a current record of progress."
                    actionHref="/dashboard/daily-reports/new"
                    actionLabel="Create report"
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
