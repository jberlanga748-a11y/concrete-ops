import Link from "next/link";
import { ClipboardListIcon, FolderKanbanIcon, UsersIcon } from "lucide-react";
import { getCurrentAppUserContext } from "@/lib/auth/server";
import { isForemanRole } from "@/lib/auth/roles";
import { ViewerDateTime } from "@/components/time/ViewerDateTime";
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

export default async function DailyReportsPage({
  searchParams,
}: {
  searchParams?: { jobId?: string; date?: string };
} = {}) {
  const params = searchParams ?? {};
  const selectedJobId = params.jobId?.trim() || "";
  const selectedDate = params.date?.trim() || "";

  const [{ data: reports, error }, jobOptions, appUser] = await Promise.all([
    getDailyReports({ jobId: selectedJobId || undefined, date: selectedDate || undefined }),
    getDailyReportJobOptions(),
    getCurrentAppUserContext(),
  ]);
  const isForeman = isForemanRole(appUser?.role);

  const dailyReports = reports ?? [];
  const selectedJobLabel = jobOptions.find((job) => job.id === selectedJobId)?.label ?? "All jobs";
  const uniqueJobs = new Set(dailyReports.map((report) => report.job_id).filter(Boolean)).size;
  const uniqueSubmitters = new Set(dailyReports.map((report) => getSubmitter(report.users)).filter((name) => name && name !== "—")).size;
  const latestReport = dailyReports[0] ?? null;
  const toolbarDescription = isForeman
    ? "Filter the log to find the exact site update you need, then jump directly into the shared report record without losing field context."
    : "Filter the log to isolate the exact site update you need, then jump directly into the record without losing context.";

  return (
    <div>
      <PageHeader
        eyebrow="Field Ops"
        title="Daily Reports"
        description="Daily reports should behave like a field record queue: job, submitter, work summary, filing date, and action are visible before opening a report."
        actions={
          <>
            {latestReport ? (
              <Link href={`/dashboard/daily-reports/${latestReport.id}`} className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-blue-50">
                Open Latest
              </Link>
            ) : null}
            <Link href="/dashboard/daily-reports/new" className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800">
              New Report
            </Link>
          </>
        }
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <KpiTile label="Reports in view" value={dailyReports.length.toString()} helper="Entries matching current filters" icon={<ClipboardListIcon className="h-4 w-4" />} />
          <KpiTile label="Jobs represented" value={uniqueJobs.toString()} helper="Distinct project records" icon={<FolderKanbanIcon className="h-4 w-4" />} />
          <KpiTile label="Submitters" value={uniqueSubmitters.toString()} helper={latestReport ? `Latest ${formatDateOnly(latestReport.report_date)}` : "No report in view"} icon={<UsersIcon className="h-4 w-4" />} />
        </div>

        {error ? (
          <ErrorPanel
            title="We couldn’t load daily reports right now"
            description="The reporting list is temporarily unavailable. Try refreshing the page or come back in a moment."
            actionHref="/dashboard/daily-reports"
            actionLabel="Try again"
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <div className="min-w-0">
              <OperationalCard className="mb-4 p-3">
                <form method="get" className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto_auto] md:items-end">
                  <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-500">Job</label>
                    <select name="jobId" defaultValue={selectedJobId} className="h-10 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500">
                      <option value="">All jobs</option>
                      {jobOptions.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-500">Date</label>
                    <input name="date" type="date" defaultValue={selectedDate} className="h-10 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500" />
                  </div>
                  <button type="submit" className="h-10 rounded-xl bg-blue-700 px-4 text-sm font-black text-white hover:bg-blue-800">Apply</button>
                  <Link href="/dashboard/daily-reports" className="inline-flex h-10 items-center justify-center rounded-xl border border-blue-100 bg-white px-4 text-sm font-black text-slate-700 hover:bg-blue-50">
                    Reset
                  </Link>
                </form>
              </OperationalCard>

              <TableShell
                toolbar={
                  <TableToolbar
                    title="Report log"
                    description={toolbarDescription}
                    countLabel={`${dailyReports.length} report${dailyReports.length === 1 ? "" : "s"}`}
                  />
                }
              >
                <DataTable>
                  <TableHead>
                    <tr>
                      <TableHeadCell>Report</TableHeadCell>
                      <TableHeadCell className="hidden md:table-cell">Submitted by</TableHeadCell>
                      <TableHeadCell className="hidden xl:table-cell">Work summary</TableHeadCell>
                      <TableHeadCell className="hidden lg:table-cell">Filed</TableHeadCell>
                      <TableHeadCell className="w-32">Action</TableHeadCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {dailyReports.map((report) => {
                      const jobLabel = getJobLabel(report.jobs);
                      const submitter = getSubmitter(report.users);

                      return (
                        <TableRow key={report.id}>
                          <TableCell className="min-w-[20rem]">
                            <p className="font-black text-slate-950">{jobLabel}</p>
                            <p className="mt-1 text-xs font-bold text-slate-500">{formatDateOnly(report.report_date)} · {submitter}</p>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{submitter}</TableCell>
                          <TableCell className="hidden max-w-[28rem] xl:table-cell">
                            <p className="line-clamp-3 leading-6">{report.work_completed}</p>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <ViewerDateTime value={report.created_at} className="font-medium text-slate-700" />
                          </TableCell>
                          <TableCell>
                            <TableActionLink href={`/dashboard/daily-reports/${report.id}`} label="Open" />
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
            </div>

            <div className="space-y-4">
              <RecordPreview
                title={latestReport ? getJobLabel(latestReport.jobs) : undefined}
                rows={[
                  ["Job scope", selectedJobLabel],
                  ["Date focus", selectedDate ? formatDateOnly(selectedDate) : "All dates"],
                  ["Latest", latestReport ? formatDateOnly(latestReport.report_date) : "—"],
                  ["Submitter", latestReport ? getSubmitter(latestReport.users) : "—"],
                ]}
                actions={
                  latestReport ? (
                    <Link href={`/dashboard/daily-reports/${latestReport.id}`} className="inline-flex rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">
                      Open Report
                    </Link>
                  ) : null
                }
              />
              <OperationalCard className="p-4">
                <SectionHeader title="Board Scope" description="Filters stay directly connected to the report data." />
                <div className="space-y-2 text-sm font-bold text-slate-600">
                  <p>Job: <span className="text-slate-950">{selectedJobLabel}</span></p>
                  <p>Date: <span className="text-slate-950">{selectedDate ? formatDateOnly(selectedDate) : "All dates"}</span></p>
                </div>
              </OperationalCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
