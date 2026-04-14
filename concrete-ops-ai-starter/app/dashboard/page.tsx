import Link from "next/link";
import { getDailyReports, getJobFiles, getTimeEntries, type DailyReportListRow, type JobFileRow, type JobTimeEntryRow } from "@/lib/db/queries";

function getEmployeeName(employees: JobTimeEntryRow["employees"]) {
  if (!employees) return "—";
  if (Array.isArray(employees)) return employees[0]?.full_name ?? "—";
  return employees.full_name;
}

function getJobLabel(jobs: JobTimeEntryRow["jobs"] | DailyReportListRow["jobs"] | JobFileRow["jobs"]) {
  if (!jobs) return "—";
  if (Array.isArray(jobs)) {
    const job = jobs[0];
    return job ? `${job.job_number} · ${job.name}` : "—";
  }

  return `${jobs.job_number} · ${jobs.name}`;
}

function getSubmitter(users: DailyReportListRow["users"] | JobFileRow["users"], employees?: JobFileRow["employees"]) {
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

export default async function DashboardPage() {
  const [{ data: timeEntries }, { data: reports }, { data: uploads }] = await Promise.all([
    getTimeEntries(),
    getDailyReports(),
    getJobFiles(),
  ]);

  const recentTimeEntries = (timeEntries ?? []).slice(0, 5);
  const recentReports = (reports ?? []).slice(0, 5);
  const recentUploads = (uploads ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">Admin Home</h1>
        <p className="mt-3 text-zinc-600">Quick view of field activity across time, reports, and uploads.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-zinc-500">Recent Time Entries</p>
          <p className="mt-2 text-2xl font-semibold">{recentTimeEntries.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-zinc-500">Recent Daily Reports</p>
          <p className="mt-2 text-2xl font-semibold">{recentReports.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-zinc-500">Recent Uploads</p>
          <p className="mt-2 text-2xl font-semibold">{recentUploads.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <h2 className="text-lg font-semibold">Quick Links</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/dashboard/jobs" className="rounded-xl border px-4 py-2 text-sm">Jobs</Link>
          <Link href="/dashboard/daily-reports" className="rounded-xl border px-4 py-2 text-sm">Daily Reports</Link>
          <Link href="/dashboard/uploads" className="rounded-xl border px-4 py-2 text-sm">Uploads</Link>
          <Link href="/dashboard/change-orders" className="rounded-xl border px-4 py-2 text-sm">Change Orders</Link>
          <Link href="/dashboard/time" className="rounded-xl border px-4 py-2 text-sm">Time</Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-semibold">Recent Time Entries</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {recentTimeEntries.map((entry) => (
              <li key={entry.id} className="rounded-xl border p-3">
                <p className="font-medium">{getEmployeeName(entry.employees)}</p>
                <p className="text-zinc-600">{getJobLabel(entry.jobs)}</p>
                <p className="text-zinc-500">{entry.clock_in_at}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-semibold">Recent Daily Reports</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {recentReports.map((report) => (
              <li key={report.id} className="rounded-xl border p-3">
                <p className="font-medium">{getJobLabel(report.jobs)}</p>
                <p className="text-zinc-600">{getSubmitter(report.users)}</p>
                <p className="text-zinc-500">{report.report_date}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-semibold">Recent Uploads</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {recentUploads.map((upload) => (
              <li key={upload.id} className="rounded-xl border p-3">
                <p className="font-medium">{upload.file_name}</p>
                <p className="text-zinc-600">{getJobLabel(upload.jobs)}</p>
                <p className="text-zinc-600">{getSubmitter(upload.users, upload.employees)}</p>
                <p className="text-zinc-500">{upload.created_at}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
