import Link from "next/link";
import { getDailyReportOptions, getDailyReportJobOptions, getJobFiles, type JobFileRow } from "@/lib/db/queries";

function getJobLabel(jobs: JobFileRow["jobs"]) {
  if (!jobs) return "—";
  if (Array.isArray(jobs)) {
    const job = jobs[0];
    return job ? `${job.job_number} · ${job.name}` : "—";
  }

  return `${jobs.job_number} · ${jobs.name}`;
}

function getReportDate(dailyReports: JobFileRow["daily_reports"]) {
  if (!dailyReports) return "—";
  if (Array.isArray(dailyReports)) return dailyReports[0]?.report_date ?? "—";
  return dailyReports.report_date;
}

function getUploader(users: JobFileRow["users"], employees: JobFileRow["employees"]) {
  if (users) {
    if (Array.isArray(users)) return users[0]?.full_name ?? "—";
    return users.full_name;
  }

  if (employees) {
    if (Array.isArray(employees)) return employees[0]?.full_name ?? "—";
    return employees.full_name;
  }

  return "—";
}

export default async function UploadsPage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string; dailyReportId?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const selectedJobId = params.jobId?.trim() || "";
  const selectedDailyReportId = params.dailyReportId?.trim() || "";
  const selectedTag = params.tag?.trim() || "";

  const [{ data: files }, jobOptions, dailyReportOptions] = await Promise.all([
    getJobFiles({
      jobId: selectedJobId || undefined,
      dailyReportId: selectedDailyReportId || undefined,
      tag: selectedTag || undefined,
    }),
    getDailyReportJobOptions(),
    getDailyReportOptions(selectedJobId || undefined),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Job Uploads</h1>
            <p className="mt-2 text-zinc-600">Admin list of uploaded photos/documents tied to jobs and reports.</p>
          </div>
          <Link href="/dashboard/uploads/new" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white">New Upload</Link>
        </div>
      </div>

      <form method="get" className="flex flex-wrap gap-3 rounded-2xl border bg-white p-4">
        <select name="jobId" defaultValue={selectedJobId} className="rounded-xl border px-3 py-2 text-sm">
          <option value="">All jobs</option>
          {jobOptions.map((job) => (
            <option key={job.id} value={job.id}>{job.label}</option>
          ))}
        </select>

        <select name="dailyReportId" defaultValue={selectedDailyReportId} className="rounded-xl border px-3 py-2 text-sm">
          <option value="">All reports</option>
          {dailyReportOptions.map((report) => (
            <option key={report.id} value={report.id}>{report.label}</option>
          ))}
        </select>

        <select name="tag" defaultValue={selectedTag} className="rounded-xl border px-3 py-2 text-sm">
          <option value="">All tags</option>
          <option value="progress">Progress</option>
          <option value="issue">Issue</option>
          <option value="safety">Safety</option>
          <option value="delivery">Delivery</option>
          <option value="damage">Damage</option>
          <option value="change_order_support">Change Order Support</option>
        </select>

        <button type="submit" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white">Apply filters</button>
      </form>

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100">
            <tr>
              <th className="px-4 py-3 text-left">Uploaded At</th>
              <th className="px-4 py-3 text-left">Job</th>
              <th className="px-4 py-3 text-left">Daily Report</th>
              <th className="px-4 py-3 text-left">Tag</th>
              <th className="px-4 py-3 text-left">File</th>
              <th className="px-4 py-3 text-left">Uploader</th>
              <th className="px-4 py-3 text-left">Note</th>
            </tr>
          </thead>
          <tbody>
            {(files ?? []).map((file) => (
              <tr key={file.id} className="border-t">
                <td className="px-4 py-4">{file.created_at}</td>
                <td className="px-4 py-4">{getJobLabel(file.jobs)}</td>
                <td className="px-4 py-4">{getReportDate(file.daily_reports)}</td>
                <td className="px-4 py-4">{file.tag}</td>
                <td className="px-4 py-4">{file.file_name}</td>
                <td className="px-4 py-4">{getUploader(file.users, file.employees)}</td>
                <td className="max-w-md truncate px-4 py-4">{file.note || "—"}</td>
              </tr>
            ))}
            {(files ?? []).length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-zinc-600" colSpan={7}>No uploads found. Try changing filters or add a new upload.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
