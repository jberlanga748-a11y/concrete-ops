// trigger redeploy marker 2
// trigger redeploy marker
import Link from "next/link";
import { getDailyReports, getJobFiles, getNotifications, getTimeEntries, type DailyReportListRow, type JobFileRow, type JobTimeEntryRow } from "@/lib/db/queries";
import { PageActionLink, PageHeader, Section, StatCard, surfaceClassName } from "@/components/ui/primitives";
import { AppIcon } from "@/components/ui/icons";

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
  const today = new Date().toISOString().slice(0, 10);
  const todaysReports = allReports.filter((report) => report.report_date === today).length;
  const todaysUploads = allUploads.filter((upload) => upload.created_at.slice(0, 10) === today).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Contractor Command Center"
        title="Admin Dashboard"
        description="Monitor today’s labor, field reporting, uploads, and office review work from one premium control center."
        action={
          <div className="flex flex-wrap gap-3">
            <PageActionLink href="/dashboard/jobs/new">New Job</PageActionLink>
            <Link href="/dashboard/change-orders" className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100">
              Review Change Orders
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Active Crew" value={activeClocks} hint={`${allTimeEntries.length} total time entries on the board`} icon="clock" tone="success" />
        <StatCard label="Today's Reports" value={todaysReports} hint={`Latest: ${formatDate(recentReports[0]?.report_date)}`} icon="clipboard" />
        <StatCard label="Today's Uploads" value={todaysUploads} hint={`Latest: ${formatDateTime(recentUploads[0]?.created_at)}`} icon="upload" />
        <StatCard label="Office Reviews" value="Queue" hint="Change orders and approvals are waiting here." icon="document" tone="warning" />
        <StatCard label="Notifications" value={allUnreadNotifications.length} hint="Unread office updates" icon="bell" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Section
          title="Today at a glance"
          description="The current pulse of labor, reporting, and field proof coming in from the team."
        >
          <div className="grid gap-3 md:grid-cols-3">
            <div className={`${surfaceClassName} rounded-2xl p-4`}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-700">
                  <AppIcon icon="users" className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-zinc-900">{activeClocks} active shifts</p>
                  <p className="text-sm text-zinc-500">Crew members currently clocked in</p>
                </div>
              </div>
            </div>
            <div className={`${surfaceClassName} rounded-2xl p-4`}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-700">
                  <AppIcon icon="clipboard" className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-zinc-900">{todaysReports} reports today</p>
                  <p className="text-sm text-zinc-500">Daily reporting pace from the field</p>
                </div>
              </div>
            </div>
            <div className={`${surfaceClassName} rounded-2xl p-4`}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-700">
                  <AppIcon icon="upload" className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-zinc-900">{todaysUploads} uploads today</p>
                  <p className="text-sm text-zinc-500">Photos and support docs landing now</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Quick Actions" description="Jump straight into the most common admin workflows.">
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/dashboard/time" className="rounded-xl border bg-zinc-50 px-4 py-3 text-sm font-medium hover:bg-zinc-100">Open Time Board</Link>
          <Link href="/dashboard/daily-reports/new" className="rounded-xl border bg-zinc-50 px-4 py-3 text-sm font-medium hover:bg-zinc-100">Create Daily Report</Link>
          <Link href="/dashboard/uploads/new" className="rounded-xl border bg-zinc-50 px-4 py-3 text-sm font-medium hover:bg-zinc-100">Add Upload</Link>
          <Link href="/dashboard/change-orders/new" className="rounded-xl border bg-zinc-50 px-4 py-3 text-sm font-medium hover:bg-zinc-100">Start Change Order</Link>
          <Link href="/dashboard/jobs" className="rounded-xl border bg-zinc-50 px-4 py-3 text-sm font-medium hover:bg-zinc-100">View Jobs</Link>
          <Link href="/dashboard/change-orders" className="rounded-xl border bg-zinc-50 px-4 py-3 text-sm font-medium hover:bg-zinc-100">Review Change Orders</Link>
          <Link href="/dashboard/notifications" className="rounded-xl border bg-zinc-50 px-4 py-3 text-sm font-medium hover:bg-zinc-100">Open Notifications</Link>
        </div>
        </Section>
      </div>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className={`${surfaceClassName} rounded-2xl p-4`}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-zinc-900">Recent Time Activity</h3>
            <Link href="/dashboard/time" className="text-xs font-medium text-zinc-600 underline">View all</Link>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {recentTimeEntries.map((entry) => (
              <li key={entry.id} className="rounded-2xl border border-zinc-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-zinc-900">{getEmployeeName(entry.employees)}</p>
                    <p className="text-zinc-600">{getJobLabel(entry.jobs)}</p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-zinc-700">{entry.status}</span>
                </div>
                <p className="mt-2 text-xs text-zinc-500">{formatDateTime(entry.clock_in_at)}</p>
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
              <li key={report.id} className="rounded-2xl border border-zinc-200 p-3">
                <p className="font-medium text-zinc-900">{getJobLabel(report.jobs)}</p>
                <p className="text-zinc-600">{getSubmitter(report.users)}</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-xs text-zinc-500">{formatDate(report.report_date)}</p>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-zinc-700">Report</span>
                </div>
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
              <li key={upload.id} className="rounded-2xl border border-zinc-200 p-3">
                <p className="font-medium text-zinc-900">{upload.file_name}</p>
                <p className="text-zinc-600">{getJobLabel(upload.jobs)}</p>
                <p className="text-zinc-600">{getSubmitter(upload.users, upload.employees)}</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-xs text-zinc-500">{formatDateTime(upload.created_at)}</p>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-zinc-700">Upload</span>
                </div>
              </li>
            ))}
            {recentUploads.length === 0 ? <li className="rounded-xl border p-3 text-zinc-600">No uploads yet.</li> : null}
          </ul>
        </div>
      </section>
    </div>
  );
}
