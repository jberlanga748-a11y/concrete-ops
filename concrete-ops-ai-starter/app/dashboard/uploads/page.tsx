import Link from "next/link";
import { ViewerDateTime } from "@/components/time/ViewerDateTime";
import { EmptyState, ErrorPanel } from "@/components/ui/feedback";
import { getCurrentAppUserContext } from "@/lib/auth/server";
import { isForemanRole } from "@/lib/auth/roles";
import { getDailyReportOptions, getDailyReportJobOptions, getDocuments, type DocumentRow } from "@/lib/db/queries";

function getJobLabel(jobs: DocumentRow["jobs"]) {
  if (!jobs) return "—";
  if (Array.isArray(jobs)) {
    const job = jobs[0];
    return job ? `${job.job_number} · ${job.name}` : "—";
  }

  return `${jobs.job_number} · ${jobs.name}`;
}

function getReportDate(dailyReports: DocumentRow["daily_reports"]) {
  if (!dailyReports) return "—";
  if (Array.isArray(dailyReports)) return dailyReports[0]?.report_date ?? "—";
  return dailyReports.report_date;
}

function getUploader(users: DocumentRow["users"], employees: DocumentRow["employees"]) {
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

function formatFileSize(bytes: number | null | undefined) {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function UploadsPage({
  searchParams,
}: {
  searchParams?: { jobId?: string; dailyReportId?: string; tag?: string };
}) {
  const params = searchParams ?? {};
  const selectedJobId = params.jobId?.trim() || "";
  const selectedDailyReportId = params.dailyReportId?.trim() || "";
  const selectedTag = params.tag?.trim() || "";

  const appUser = await getCurrentAppUserContext();
  const isForeman = isForemanRole(appUser?.role);

  const [{ data: files, error }, jobOptions, dailyReportOptions] = await Promise.all([
    getDocuments({
      jobId: selectedJobId || undefined,
      dailyReportId: selectedDailyReportId || undefined,
      tag: selectedTag || undefined,
    }),
    getDailyReportJobOptions(),
    getDailyReportOptions(selectedJobId || undefined),
  ]);
  const description = isForeman
    ? "Field-visible photo and document record tied to jobs and reports."
    : "Office-managed photo and document record tied to jobs and reports.";
  const emptyDescription = isForeman
    ? "No uploads match this view yet. Clear the filters or add field proof so the shared record stays current."
    : "No uploads match this view yet. Clear the filters or add a file so the shared project record stays complete.";

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Job Uploads</h1>
            <p className="mt-2 text-zinc-600">{description}</p>
          </div>
          <Link href="/dashboard/uploads/new" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white">
            New Upload
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

        <select name="dailyReportId" defaultValue={selectedDailyReportId} className="rounded-xl border px-3 py-2 text-sm">
          <option value="">All reports</option>
          {dailyReportOptions.map((report) => (
            <option key={report.id} value={report.id}>
              {report.label}
            </option>
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

        <button type="submit" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white">
          Apply filters
        </button>
      </form>

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        {error ? (
          <div className="p-4">
            <ErrorPanel
              title="We couldn’t load uploads right now"
              description="The upload record is temporarily unavailable. Try refreshing the page or come back in a moment."
              actionHref="/dashboard/uploads"
              actionLabel="Try again"
            />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-100">
              <tr>
                <th className="px-4 py-3 text-left">Uploaded At</th>
                <th className="px-4 py-3 text-left">Job</th>
                <th className="px-4 py-3 text-left">Daily Report</th>
                <th className="px-4 py-3 text-left">Tag</th>
                <th className="px-4 py-3 text-left">File</th>
                <th className="px-4 py-3 text-left">Size</th>
                <th className="px-4 py-3 text-left">Uploader</th>
                <th className="px-4 py-3 text-left">Note</th>
                <th className="px-4 py-3 text-left">Open</th>
              </tr>
            </thead>
            <tbody>
              {(files ?? []).map((file) => (
                <tr key={file.id} className="border-t">
                  <td className="px-4 py-4">
                    <ViewerDateTime value={file.created_at} includeYear includeTimeZoneName={false} />
                  </td>
                  <td className="px-4 py-4">{getJobLabel(file.jobs)}</td>
                  <td className="px-4 py-4">{getReportDate(file.daily_reports)}</td>
                  <td className="px-4 py-4">{file.tag}</td>
                  <td className="px-4 py-4">{file.file_name}</td>
                  <td className="px-4 py-4">{formatFileSize(file.file_size_bytes)}</td>
                  <td className="px-4 py-4">{getUploader(file.users, file.employees)}</td>
                  <td className="max-w-md truncate px-4 py-4">{file.note || "—"}</td>
                  <td className="px-4 py-4">
                    <Link href={`/api/documents/${file.id}`} className="underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
              {(files ?? []).length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-zinc-600" colSpan={9}>
                    <EmptyState
                      icon="file"
                      title="No uploads match this view"
                      description={emptyDescription}
                      actionHref="/dashboard/uploads/new"
                      actionLabel="New Upload"
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
