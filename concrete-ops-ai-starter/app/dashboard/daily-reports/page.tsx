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

function formatDateOnly(value: string | null | undefined) {
  if (!value) return "—";

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
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
  const activeFilterCount = Number(Boolean(selectedJobId)) + Number(Boolean(selectedDate));
  const selectedJobLabel = jobOptions.find((job) => job.id === selectedJobId)?.label ?? "All jobs";
  const uniqueJobs = new Set(dailyReports.map((report) => report.job_id).filter(Boolean)).size;
  const uniqueSubmitters = new Set(
    dailyReports.map((report) => getSubmitter(report.users)).filter((name) => name && name !== "—"),
  ).size;
  const latestReport = dailyReports[0] ?? null;

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-zinc-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(245,247,248,0.92))] p-6 shadow-[0_20px_48px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.35fr,0.95fr] xl:items-start">
          <div>
            <p className="font-app-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Daily Reports Workflow</p>
            <h1 className="mt-4 text-[clamp(2rem,3vw,3.45rem)] font-semibold tracking-[-0.06em] text-[#101828]">
              Review the field record from a board built for real office follow-up.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-600 sm:text-base">
              Keep report review tight with clearer filtering, stronger hierarchy, and a board that surfaces what changed without forcing the office to dig through every entry.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/dashboard/daily-reports/new"
                className="inline-flex items-center justify-center rounded-[22px] bg-[#101828] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1b2432]"
              >
                Create report
              </Link>
              {latestReport ? (
                <Link
                  href={`/dashboard/daily-reports/${latestReport.id}`}
                  className="inline-flex items-center justify-center rounded-[22px] border border-zinc-200 bg-white px-5 py-3.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
                >
                  Open latest report
                </Link>
              ) : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#18232d] bg-[#0f1820] p-5 text-zinc-100 shadow-[0_24px_60px_rgba(15,23,42,0.2)] sm:p-6">
            <p className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">Board Snapshot</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Reports in view</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">{dailyReports.length}</p>
                <p className="mt-1 text-sm text-zinc-300">Entries currently surfaced on the board.</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Jobs represented</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">{uniqueJobs}</p>
                <p className="mt-1 text-sm text-zinc-300">Distinct projects contributing to this view.</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Latest report</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">
                  {latestReport ? formatDateOnly(latestReport.report_date) : "—"}
                </p>
                <p className="mt-1 text-sm text-zinc-300">
                  {uniqueSubmitters} submitter{uniqueSubmitters === 1 ? "" : "s"} represented.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

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
              description="Filter the log to isolate the exact site update you need, then jump directly into the record without losing context."
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
              <div className="grid gap-4 xl:grid-cols-[0.92fr,1.08fr] xl:items-end">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[20px] border border-white bg-white/80 px-4 py-3">
                    <p className="font-app-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Filters</p>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.04em] text-zinc-950">{activeFilterCount}</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      {activeFilterCount > 0 ? "Active filter inputs shaping this view." : "Board is showing every report."}
                    </p>
                  </div>
                  <div className="rounded-[20px] border border-white bg-white/80 px-4 py-3">
                    <p className="font-app-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Job scope</p>
                    <p className="mt-2 text-sm font-semibold tracking-[-0.03em] text-zinc-950">{selectedJobLabel}</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">Current project filter on the board.</p>
                  </div>
                  <div className="rounded-[20px] border border-white bg-white/80 px-4 py-3">
                    <p className="font-app-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Date focus</p>
                    <p className="mt-2 text-sm font-semibold tracking-[-0.03em] text-zinc-950">
                      {selectedDate ? formatDateOnly(selectedDate) : "All dates"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">Limit the log to a specific report day.</p>
                  </div>
                </div>

                <form method="get" className="grid gap-3 md:grid-cols-[minmax(0,1fr),220px,auto,auto] md:items-end">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700">Job</label>
                    <select
                      name="jobId"
                      defaultValue={selectedJobId}
                      className="w-full rounded-[20px] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-[0_8px_22px_rgba(15,23,42,0.04)] outline-none transition focus:border-[#d79b73] focus:ring-2 focus:ring-[#f3dfd1]"
                    >
                      <option value="">All jobs</option>
                      {jobOptions.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700">Date</label>
                    <input
                      name="date"
                      type="date"
                      defaultValue={selectedDate}
                      className="w-full rounded-[20px] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-[0_8px_22px_rgba(15,23,42,0.04)] outline-none transition focus:border-[#d79b73] focus:ring-2 focus:ring-[#f3dfd1]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-[20px] bg-[#101828] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1b2432]"
                  >
                    Apply filters
                  </button>
                  <Link
                    href="/dashboard/daily-reports"
                    className="inline-flex items-center justify-center rounded-[20px] border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
                  >
                    Reset
                  </Link>
                </form>
              </div>
            </TableToolbar>
          }
        >
          <DataTable>
            <TableHead>
              <tr>
                <TableHeadCell>Report</TableHeadCell>
                <TableHeadCell className="hidden md:table-cell">Submitted by</TableHeadCell>
                <TableHeadCell className="hidden xl:table-cell">Work summary</TableHeadCell>
                <TableHeadCell className="hidden lg:table-cell">Filed</TableHeadCell>
                <TableHeadCell className="w-40">Actions</TableHeadCell>
              </tr>
            </TableHead>
            <TableBody>
              {dailyReports.map((report) => {
                const jobLabel = getJobLabel(report.jobs);
                const submitter = getSubmitter(report.users);

                return (
                  <TableRow key={report.id}>
                    <TableCell className="min-w-[20rem]">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                              {formatDateOnly(report.report_date)}
                            </p>
                            <p className="mt-2 text-base font-semibold tracking-[-0.03em] text-zinc-950">{jobLabel}</p>
                          </div>
                          <StatusChip tone="neutral">Field report</StatusChip>
                        </div>

                        <div className="grid gap-2 text-xs text-zinc-600 md:hidden">
                          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-3 py-2">
                            <p className="font-app-mono uppercase tracking-[0.16em] text-zinc-500">Submitted by</p>
                            <p className="mt-1 text-sm font-medium text-zinc-900">{submitter}</p>
                          </div>
                          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-3 py-2">
                            <p className="font-app-mono uppercase tracking-[0.16em] text-zinc-500">Work summary</p>
                            <p className="mt-1 line-clamp-3 text-sm leading-6 text-zinc-700">{report.work_completed}</p>
                          </div>
                          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-3 py-2 lg:hidden">
                            <p className="font-app-mono uppercase tracking-[0.16em] text-zinc-500">Filed</p>
                            <p className="mt-1 text-sm font-medium text-zinc-900">{formatDateTime(report.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="space-y-1">
                        <p className="font-medium text-zinc-900">{submitter}</p>
                        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Report submitter</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell max-w-[28rem]">
                      <p className="line-clamp-3 leading-6">{report.work_completed}</p>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="space-y-1">
                        <p className="font-medium text-zinc-900">{formatDateTime(report.created_at)}</p>
                        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Logged to office record</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <TableActionLink href={`/dashboard/daily-reports/${report.id}`} label="Open record" />
                        <TableActionLink href={`/dashboard/daily-reports/${report.id}/edit`} label="Edit" />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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
