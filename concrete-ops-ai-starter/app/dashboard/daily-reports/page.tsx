import Link from "next/link";
import { AppIcon } from "@/components/ui/icons";
import {
  DataTable,
  PageHeader,
  Section,
  StatCard,
  StatusPill,
  inputClassName,
  linkClassName,
  primaryButtonClassName,
  selectClassName,
  tableCellClassName,
} from "@/components/ui/primitives";
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

export default async function DailyReportsPage({
  searchParams,
}: {
  searchParams?: { jobId?: string; date?: string };
}) {
  const params = searchParams ?? {};
  const selectedJobId = params.jobId?.trim() || "";
  const selectedDate = params.date?.trim() || "";

  const [{ data: reports }, jobOptions] = await Promise.all([
    getDailyReports({ jobId: selectedJobId || undefined, date: selectedDate || undefined }),
    getDailyReportJobOptions(),
  ]);

  const dailyReports = reports ?? [];
  const jobCount = new Set(dailyReports.map((report) => report.job_id)).size;
  const reportCountForDate = selectedDate
    ? dailyReports.filter((report) => report.report_date === selectedDate).length
    : dailyReports.length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Field Ops"
        title="Daily Reports"
        description="Review submitted field reports, filter by job or date, and keep the daily job picture readable on desktop and mobile."
        action={<Link href="/dashboard/daily-reports/new" className={primaryButtonClassName}>New Report</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Reports" value={dailyReports.length} hint="Current results after filters." icon="clipboard" tone="warning" />
        <StatCard label="Jobs Covered" value={jobCount} hint="Projects represented in these reports." icon="hammer" tone="info" />
        <StatCard label="In View" value={reportCountForDate} hint="Reports matching your selected day." icon="check" tone="success" />
        <StatCard label="Filter State" value={selectedJobId || selectedDate ? "Active" : "Open"} hint="Use filters to tighten the field view fast." icon="truck" tone="neutral" />
      </div>

      <Section title="Filters" description="Jump to a specific job or date without losing the broader reporting picture.">
        <form method="get" className="flex flex-wrap gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
          <select name="jobId" defaultValue={selectedJobId} className={selectClassName}>
            <option value="">All jobs</option>
            {jobOptions.map((job) => (
              <option key={job.id} value={job.id}>
                {job.label}
              </option>
            ))}
          </select>

          <input name="date" type="date" defaultValue={selectedDate} className={inputClassName} />

          <button type="submit" className={primaryButtonClassName}>
            Apply filters
          </button>
        </form>
      </Section>

      <DataTable
        headers={["Date", "Job", "Submitted By", "Work Completed", "View"]}
        mobileCards={
          <div className="space-y-3">
            {dailyReports.map((report) => (
              <Link
                key={report.id}
                href={`/dashboard/daily-reports/${report.id}`}
                className="block rounded-[28px] border border-zinc-200/80 bg-white/95 p-4 shadow-[0_16px_36px_rgba(24,24,27,0.08)] transition hover:-translate-y-0.5 hover:border-orange-200"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-zinc-900">{report.report_date}</p>
                  <StatusPill tone="info">Daily Report</StatusPill>
                </div>
                <p className="mt-2 text-base font-medium text-zinc-950">{getJobLabel(report.jobs)}</p>
                <p className="mt-2 text-sm text-zinc-600">Submitted by {getSubmitter(report.users)}</p>
                <p className="mt-3 line-clamp-3 text-sm text-zinc-600">{report.work_completed}</p>
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-orange-600">
                  <AppIcon icon="document" className="h-4 w-4" />
                  <span>Open report</span>
                </div>
              </Link>
            ))}
          </div>
        }
      >
        {dailyReports.map((report) => (
          <tr key={report.id} className="border-t border-zinc-200 transition hover:bg-orange-50/50">
            <td className={tableCellClassName}>{report.report_date}</td>
            <td className={tableCellClassName}>{getJobLabel(report.jobs)}</td>
            <td className={tableCellClassName}>{getSubmitter(report.users)}</td>
            <td className={`${tableCellClassName} max-w-md truncate`}>{report.work_completed}</td>
            <td className={tableCellClassName}>
              <Link className={linkClassName} href={`/dashboard/daily-reports/${report.id}`}>
                Open
              </Link>
            </td>
          </tr>
        ))}
      </DataTable>

      {dailyReports.length === 0 ? (
        <Section title="No reports found" description="Try clearing filters or create a new report to start collecting field updates.">
          <div className="flex items-center gap-3 text-sm text-zinc-600">
            <AppIcon icon="truck" className="h-4 w-4 text-orange-500" />
            <span>No report records match the current filters.</span>
          </div>
        </Section>
      ) : null}
    </div>
  );
}
