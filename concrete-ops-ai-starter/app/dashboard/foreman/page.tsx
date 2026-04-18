import Link from "next/link";
import {
  getDailyReports,
  getJobs,
  getTimeEntries,
  type DailyReportListRow,
  type JobTimeEntryRow,
} from "@/lib/db/queries";
import { formatDateOnly, formatTimestamp } from "@/lib/time/formatting";

function getEmployeeName(employees: JobTimeEntryRow["employees"]) {
  if (!employees) return "—";
  if (Array.isArray(employees)) return employees[0]?.full_name ?? "—";
  return employees.full_name;
}

function getJobLabel(jobs: JobTimeEntryRow["jobs"] | DailyReportListRow["jobs"]) {
  if (!jobs) return "—";
  if (Array.isArray(jobs)) {
    const job = jobs[0];
    return job ? `${job.job_number} · ${job.name}` : "—";
  }

  return `${jobs.job_number} · ${jobs.name}`;
}

export default async function ForemanHomePage() {
  const [{ data: jobs }, { data: reports }, { data: timeEntries }] = await Promise.all([
    getJobs(),
    getDailyReports(),
    getTimeEntries(),
  ]);

  const allJobs = jobs ?? [];
  const allReports = reports ?? [];
  const allTimeEntries = timeEntries ?? [];

  const todayIso = new Date().toISOString().slice(0, 10);
  const closedStatuses = new Set(["completed", "closed", "cancelled"]);
  const activeJobs = allJobs.filter((job) => !closedStatuses.has(job.status.toLowerCase()));
  const completedJobs = allJobs.filter((job) => closedStatuses.has(job.status.toLowerCase()));
  const activeCrew = allTimeEntries.filter((entry) => entry.status === "clocked_in").length;
  const reportsToday = allReports.filter((report) => report.report_date === todayIso).length;
  const recentReports = allReports.slice(0, 5);
  const recentTimeEntries = allTimeEntries.slice(0, 5);

  const stats = [
    {
      label: "Active Jobs",
      value: activeJobs.length.toString(),
      detail: `${completedJobs.length} completed or closed`,
    },
    {
      label: "Crew Clocked In",
      value: activeCrew.toString(),
      detail: `${allTimeEntries.length} total time entries logged`,
    },
    {
      label: "Reports Filed Today",
      value: reportsToday.toString(),
      detail: `${allReports.length} total reports on the books`,
    },
    {
      label: "Jobs Needing Attention",
      value: activeJobs.slice(0, 3).length.toString(),
      detail: activeJobs.length > 0 ? "Prioritize field follow-up and reporting." : "No open jobs right now.",
    },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Foreman Workspace</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">Keep today&apos;s jobs moving without losing the paper trail.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
              This view is built for field control: keep an eye on live jobs, crew activity, and reporting so the office always has a clear handoff.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/daily-reports/new"
              className="inline-flex items-center justify-center rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Create Daily Report
            </Link>
            <Link
              href="/dashboard/jobs"
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
            >
              Open Jobs
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

      <section className="grid gap-6 xl:grid-cols-[1.35fr,1fr]">
        <article className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Today</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">Jobs moving in the field</h2>
            </div>
            <Link href="/dashboard/jobs" className="text-sm font-medium text-orange-600 hover:text-orange-500">
              View all jobs
            </Link>
          </div>

          <ul className="mt-5 space-y-3">
            {activeJobs.slice(0, 5).map((job) => (
              <li
                key={job.id}
                className="flex flex-col gap-4 rounded-[24px] border border-zinc-200 bg-zinc-50/70 p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <p className="text-base font-semibold text-zinc-950">
                    {job.job_number} · {job.name}
                  </p>
                  <p className="mt-2 text-sm text-zinc-600">Current status: {job.status.replaceAll("_", " ")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-700">
                    Field Ops
                  </span>
                  <Link
                    href={`/dashboard/jobs/${job.id}`}
                    className="inline-flex items-center justify-center rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                  >
                    Open Job Hub
                  </Link>
                </div>
              </li>
            ))}
            {activeJobs.length === 0 ? (
              <li className="rounded-[24px] border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-600">
                No active jobs right now. When work opens back up, the job list will become your field command board.
              </li>
            ) : null}
          </ul>
        </article>

        <article className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Next Actions</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">Keep the office loop closed</h2>
          </div>

          <div className="mt-5 space-y-3">
            {[
              {
                href: "/dashboard/daily-reports/new",
                title: "File today’s report",
                detail: "Close out progress, weather, and crew notes before the shift ends.",
              },
              {
                href: "/dashboard/change-orders",
                title: "Review change orders",
                detail: "Check scope changes and keep field requests moving upstream.",
              },
              {
                href: "/dashboard/uploads",
                title: "Upload field proof",
                detail: "Photos and documents help the office act without chasing updates.",
              },
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
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">Latest reports and crew movement</h2>
          </div>
          <Link href="/dashboard/daily-reports" className="text-sm font-medium text-orange-600 hover:text-orange-500">
            View reports
          </Link>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <article className="rounded-[24px] border border-zinc-200 bg-zinc-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-950">Recent daily reports</h3>
              <Link href="/dashboard/daily-reports" className="text-xs font-medium text-zinc-500 hover:text-zinc-800">
                View all
              </Link>
            </div>
            <ul className="mt-4 space-y-3 text-sm">
              {recentReports.map((report) => (
                <li key={report.id} className="rounded-2xl border border-zinc-200 bg-white p-3">
                  <p className="font-medium text-zinc-950">{getJobLabel(report.jobs)}</p>
                  <p className="mt-1 text-zinc-600">{formatDateOnly(report.report_date)}</p>
                </li>
              ))}
              {recentReports.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-zinc-300 bg-white p-4 text-zinc-600">No reports yet.</li>
              ) : null}
            </ul>
          </article>

          <article className="rounded-[24px] border border-zinc-200 bg-zinc-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-950">Recent crew activity</h3>
              <Link href="/dashboard/time" className="text-xs font-medium text-zinc-500 hover:text-zinc-800">
                View time
              </Link>
            </div>
            <ul className="mt-4 space-y-3 text-sm">
              {recentTimeEntries.map((entry) => (
                <li key={entry.id} className="rounded-2xl border border-zinc-200 bg-white p-3">
                  <p className="font-medium text-zinc-950">{getEmployeeName(entry.employees)}</p>
                  <p className="mt-1 text-zinc-600">{getJobLabel(entry.jobs)}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-zinc-500">
                    {entry.status.replaceAll("_", " ")} · {formatTimestamp(entry.clock_in_at, { includeYear: false })}
                  </p>
                </li>
              ))}
              {recentTimeEntries.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-zinc-300 bg-white p-4 text-zinc-600">No crew activity yet.</li>
              ) : null}
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}
