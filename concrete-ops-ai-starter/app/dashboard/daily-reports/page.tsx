import Link from "next/link";
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

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Daily Reports</h1>
            <p className="mt-2 text-zinc-600">Admin view of submitted field reports. Filter by job/date or open a report for full detail.</p>
          </div>
          <Link href="/dashboard/daily-reports/new" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white">
            New Report
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

        <input name="date" type="date" defaultValue={selectedDate} className="rounded-xl border px-3 py-2 text-sm" />

        <button type="submit" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white">
          Apply filters
        </button>
      </form>

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Job</th>
              <th className="px-4 py-3 text-left">Submitted By</th>
              <th className="px-4 py-3 text-left">Work Completed</th>
              <th className="px-4 py-3 text-left">View</th>
            </tr>
          </thead>
          <tbody>
            {(reports ?? []).map((report) => (
              <tr key={report.id} className="border-t">
                <td className="px-4 py-4">{report.report_date}</td>
                <td className="px-4 py-4">{getJobLabel(report.jobs)}</td>
                <td className="px-4 py-4">{getSubmitter(report.users)}</td>
                <td className="max-w-md truncate px-4 py-4">{report.work_completed}</td>
                <td className="px-4 py-4">
                  <Link className="text-zinc-900 underline" href={`/dashboard/daily-reports/${report.id}`}>
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {(reports ?? []).length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-zinc-600" colSpan={5}>
                  No daily reports found. Try clearing filters or create a new report.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
