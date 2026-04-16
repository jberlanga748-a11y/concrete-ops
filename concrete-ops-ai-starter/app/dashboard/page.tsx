// trigger redeploy marker 2
// trigger redeploy marker
import Link from "next/link";
import { getDailyReports, getJobFiles, getNotifications, getTimeEntries, type DailyReportListRow, type JobFileRow, type JobTimeEntryRow } from "@/lib/db/queries";
import { MetricCard, PageActionLink, PageHeader, SectionCard, surfaceClassName } from "@/components/ui/primitives";

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
      <PageHeader
        eyebrow="Contractor Command Center"
        title="Admin Dashboard"
        description="Monitor today’s labor, reports, uploads, and office review work from one clean control center."
        action={<PageActionLink href="/dashboard/jobs/new">New Job</PageActionLink>}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Time Entries" value={allTimeEntries.length} hint={`${activeClocks} currently clocked in`} />
        <MetricCard label="Daily Reports" value={allReports.length} hint={`Latest: ${formatDate(recentReports[0]?.report_date)}`} />
        <MetricCard label="Uploads" value={allUploads.length} hint={`Latest: ${formatDateTime(recentUploads[0]?.created_at)}`} />
        <MetricCard label="Open Change Orders" value="Review Queue" hint="Go to change orders to review status." />
        <MetricCard label="Notifications" value={allUnreadNotifications.length} hint="Unread office updates." />
      </section>

      <SectionCard title="Quick Actions" description="Jump straight into the most common admin workflows.">
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/dashboard/time" className="rounded-xl border bg-zinc-50 px-4 py-3 text-sm font-medium hover:bg-zinc-100">Open Time Board</Link>
          <Link href="/dashboard/daily-reports/new" className="rounded-xl border bg-zinc-50 px-4 py-3 text-sm font-medium hover:bg-zinc-100">Create Daily Report</Link>
          <Link href="/dashboard/uploads/new" className="rounded-xl border bg-zinc-50 px-4 py-3 text-sm font-medium hover:bg-zinc-100">Add Upload</Link>
          <Link href="/dashboard/change-orders/new" className="rounded-xl border bg-zinc-50 px-4 py-3 text-sm font-medium hover:bg-zinc-100">Start Change Order</Link>
          <Link href="/dashboard/jobs" className="rounded-xl border bg-zinc-50 px-4 py-3 text-sm font-medium hover:bg-zinc-100">View Jobs</Link>
          <Link href="/dashboard/change-orders" className="rounded-xl border bg-zinc-50 px-4 py-3 text-sm font-medium hover:bg-zinc-100">Review Change Orders</Link>
          <Link href="/dashboard/notifications" className="rounded-xl border bg-zinc-50 px-4 py-3 text-sm font-medium hover:bg-zinc-100">Open Notifications</Link>
        </div>
      </SectionCard>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className={`${surfaceClassName} rounded-2xl p-4`}>
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

        <div className={`${surfaceClassName} rounded-2xl p-4`}>
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

        <div className={`${surfaceClassName} rounded-2xl p-4`}>
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
