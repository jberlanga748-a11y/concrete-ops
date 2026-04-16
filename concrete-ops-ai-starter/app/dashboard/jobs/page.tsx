import { JobList } from "@/components/jobs/JobList";
import { AppIcon } from "@/components/ui/icons";
import { InlineNotice, PageActionLink, PageHeader, Section, StatCard, StatusPill } from "@/components/ui/primitives";
import { getJobs } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";

export default async function JobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: appUser } = user
    ? await supabase.from("users").select("role").eq("auth_user_id", user.id).maybeSingle()
    : { data: null };
  const isForeman = appUser?.role === "foreman";
  const { data, error } = await getJobs();
  const jobs = data ?? [];
  const activeJobs = jobs.filter((job) => job.status === "in_progress").length;
  const planningJobs = jobs.filter((job) => job.status === "draft" || job.status === "scheduled").length;
  const closedJobs = jobs.filter((job) => job.status === "archived").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Field Ops"
        title="Jobs"
        description="Browse all active work, jump into the Job Hub, and keep crews, reports, uploads, and incidents tied to the same job story."
        action={!isForeman ? <PageActionLink href="/dashboard/jobs/new">New Job</PageActionLink> : undefined}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="All Jobs" value={jobs.length} hint="Projects currently tracked in Concrete Ops." icon="hammer" tone="warning" />
        <StatCard label="Active" value={activeJobs} hint="Jobs actively moving in the field." icon="check" tone="success" />
        <StatCard label="Planning" value={planningJobs} hint="Projects that still need field setup." icon="briefcase" tone="info" />
        <StatCard label="Closed" value={closedJobs} hint="Completed work kept for history and reporting." icon="folder" tone="neutral" />
      </div>

      <Section title="Today’s job workflow" description="Use the Job Hub as the premium home for operations, documents, crew assignments, and field reporting.">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-orange-100 p-3 text-orange-600">
                <AppIcon icon="clipboard" className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-zinc-900">Open the Job Hub</p>
                <p className="mt-1 text-sm text-zinc-600">See reports, documents, crew, and incidents in one place.</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
                <AppIcon icon="users" className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-zinc-900">Keep assignments current</p>
                <p className="mt-1 text-sm text-zinc-600">Active crew assignments power foreman and reporting flows.</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600">
                <AppIcon icon="truck" className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-zinc-900">Field-ready on mobile</p>
                <p className="mt-1 text-sm text-zinc-600">Jobs now collapse into clean cards instead of cramped tables.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusPill tone="warning">Role-safe actions</StatusPill>
          <StatusPill tone="info">Responsive list</StatusPill>
          <StatusPill tone="success">Job Hub driven</StatusPill>
        </div>
      </Section>

      {error ? (
        <InlineNotice tone="error">We couldn’t load jobs right now. Please refresh and try again.</InlineNotice>
      ) : (
        <JobList jobs={jobs} />
      )}
    </div>
  );
}
