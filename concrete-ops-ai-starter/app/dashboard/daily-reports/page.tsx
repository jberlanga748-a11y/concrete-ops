import Link from "next/link";
import { getCurrentAppUserContext } from "@/lib/auth/server";
import { isForemanRole } from "@/lib/auth/roles";
import { ViewerDateTime } from "@/components/time/ViewerDateTime";
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
import { formatDateOnly } from "@/lib/time/formatting";

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
      <p className="mt-3 text-[1.5rem] font-semibold tracking-[-0.05em] text-zinc-950">{value}</p>
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
  const appUser = await getCurrentAppUserContext();
  const isForeman = isForemanRole(appUser?.role);

  const dailyReports = reports ?? [];
  const activeFilterCount = Number(Boolean(selectedJobId)) + Number(Boolean(selectedDate));
  const selectedJobLabel = jobOptions.find((job) => job.id === selectedJobId)?.label ?? "All jobs";
  const uniqueJobs = new Set(dailyReports.map((report) => report.job_id).filter(Boolean)).size;
  const uniqueSubmitters = new Set(
    dailyReports.map((report) => getSubmitter(report.users)).filter((name) => name && name !== "—"),
  ).size;
  const latestReport = dailyReports[0] ?? null;
  const heroTitle = isForeman
    ? "Keep the field record readable without losing the daily handoff."
    : "Review the field record from a board built for real office follow-up.";
  const heroDescription = isForeman
    ? "Filter reports fast, see which jobs are represented, and move straight into the site update that still needs attention from the field side."
    : "Keep report review tight with clearer filtering, stronger hierarchy, and a board that surfaces what changed without forcing the office to dig through every entry.";
  const toolbarDescription = isForeman
    ? "Filter the log to find the exact site update you need, then jump directly into the shared report record without losing field context."
    : "Filter the log to isolate the exact site update you need, then jump directly into the record without losing context.";
  const emptyDescription = isForeman
    ? "Clear the filters or file a new report so the crew and office share the same current picture of progress."
    : "Clear the filters or file a new report so the office and field teams have a current record of progress.";
  const boardFocusTitle = activeFilterCount > 0 ? "Filtered board in focus." : "Use this board as the office review layer.";
  const boardFocusDescription = activeFilterCount > 0
    ? `The board is narrowed to ${selectedJobLabel}${selectedDate ? ` on ${formatDateOnly(selectedDate)}` : ""}, so the next handoff or follow-up item is easier to isolate.`
    : "Keep the latest field signal readable at a glance, then move into the exact report that still needs attention.";
  const boardFocusDetail = latestReport ? `Latest entry filed ${formatDateOnly(latestReport.report_date)}.` : "No reports are in view yet.";

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-zinc-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(245,247,248,0.92))] p-6 shadow-[0_20px_48px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)] xl:items-start">
          <div className="min-w-0">
            <p className="font-app-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Daily Reports Workflow</p>
            <h1 className="mt-4 text-[clamp(2rem,3vw,3.45rem)] font-semibold tracking-[-0.06em] text-[#101828]">{heroTitle}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-600 sm:text-base">
              {heroDescription}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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

          <div className="rounded-[30px] border border-[#d7e2ec] bg-[linear-gradient(135deg,#f4f8fb_0%,#ffffff_100%)] p-6 shadow-[0_20px_42px_rgba(15,23,42,0.06)]">
            <p className="font-app-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Board focus</p>
            <h2 className="mt-3 text-[1.3rem] font-semibold tracking-[-0.04em] text-zinc-950">{boardFocusTitle}</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-600">{boardFocusDescription}</p>
            <p className="mt-3 text-sm font-medium text-zinc-900">{boardFocusDetail}</p>

            <div className="mt-5 grid gap-3">
              <BoardFocusItem
                label="Job scope"
                value={selectedJobLabel}
                detail={activeFilterCount > 0 ? "Current project scope shaping this filtered review." : "Board is currently showing every job."}
              />
              <BoardFocusItem
                label="Date focus"
                value={selectedDate ? formatDateOnly(selectedDate) : "All dates"}
                detail="Use date narrowing only when you need one specific handoff or job-day view."
              />
              <BoardFocusItem
                label="Latest filing"
                value={latestReport ? formatDateOnly(latestReport.report_date) : "No report in view"}
                detail={latestReport ? `Submitted by ${getSubmitter(latestReport.users)}.` : "Create or widen the filters to bring the next report into view."}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-[28px] border border-white/85 bg-white/88 shadow-[0_18px_38px_rgba(15,23,42,0.05)]">
          <div className="grid gap-px bg-zinc-200/80 xl:grid-cols-3">
            <BoardStat
              label="Reports in view"
              value={dailyReports.length}
              detail="Entries currently surfaced on the board."
            />
            <BoardStat
              label="Jobs represented"
              value={uniqueJobs}
              detail="Distinct projects contributing to this review layer."
            />
            <BoardStat
              label="Latest report"
              value={latestReport ? formatDateOnly(latestReport.report_date) : "—"}
              detail={`${uniqueSubmitters} submitter${uniqueSubmitters === 1 ? "" : "s"} represented in this view.`}
            />
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
              description={toolbarDescription}
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
              <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr),minmax(0,1.08fr)] xl:items-start">
                <div className="rounded-[24px] border border-white bg-white/88 p-5 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
                  <p className="font-app-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Board scope</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3 sm:divide-x sm:divide-zinc-200">
                    <div className="sm:pr-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Filters</p>
                      <p className="mt-2 text-lg font-semibold tracking-[-0.04em] text-zinc-950">{activeFilterCount}</p>
                      <p className="mt-2 text-xs leading-5 text-zinc-500">
                        {activeFilterCount > 0 ? "Active filter inputs shaping this view." : "Board is showing every report."}
                      </p>
                    </div>
                    <div className="sm:px-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Job scope</p>
                      <p className="mt-2 text-sm font-semibold tracking-[-0.03em] text-zinc-950">{selectedJobLabel}</p>
                      <p className="mt-2 text-xs leading-5 text-zinc-500">Current project filter on the board.</p>
                    </div>
                    <div className="sm:pl-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Date focus</p>
                      <p className="mt-2 text-sm font-semibold tracking-[-0.03em] text-zinc-950">
                        {selectedDate ? formatDateOnly(selectedDate) : "All dates"}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-zinc-500">Limit the log to a specific report day.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white bg-white/88 p-5 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
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
                            <ViewerDateTime value={report.created_at} className="mt-1 text-sm font-medium text-zinc-900" />
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
                        <ViewerDateTime value={report.created_at} className="font-medium text-zinc-900" />
                        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Logged to shared record</p>
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
                    description={emptyDescription}
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
