import Link from "next/link";
import { getJobs } from "@/lib/db/queries";
import { EmptyState, PageActionLink, PageHeader, SectionCard, surfaceClassName } from "@/components/ui/primitives";

export default async function ForemanHomePage() {
  const { data: jobs } = await getJobs();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Field Ops"
        title="Foreman"
        description="Stay focused on live jobs, time, reports, and field documentation with a reduced foreman-first workspace."
        action={<PageActionLink href="/dashboard/daily-reports/new">New Report</PageActionLink>}
      />

      <SectionCard title="Assigned Jobs" description="Open the job hub, capture field updates, and keep work moving." action={<Link href="/dashboard/jobs" className="text-sm font-medium text-zinc-600 underline">Open full list</Link>}>

        <ul className="mt-3 space-y-2 text-sm">
          {(jobs ?? []).slice(0, 15).map((job) => (
            <li
              key={job.id}
              className={`flex items-center justify-between rounded-2xl border border-zinc-200 p-4 transition hover:bg-zinc-50 ${surfaceClassName}`}
            >
              <div>
                <p className="font-medium">
                  {job.job_number} · {job.name}
                </p>
                <p className="text-zinc-600">Status: {job.status}</p>
              </div>
              <Link
                className="rounded-xl bg-zinc-900 px-4 py-2 text-white text-sm"
                href={`/dashboard/jobs/${job.id}`}
              >
                Job Hub
              </Link>
            </li>
          ))}
          {(jobs ?? []).length === 0 ? (
            <li>
              <EmptyState title="No jobs available yet" description="Once jobs are added, this foreman dashboard will surface them here for quick access." />
            </li>
          ) : null}
        </ul>
      </SectionCard>
    </div>
  );
}
