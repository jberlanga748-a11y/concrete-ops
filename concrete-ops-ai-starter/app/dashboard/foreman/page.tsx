import Link from "next/link";
import {
  getDailyReports,
  getJobs,
  getTimeEntries,
  type DailyReportListRow,
  type JobListRow,
  type JobTimeEntryRow,
} from "@/lib/db/queries";

function getEmployeeName(employees: JobTimeEntryRow["employees"]) {
  if (!employees) return "—";
  if (Array.isArray(employees)) return employees[0]?.full_name ?? "—";
  return employees.full_name;
}

function getCustomerName(customers: JobListRow["customers"]) {
  if (!customers) return "No customer assigned";
  if (Array.isArray(customers)) return customers[0]?.name ?? "No customer assigned";
  return customers.name;
}

function getJobLabel(jobs: JobTimeEntryRow["jobs"] | DailyReportListRow["jobs"]) {
  if (!jobs) return "—";
  if (Array.isArray(jobs)) {
    const job = jobs[0];
    return job ? `${job.job_number} · ${job.name}` : "—";
  }

  return `${jobs.job_number} · ${jobs.name}`;
}

function formatUtcDate(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function formatUtcDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(parsed);
}

function formatStatusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function getStatusClasses(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("hold") || normalized.includes("delay")) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (normalized.includes("complete") || normalized.includes("closed")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-300">{detail}</p>
    </article>
  );
}

function ActionCard({
  href,
  title,
  detail,
}: {
  href: string;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-[24px] border border-zinc-200 bg-white p-4 shadow-[0_14px_28px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50/50"
    >
      <p className="text-sm font-semibold text-zinc-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{detail}</p>
    </Link>
  );
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
  const liveCrewEntries = allTimeEntries.filter((entry) => entry.status === "clocked_in");
  const crewOnBreak = allTimeEntries.filter((entry) => entry.status === "on_break").length;
  const reportsTodayList = allReports.filter((report) => report.report_date === todayIso);
  const reportsToday = reportsTodayList.length;
  const reportsTodayByJob = new Set(reportsTodayList.map((report) => report.job_id).filter(Boolean));
  const activeJobsWithoutReport = activeJobs.filter((job) => !reportsTodayByJob.has(job.id));
  const urgentJobs = activeJobs.filter((job) => {
    const status = job.status.toLowerCase();
    return status.includes("hold") || status.includes("delay");
  });
  const latestReport = allReports[0] ?? null;
  const recentReports = allReports.slice(0, 4);
  const recentTimeEntries = allTimeEntries.slice(0, 4);
  const liveCrewByJob = new Map<string, number>();

  for (const entry of liveCrewEntries) {
    if (!entry.job_id) continue;
    liveCrewByJob.set(entry.job_id, (liveCrewByJob.get(entry.job_id) ?? 0) + 1);
  }

  const metrics = [
    {
      label: "Active Jobs",
      value: activeJobs.length.toString(),
      detail: `${completedJobs.length} jobs are completed or closed`,
    },
    {
      label: "Crew Live",
      value: liveCrewEntries.length.toString(),
      detail: crewOnBreak > 0 ? `${crewOnBreak} crew members are on break` : "No live break status right now",
    },
    {
      label: "Reports Today",
      value: reportsToday.toString(),
      detail:
        activeJobsWithoutReport.length > 0
          ? `${activeJobsWithoutReport.length} active jobs still need today’s report`
          : "Every active job has a report filed today",
    },
    {
      label: "Needs Attention",
      value: urgentJobs.length.toString(),
      detail: urgentJobs.length > 0 ? "Delayed or on-hold jobs need a foreman touchpoint" : "No urgent status blockers on the board",
    },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-[36px] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_32%),linear-gradient(135deg,#161918_0%,#232826_48%,#0c0f0d_100%)] px-6 py-6 text-white shadow-[0_28px_80px_rgba(15,23,42,0.24)] sm:px-8 sm:py-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 border-l border-white/5 bg-[linear-gradient(150deg,rgba(255,255,255,0.05),transparent_38%,rgba(251,191,36,0.1))] xl:block" />
        <div className="absolute -left-10 top-16 h-40 w-40 rounded-full bg-amber-300/[0.12] blur-3xl" />
        <div className="absolute bottom-0 right-12 h-36 w-36 rounded-full bg-emerald-300/[0.08] blur-3xl" />

        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex rounded-full border border-white/[0.12] bg-white/[0.08] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-200">
                Foreman Command
              </span>
              <span className="inline-flex rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs font-medium text-zinc-200">
                {activeJobs.length} active jobs in motion
              </span>
              <span className="inline-flex rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs font-medium text-zinc-200">
                {reportsToday} reports filed today
              </span>
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-[3.05rem]">
              Run the field day like a live operations board.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
              This foreman workspace shifts from a simple dashboard into a premium command layer: jobs, crew movement,
              reporting gaps, and next actions all stay visible in one industrial control surface.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard/daily-reports/new"
                className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-5 py-3 text-sm font-semibold text-zinc-950 shadow-[0_18px_44px_rgba(245,158,11,0.28)] transition hover:bg-amber-300"
              >
                Create Daily Report
              </Link>
              <Link
                href="/dashboard/jobs"
                className="inline-flex items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Open Jobs
              </Link>
              <p className="inline-flex items-center rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-zinc-200">
                Latest report
                <span className="ml-2 font-semibold text-white">
                  {latestReport ? formatUtcDate(latestReport.report_date) : "No report filed yet"}
                </span>
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[500px]">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} label={metric.label} value={metric.value} detail={metric.detail} />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr,0.95fr]">
        <article className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.07)] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">Field Board</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">Jobs moving in the field right now</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
                Review live job motion, report coverage, and crew presence without bouncing between pages.
              </p>
            </div>
            <Link href="/dashboard/jobs" className="text-sm font-medium text-amber-700 transition hover:text-amber-600">
              View all jobs
            </Link>
          </div>

          <ul className="mt-6 space-y-3">
            {activeJobs.slice(0, 5).map((job) => {
              const liveCrew = liveCrewByJob.get(job.id) ?? 0;
              const hasReportToday = reportsTodayByJob.has(job.id);

              return (
                <li
                  key={job.id}
                  className="rounded-[26px] border border-zinc-200 bg-[linear-gradient(180deg,rgba(250,250,249,1)_0%,rgba(245,245,244,0.92)_100%)] p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusClasses(job.status)}`}>
                          {formatStatusLabel(job.status)}
                        </span>
                        <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                          {hasReportToday ? "Report filed today" : "Report still due"}
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold tracking-tight text-zinc-950">
                        {job.job_number} · {job.name}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-600">{getCustomerName(job.customers)}</p>
                    </div>

                    <div className="rounded-[22px] border border-zinc-200 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Live Crew</p>
                      <p className="mt-2 text-lg font-semibold text-zinc-950">{liveCrew}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <p className="text-sm text-zinc-600">
                      {hasReportToday
                        ? "Today’s report is already on file for this job."
                        : "This job still needs a daily report submission before handoff."}
                    </p>
                    <Link
                      href={`/dashboard/jobs/${job.id}`}
                      className="inline-flex items-center justify-center rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                    >
                      Open Job Hub
                    </Link>
                  </div>
                </li>
              );
            })}
            {activeJobs.length === 0 ? (
              <li className="rounded-[26px] border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm leading-6 text-zinc-600">
                No active jobs are on the board right now. Once field work picks back up, this section becomes the live command
                surface for active crews and daily report coverage.
              </li>
            ) : null}
          </ul>
        </article>

        <div className="space-y-6">
          <article className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.07)] sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">Priority Queue</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">Close the next field handoff</h2>
            </div>

            <div className="mt-5 space-y-3">
              <ActionCard
                href="/dashboard/daily-reports/new"
                title="File today’s report"
                detail="Capture crew progress, weather, and blockers before the shift closes."
              />
              <ActionCard
                href="/dashboard/change-orders"
                title="Review change orders"
                detail="Move scope questions upstream before the field loses momentum."
              />
              <ActionCard
                href="/dashboard/uploads"
                title="Upload field proof"
                detail="Send photos and documents so the office can act without a callback."
              />
            </div>
          </article>

          <article className="rounded-[32px] border border-zinc-200 bg-[linear-gradient(145deg,#fff8eb_0%,#ffffff_100%)] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.07)] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Shift Snapshot</p>
            <div className="mt-4 space-y-4 text-sm">
              <div className="rounded-[22px] border border-amber-200 bg-white/80 p-4">
                <p className="font-semibold text-zinc-950">Report coverage</p>
                <p className="mt-2 leading-6 text-zinc-700">
                  {activeJobsWithoutReport.length > 0
                    ? `${activeJobsWithoutReport.length} active jobs still need today’s report before the office handoff is clean.`
                    : "All active jobs have today’s reporting covered."}
                </p>
              </div>
              <div className="rounded-[22px] border border-amber-200 bg-white/80 p-4">
                <p className="font-semibold text-zinc-950">Crew visibility</p>
                <p className="mt-2 leading-6 text-zinc-700">
                  {liveCrewEntries.length > 0
                    ? `${liveCrewEntries.length} crew members are currently clocked in across ${liveCrewByJob.size} jobs.`
                    : "No crews are currently clocked in on the board."}
                </p>
              </div>
              <div className="rounded-[22px] border border-amber-200 bg-white/80 p-4">
                <p className="font-semibold text-zinc-950">Time standard</p>
                <p className="mt-2 leading-6 text-zinc-700">
                  Server-rendered timestamps below are shown in UTC so the page stays explicit and stable in production.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.07)] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">Activity Feed</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">Latest reporting and crew movement</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              The foreman view keeps the most recent office-facing proof and crew movement on the same board.
            </p>
          </div>
          <div className="flex gap-3 text-sm font-medium">
            <Link href="/dashboard/daily-reports" className="text-amber-700 transition hover:text-amber-600">
              View reports
            </Link>
            <Link href="/dashboard/time" className="text-zinc-600 transition hover:text-zinc-900">
              View time
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <article className="rounded-[26px] border border-zinc-200 bg-zinc-50/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-600">Recent daily reports</h3>
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                {recentReports.length} visible
              </span>
            </div>

            <ul className="mt-4 space-y-3 text-sm">
              {recentReports.map((report) => (
                <li key={report.id} className="rounded-[22px] border border-zinc-200 bg-white p-4">
                  <p className="font-semibold text-zinc-950">{getJobLabel(report.jobs)}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">Filed for {formatUtcDate(report.report_date)}</p>
                  <Link
                    href={`/dashboard/daily-reports/${report.id}`}
                    className="mt-3 inline-flex text-sm font-medium text-amber-700 transition hover:text-amber-600"
                  >
                    Open report
                  </Link>
                </li>
              ))}
              {recentReports.length === 0 ? (
                <li className="rounded-[22px] border border-dashed border-zinc-300 bg-white p-4 text-zinc-600">
                  No reports have been filed yet.
                </li>
              ) : null}
            </ul>
          </article>

          <article className="rounded-[26px] border border-zinc-200 bg-zinc-50/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-600">Recent crew movement</h3>
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                UTC
              </span>
            </div>

            <ul className="mt-4 space-y-3 text-sm">
              {recentTimeEntries.map((entry) => (
                <li key={entry.id} className="rounded-[22px] border border-zinc-200 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusClasses(entry.status)}`}>
                      {formatStatusLabel(entry.status)}
                    </span>
                  </div>
                  <p className="mt-3 font-semibold text-zinc-950">{getEmployeeName(entry.employees)}</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">{getJobLabel(entry.jobs)}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    {entry.clock_out_at ? formatUtcDateTime(entry.clock_out_at) : formatUtcDateTime(entry.clock_in_at)}
                  </p>
                </li>
              ))}
              {recentTimeEntries.length === 0 ? (
                <li className="rounded-[22px] border border-dashed border-zinc-300 bg-white p-4 text-zinc-600">
                  No crew activity has been logged yet.
                </li>
              ) : null}
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}
