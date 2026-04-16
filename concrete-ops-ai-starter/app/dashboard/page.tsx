import Link from "next/link";
import {
  getDailyReports,
  getJobFiles,
  getNotifications,
  getTimeEntries,
  type DailyReportListRow,
  type JobFileRow,
  type JobTimeEntryRow,
} from "@/lib/db/queries";

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
  const [{ data: timeEntries }, { data: reports }, { data: uploads }, { data: unreadNotifications }] =
    await Promise.all([
      getTimeEntries(),
      getDailyReports(),
      getJobFiles(),
      getNotifications({ unreadOnly: true }),
    ]);

  const allTimeEntries = timeEntries ?? [];
  const allReports = reports ?? [];
  const allUploads = uploads ?? [];
  const allUnreadNotifications = unreadNotifications ?? [];

  const recentTimeEntries = allTimeEntries.slice(0, 5);
  const recentReports = allReports.slice(0, 5);
  const recentUploads = allUploads.slice(0, 5);

  const activeClocks = allTimeEntries.filter((entry) => entry.status === "clocked_in").length;

  const stats = [
    {
      label: "Time Entries",
      value: allTimeEntries.length,
      hint: `${activeClocks} currently clocked in`,
    },
    {
      label: "Daily Reports",
      value: allReports.length,
      hint: `Latest ${formatDate(recentReports[0]?.report_date)}`,
    },
    {
      label: "Uploads",
      value: allUploads.length,
      hint: `Latest ${formatDateTime(recentUploads[0]?.created_at)}`,
    },
    {
      label: "Notifications",
      value: allUnreadNotifications.length,
      hint: "Unread office updates",
    },
  ];

  const quickActions = [
    { href: "/dashboard/daily-reports/new", label: "Create Daily Report" },
    { href: "/dashboard/time", label: "Open Time Board" },
    { href: "/dashboard/jobs", label: "View Jobs" },
    { href: "/dashboard/change-orders/new", label: "Start Change Order" },
    { href: "/dashboard/uploads/new", label: "Add Upload" },
    { href: "/dashboard/notifications", label: "Open Notifications" },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-zinc-200 bg-[linear-gradient(135deg,#18181b_0%,#27272a_55%,#3f3f46_100%)] px-6 py-7 text-white shadow-[0_24px_60px_rgba(24,24,27,0.18)] sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.22em] text-orange-200">Contractor Command Center</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Admin Dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
              Track labor, reports, uploads, and notifications from one place so the office can keep the field moving.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/daily-reports/new"
              className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Create Daily Report
            </Link>
            <Link
              href="/dashboard/jobs"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              View Jobs
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_32px_rgba(24,24,27,0.06)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{stat.label}</p>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">{stat.value}</p>
            <p className="mt-3 text-sm leading-6 text-zinc-600">{stat.hint}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.85fr)]">
        <div className="rounded-[30px] border border-zinc-200 bg-white p-5 shadow-[0_16px_36px_rgba(24,24,27,0.06)] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Today</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">Recent Activity</h2>
            </div>
            <Link href="/dashboard/time" className="text-sm font-medium text-orange-600 transition hover:text-orange-700">
              View all
            </Link>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            <div className="rounded-[24px] border border-zinc-200 bg-zinc-50/80 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-700">Time Activity</h3>
                <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-zinc-700">
                  {recentTimeEntries.length}
                </span>
              </div>
              <ul className="mt-4 space-y-3 text-sm">
                {recentTimeEntries.map((entry) => (
                  <li key={entry.id} className="rounded-2xl border border-zinc-200 bg-white p-3">
                    <p className="font-medium text-zinc-950">{getEmployeeName(entry.employees)}</p>
                    <p className="mt-1 text-zinc-600">{getJobLabel(entry.jobs)}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-zinc-500">
                      {formatDateTime(entry.clock_in_at)} · {entry.status}
                    </p>
                  </li>
                ))}
                {recentTimeEntries.length === 0 ? (
                  <li className="rounded-2xl border border-dashed border-zinc-300 bg-white p-3 text-zinc-600">
                    No time activity yet.
                  </li>
                ) : null}
              </ul>
            </div>

            <div className="rounded-[24px] border border-zinc-200 bg-zinc-50/80 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-700">Daily Reports</h3>
                <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-zinc-700">
                  {recentReports.length}
                </span>
              </div>
              <ul className="mt-4 space-y-3 text-sm">
                {recentReports.map((report) => (
                  <li key={report.id} className="rounded-2xl border border-zinc-200 bg-white p-3">
                    <p className="font-medium text-zinc-950">{getJobLabel(report.jobs)}</p>
                    <p className="mt-1 text-zinc-600">{getSubmitter(report.users)}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-zinc-500">{formatDate(report.report_date)}</p>
                  </li>
                ))}
                {recentReports.length === 0 ? (
                  <li className="rounded-2xl border border-dashed border-zinc-300 bg-white p-3 text-zinc-600">
                    No daily reports yet.
                  </li>
                ) : null}
              </ul>
            </div>

            <div className="rounded-[24px] border border-zinc-200 bg-zinc-50/80 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-700">Uploads</h3>
                <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-zinc-700">
                  {recentUploads.length}
                </span>
              </div>
              <ul className="mt-4 space-y-3 text-sm">
                {recentUploads.map((upload) => (
                  <li key={upload.id} className="rounded-2xl border border-zinc-200 bg-white p-3">
                    <p className="font-medium text-zinc-950">{upload.file_name}</p>
                    <p className="mt-1 text-zinc-600">{getJobLabel(upload.jobs)}</p>
                    <p className="mt-1 text-zinc-600">{getSubmitter(upload.users, upload.employees)}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-zinc-500">
                      {formatDateTime(upload.created_at)}
                    </p>
                  </li>
                ))}
                {recentUploads.length === 0 ? (
                  <li className="rounded-2xl border border-dashed border-zinc-300 bg-white p-3 text-zinc-600">
                    No uploads yet.
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-zinc-200 bg-white p-5 shadow-[0_16px_36px_rgba(24,24,27,0.06)] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Runbook</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">Quick Actions</h2>
            </div>
            <Link href="/dashboard/change-orders" className="text-sm font-medium text-orange-600 transition hover:text-orange-700">
              Review queue
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            {quickActions.map((action, index) => (
              <Link
                key={action.href}
                href={action.href}
                className={`rounded-2xl border px-4 py-4 text-sm font-medium transition ${
                  index === 0
                    ? "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                    : "border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100"
                }`}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
