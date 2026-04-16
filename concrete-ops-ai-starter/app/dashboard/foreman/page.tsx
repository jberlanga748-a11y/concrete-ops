import Link from "next/link";
import { getDailyReports, getIncidents, getJobs, getToolboxTalks } from "@/lib/db/queries";
import { EmptyState, PageActionLink, PageHeader, Section, StatCard, surfaceClassName } from "@/components/ui/primitives";
import { AppIcon } from "@/components/ui/icons";

export default async function ForemanHomePage() {
  const [{ data: jobs }, { data: reports }, { data: talks }, { data: incidents }] = await Promise.all([
    getJobs(),
    getDailyReports(),
    getToolboxTalks(),
    getIncidents(),
  ]);
  const allJobs = jobs ?? [];
  const allReports = reports ?? [];
  const allTalks = talks ?? [];
  const allIncidents = incidents ?? [];
  const activeJobs = allJobs.filter((job) => job.status === "in_progress" || job.status === "scheduled").length;
  const today = new Date().toISOString().slice(0, 10);
  const todaysReports = allReports.filter((report) => report.report_date === today).length;
  const todaysTalks = allTalks.filter((talk) => talk.talk_date === today).length;
  const openIncidents = allIncidents.filter((incident) => incident.status !== "closed").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Field Ops"
        title="Foreman"
        description="Stay focused on today’s jobs, crew flow, reporting, and safety work with an intentional foreman-first workspace."
        action={
          <div className="flex flex-wrap gap-3">
            <PageActionLink href="/dashboard/daily-reports/new">New Report</PageActionLink>
            <Link href="/dashboard/toolbox-talks/new" className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100">
              New Toolbox Talk
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Jobs" value={activeJobs} hint={`${allJobs.length} visible jobs`} icon="hammer" tone="success" />
        <StatCard label="Today's Reports" value={todaysReports} hint="Submitted from the field today" icon="clipboard" />
        <StatCard label="Toolbox Talks" value={todaysTalks} hint="Safety talks logged today" icon="chat" />
        <StatCard label="Open Incidents" value={openIncidents} hint="Keep an eye on safety follow-up" icon="alert" tone="warning" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Section title="Today’s field priorities" description="What needs attention first before the day gets away from you.">
          <div className="grid gap-3">
            <div className={`${surfaceClassName} rounded-2xl p-4`}>
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-700">
                  <AppIcon icon="clipboard" className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-medium text-zinc-950">Submit the day’s report before wrap-up</p>
                  <p className="mt-1 text-sm text-zinc-600">Daily reporting stays the main record for production progress, crew hours, and safety notes.</p>
                </div>
              </div>
            </div>
            <div className={`${surfaceClassName} rounded-2xl p-4`}>
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-700">
                  <AppIcon icon="upload" className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-medium text-zinc-950">Capture field proof while it’s fresh</p>
                  <p className="mt-1 text-sm text-zinc-600">Uploads and change-order support land faster when they are attached at the source.</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Quick Actions" description="The most common foreman tasks stay one tap away.">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <Link href="/dashboard/jobs" className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100">Open Jobs</Link>
            <Link href="/dashboard/time" className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100">Open Time</Link>
            <Link href="/dashboard/uploads" className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100">Add Upload</Link>
            <Link href="/dashboard/change-orders/new" className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100">Start Change Order</Link>
          </div>
        </Section>
      </div>

      <Section title="Assigned Jobs" description="Open the job hub, capture field updates, and keep work moving." action={<Link href="/dashboard/jobs" className="text-sm font-medium text-zinc-600 underline">Open full list</Link>}>

        <ul className="mt-3 space-y-2 text-sm">
          {allJobs.slice(0, 15).map((job) => (
            <li
              key={job.id}
              className="flex items-center justify-between rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-50 hover:shadow-md"
            >
              <div>
                <p className="font-medium text-zinc-950">
                  {job.job_number} · {job.name}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-zinc-700">{job.status}</span>
                </div>
              </div>
              <Link
                className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white"
                href={`/dashboard/jobs/${job.id}`}
              >
                Job Hub
              </Link>
            </li>
          ))}
          {allJobs.length === 0 ? (
            <li>
              <EmptyState title="No jobs available yet" description="Once jobs are added, this foreman dashboard will surface them here for quick access." />
            </li>
          ) : null}
        </ul>
      </Section>
    </div>
  );
}
