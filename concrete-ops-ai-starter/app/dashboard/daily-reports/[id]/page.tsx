import Link from "next/link";
import { notFound } from "next/navigation";
import { getDailyReportById, getJobFiles, type DailyReportDetailRow, type JobFileRow } from "@/lib/db/queries";

function getJobLabel(jobs: DailyReportDetailRow["jobs"]) {
  if (!jobs) return "—";
  if (Array.isArray(jobs)) {
    const job = jobs[0];
    return job ? `${job.job_number} · ${job.name}` : "—";
  }

  return `${jobs.job_number} · ${jobs.name}`;
}

function getSubmitter(users: DailyReportDetailRow["users"]) {
  if (!users) return "—";
  if (Array.isArray(users)) return users[0]?.full_name ?? "—";
  return users.full_name;
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

export default async function DailyReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ data: report }, { data: files }] = await Promise.all([getDailyReportById(id), getJobFiles({ dailyReportId: id })]);

  if (!report) {
    notFound();
  }

  const filesByTag = (files ?? []).reduce<Record<string, JobFileRow[]>>((acc, file) => {
    const key = file.tag;
    acc[key] = [...(acc[key] ?? []), file];
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Daily Report Details</h1>
            <p className="mt-2 text-zinc-600">{getJobLabel(report.jobs)}</p>
          </div>
          <Link href="/dashboard/daily-reports" className="rounded-xl border px-4 py-2 text-sm">
            Back to Reports
          </Link>
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border bg-white p-6 shadow-sm">
        <p>
          <span className="font-medium">Report date:</span> {report.report_date}
        </p>
        <p>
          <span className="font-medium">Submitted by:</span> {getSubmitter(report.users)}
        </p>
        <div>
          <p className="font-medium">Work completed</p>
          <p className="mt-1 whitespace-pre-wrap text-zinc-700">{report.work_completed}</p>
        </div>
        <div>
          <p className="font-medium">Delays / issues</p>
          <p className="mt-1 whitespace-pre-wrap text-zinc-700">{report.delays_issues || "—"}</p>
        </div>
        <div>
          <p className="font-medium">Materials / deliveries</p>
          <p className="mt-1 whitespace-pre-wrap text-zinc-700">{report.materials_deliveries || "—"}</p>
        </div>
        <div>
          <p className="font-medium">Safety notes</p>
          <p className="mt-1 whitespace-pre-wrap text-zinc-700">{report.safety_notes || "—"}</p>
        </div>
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Related Uploads</h2>
        <p className="mt-2 text-sm text-zinc-600">Grouped by tag. Shows uploader, date, tag, and note.</p>

        <div className="mt-5 space-y-4">
          {Object.entries(filesByTag).length === 0 ? (
            <p className="text-sm text-zinc-600">No uploads linked to this daily report.</p>
          ) : (
            Object.entries(filesByTag).map(([tag, groupedFiles]) => (
              <div key={tag} className="overflow-hidden rounded-2xl border">
                <div className="bg-zinc-100 px-4 py-2 text-sm font-medium">{tag}</div>
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left">Uploaded At</th>
                      <th className="px-4 py-3 text-left">Uploader</th>
                      <th className="px-4 py-3 text-left">File</th>
                      <th className="px-4 py-3 text-left">Note</th>
                      <th className="px-4 py-3 text-left">Storage Path</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedFiles.map((file) => (
                      <tr key={file.id} className="border-t">
                        <td className="px-4 py-3">{file.created_at}</td>
                        <td className="px-4 py-3">{getUploader(file.users, file.employees)}</td>
                        <td className="px-4 py-3">{file.file_name}</td>
                        <td className="px-4 py-3">{file.note || "—"}</td>
                        <td className="max-w-xs truncate px-4 py-3">{file.storage_path}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
