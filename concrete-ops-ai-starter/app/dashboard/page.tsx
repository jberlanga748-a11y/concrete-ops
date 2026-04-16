// trigger redeploy marker 2
// trigger redeploy marker
import Link from "next/link";
import { getDailyReports, getJobFiles, getNotifications, getTimeEntries, type DailyReportListRow, type JobFileRow, type JobTimeEntryRow } from "@/lib/db/queries";

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

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
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

export default async function DashboardPage() {
  const [{ data: timeEntries }, { data: reports }, { data: uploads }, { data: unreadNotifications }] = await Promise.all([
    getTimeEntries(),
    getDailyReports(),
    getJobFiles(),
    getNotifications({ unreadOnly: true }),
  ]);

  const allTimeEntries = timeEntries ?? [];
  const allReports = reports ?? [];
  const allUploads = uploads ?? [];
  const allUnreadNotifications = unreadNotifications ?? [];

  const recentTimeEntries = allTimeEntries.slice(0, 6);
  const recentReports = allReports.slice(0, 6);
  const recentUploads = allUploads.slice(0, 6);

  const activeClocks = allTimeEntries.filter((entry) => entry.status === "clocked_in").length;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Contractor Command Center</p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 sm:text-3xl">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-zinc-600 sm:text-base">Monitor today&apos;s activity across labor, reports, and field uploads.</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Time Entries</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">{allTimeEntries.length}</p>
          <p className="mt-1 text-xs text-zinc-500">{activeClocks} currently clocked in</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Daily Reports</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">{allReports.length}</p>
          <p className="mt-1 text-xs text-zinc-500">Latest: {formatDate(recentReports[0]?.report_date)}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Uploads</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">{allUploads.length}</p>
          <p className="mt-1 text-xs text-zinc-500">Latest: {formatDateTime(recentUploads[0]?.created_at)}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Open Change Orders</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">Review Queue</p>
          <p className="mt-1 text-xs text-zinc-500">Go to change orders to review status.</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Notifications</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">{allUnreadNotifications.length}</p>
          <p className="mt-1 text-xs text-zinc-500">Unread office updates.</p>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-semibold text-zinc-900">Quick Actions</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/dashboard/time" className="rounded-xl border bg-zinc-50 px-4 py-3 text-sm font-medium hover:bg-zinc-100">Open Time Board</Link>
          <Link href="/dashboard/daily-reports/new" className="rounded-xl border bg-zinc-50 px-4 py-3 text-sm font-medium hover:bg-zinc-100">Create Daily Report</Link>
          <Link href="/dashboard/uploads/new" className="rounded-xl border bg-zinc-50 px-4 py-3 text-sm font-medium hover:bg-zinc-100">Add Upload</Link>
          <Link href="/dashboard/change-orders/new" className="rounded-xl border bg-zinc-50 px-4 py-3 text-sm font-medium hover:bg-zinc-100">Start Change Order</Link>
          <Link href="/dashboard/jobs" className="rounded-xl border bg-zinc-50 px-4 py-3 text-sm font-medium hover:bg-zinc-100">View Jobs</Link>
          <Link href="/dashboard/change-orders" className="rounded-xl border bg-zinc-50 px-4 py-3 text-sm font-medium hover:bg-zinc-100">Review Change Orders</Link>
          <Link href="/dashboard/notifications" className="rounded-xl border bg-zinc-50 px-4 py-3 text-sm font-medium hover:bg-zinc-100">Open Notifications</Link>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-zinc-900">Recent Time Activity</h3>
            <Link href="/dashboard/time" className="text-xs font-medium text-zinc-600 underline">View all</Link>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {recentTimeEntries.map((entry) => (
              <li key={entry.id} className="rounded-xl border p-3">
                <p className="font-medium text-zinc-900">{getEmployeeName(entry.employees)}</p>
                <p className="text-zinc-600">{getJobLabel(entry.jobs)}</p>
                <p className="text-xs text-zinc-500">{formatDateTime(entry.clock_in_at)} · {entry.status}</p>
              </li>
            ))}
            {recentTimeEntries.length === 0 ? <li className="rounded-xl border p-3 text-zinc-600">No time activity yet.</li> : null}
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-zinc-900">Recent Daily Reports</h3>
            <Link href="/dashboard/daily-reports" className="text-xs font-medium text-zinc-600 underline">View all</Link>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {recentReports.map((report) => (
              <li key={report.id} className="rounded-xl border p-3">
                <p className="font-medium text-zinc-900">{getJobLabel(report.jobs)}</p>
                <p className="text-zinc-600">{getSubmitter(report.users)}</p>
                <p className="text-xs text-zinc-500">{formatDate(report.report_date)}</p>
              </li>
            ))}
            {recentReports.length === 0 ? <li className="rounded-xl border p-3 text-zinc-600">No daily reports yet.</li> : null}
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-zinc-900">Recent Uploads</h3>
            <Link href="/dashboard/uploads" className="text-xs font-medium text-zinc-600 underline">View all</Link>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {recentUploads.map((upload) => (
              <li key={upload.id} className="rounded-xl border p-3">
                <p className="font-medium text-zinc-900">{upload.file_name}</p>
                <p className="text-zinc-600">{getJobLabel(upload.jobs)}</p>
                <p className="text-zinc-600">{getSubmitter(upload.users, upload.employees)}</p>
                <p className="text-xs text-zinc-500">{formatDateTime(upload.created_at)}</p>
              </li>
            ))}
            {recentUploads.length === 0 ? <li className="rounded-xl border p-3 text-zinc-600">No uploads yet.</li> : null}
          </ul>
        </div>
      </section>
    </div>
  );
}
