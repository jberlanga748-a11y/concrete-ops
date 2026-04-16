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

function formatRelativeCount(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function ConcreteTruckWatermark() {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      className="h-28 w-28 text-white/10"
    >
      <circle cx="34" cy="88" r="10" />
      <circle cx="82" cy="88" r="10" />
      <path d="M18 76V38c0-4.4 3.6-8 8-8h34l15-11c5.3-3.9 12.8-2.1 15.8 3.5L99 46h7c4.4 0 8 3.6 8 8v22" />
      <path d="M50 30v32" />
      <path d="M69 33 87 47" />
      <path d="M18 76h6" />
      <path d="M44 76h25" />
      <path d="M92 76h22" />
    </svg>
  );
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

  const recentTimeEntries = allTimeEntries.slice(0, 5);
  const recentReports = allReports.slice(0, 5);
  const recentUploads = allUploads.slice(0, 5);

  const activeClocks = allTimeEntries.filter((entry) => entry.status === "clocked_in").length;
  const todayIso = new Date().toISOString().slice(0, 10);
  const reportsToday = allReports.filter((report) => report.report_date === todayIso).length;
  const uploadsToday = allUploads.filter((upload) => upload.created_at?.slice(0, 10) === todayIso).length;
  const jobsTouchedToday = new Set(
    allTimeEntries
      .filter((entry) => entry.clock_in_at?.slice(0, 10) === todayIso)
      .map((entry) => getJobLabel(entry.jobs))
      .filter((label) => label !== "—")
  ).size;

  const stats = [
    {
      label: "Active Crew Clocks",
      value: activeClocks.toString(),
      detail: `${formatRelativeCount(allTimeEntries.length, "entry")} logged overall`,
    },
    {
      label: "Reports Filed Today",
      value: reportsToday.toString(),
      detail: `${formatRelativeCount(allReports.length, "report")} total`,
    },
    {
      label: "Uploads Captured",
      value: allUploads.length.toString(),
      detail: uploadsToday > 0 ? `${uploadsToday} added today` : "No uploads added today",
    },
    {
      label: "Unread Notifications",
      value: allUnreadNotifications.length.toString(),
      detail: jobsTouchedToday > 0 ? `${jobsTouchedToday} jobs touched today` : "No job activity yet today",
    },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-[32px] border border-zinc-900 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 p-6 text-white shadow-[0_30px_90px_rgba(24,24,27,0.28)] sm:p-8">
        <div className="absolute right-0 top-0 hidden translate-x-8 -translate-y-2 lg:block">
          <ConcreteTruckWatermark />
        </div>
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-300">Operations Command</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Run today&apos;s field and office workflow from one place.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
              Watch labor, reports, uploads, and approvals without bouncing between modules. This dashboard is your daily control center for keeping crews moving and office follow-up tight.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/daily-reports/new"
              className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(249,115,22,0.34)] transition hover:bg-orange-400"
            >
              Create Daily Report
            </Link>
            <Link
              href="/dashboard/jobs"
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-700 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/10"
            >
              View Job Board
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{stat.label}</p>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">{stat.value}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{stat.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
        <article className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Today</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">What needs attention right now</h2>
            </div>
            <Link href="/dashboard/notifications" className="text-sm font-medium text-orange-600 hover:text-orange-500">
              View alerts
            </Link>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-medium text-zinc-900">Labor board</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {activeClocks > 0 ? `${activeClocks} crew members are clocked in.` : "No one is clocked in yet."}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-medium text-zinc-900">Reporting pace</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {reportsToday > 0 ? `${reportsToday} daily reports filed today.` : "No daily reports filed yet today."}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-medium text-zinc-900">Office follow-up</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {allUnreadNotifications.length > 0
                  ? `${allUnreadNotifications.length} unread notifications need review.`
                  : "Notification queue is clear right now."}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-orange-200 bg-orange-50 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Recommended next move</p>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  Start with today&apos;s report queue and then review uploads so field activity stays documented before the day gets away from the office.
                </p>
              </div>
              <Link
                href="/dashboard/daily-reports"
                className="inline-flex items-center justify-center rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Review reports
              </Link>
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Quick Actions</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">Move work forward</h2>
            </div>
            <Link href="/dashboard/jobs" className="text-sm font-medium text-orange-600 hover:text-orange-500">
              Open jobs
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {[
              { href: "/dashboard/time", title: "Open Time Board", detail: "Review live labor, breaks, and clock status." },
              { href: "/dashboard/change-orders/new", title: "Start Change Order", detail: "Capture scope changes before they slip." },
              { href: "/dashboard/uploads/new", title: "Add Upload", detail: "Get photos and supporting files into the record." },
              { href: "/dashboard/notifications", title: "Open Notifications", detail: "Clear office follow-up and escalations." },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="block rounded-2xl border border-zinc-200 px-4 py-4 transition hover:border-orange-300 hover:bg-orange-50"
              >
                <p className="text-sm font-semibold text-zinc-950">{action.title}</p>
                <p className="mt-1 text-sm leading-6 text-zinc-600">{action.detail}</p>
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Recent Activity</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">Latest movement across the operation</h2>
          </div>
          <Link href="/dashboard/time" className="text-sm font-medium text-orange-600 hover:text-orange-500">
            View time board
          </Link>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          <article className="rounded-[24px] border border-zinc-200 bg-zinc-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-950">Time activity</h3>
              <Link href="/dashboard/time" className="text-xs font-medium text-zinc-500 hover:text-zinc-800">
                View all
              </Link>
            </div>
            <ul className="mt-4 space-y-3 text-sm">
              {recentTimeEntries.map((entry) => (
                <li key={entry.id} className="rounded-2xl border border-zinc-200 bg-white p-3">
                  <p className="font-medium text-zinc-950">{getEmployeeName(entry.employees)}</p>
                  <p className="mt-1 text-zinc-600">{getJobLabel(entry.jobs)}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-zinc-500">
                    {entry.status.replaceAll("_", " ")} · {formatDateTime(entry.clock_in_at)}
                  </p>
                </li>
              ))}
              {recentTimeEntries.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-zinc-300 bg-white p-4 text-zinc-600">No time activity yet.</li>
              ) : null}
            </ul>
          </article>

          <article className="rounded-[24px] border border-zinc-200 bg-zinc-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-950">Daily reports</h3>
              <Link href="/dashboard/daily-reports" className="text-xs font-medium text-zinc-500 hover:text-zinc-800">
                View all
              </Link>
            </div>
            <ul className="mt-4 space-y-3 text-sm">
              {recentReports.map((report) => (
                <li key={report.id} className="rounded-2xl border border-zinc-200 bg-white p-3">
                  <p className="font-medium text-zinc-950">{getJobLabel(report.jobs)}</p>
                  <p className="mt-1 text-zinc-600">{getSubmitter(report.users)}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-zinc-500">{formatDate(report.report_date)}</p>
                </li>
              ))}
              {recentReports.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-zinc-300 bg-white p-4 text-zinc-600">No daily reports yet.</li>
              ) : null}
            </ul>
          </article>

          <article className="rounded-[24px] border border-zinc-200 bg-zinc-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-950">Uploads</h3>
              <Link href="/dashboard/uploads" className="text-xs font-medium text-zinc-500 hover:text-zinc-800">
                View all
              </Link>
            </div>
            <ul className="mt-4 space-y-3 text-sm">
              {recentUploads.map((upload) => (
                <li key={upload.id} className="rounded-2xl border border-zinc-200 bg-white p-3">
                  <p className="font-medium text-zinc-950">{upload.file_name}</p>
                  <p className="mt-1 text-zinc-600">{getJobLabel(upload.jobs)}</p>
                  <p className="mt-1 text-zinc-600">{getSubmitter(upload.users, upload.employees)}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-zinc-500">{formatDateTime(upload.created_at)}</p>
                </li>
              ))}
              {recentUploads.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-zinc-300 bg-white p-4 text-zinc-600">No uploads yet.</li>
              ) : null}
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}
