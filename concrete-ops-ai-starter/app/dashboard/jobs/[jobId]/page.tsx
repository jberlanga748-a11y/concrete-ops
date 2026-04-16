import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentList } from "@/components/documents/DocumentList";
import { JobAssignmentsCard } from "@/components/jobs/JobAssignmentsCard";
import { JobCostSnapshotCard } from "@/components/jobs/JobCostSnapshotCard";
import { AppIcon } from "@/components/ui/icons";
import {
  PageHeader,
  Section,
  StatCard,
  StatusPill,
  linkClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/ui/primitives";
import {
  getDocumentsForEntity,
  getJobById,
  getJobAssignments,
  getJobCostSnapshot,
  getEmployeeOptions,
  getTimeEntries,
} from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export default async function JobHubPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: appUser } = user
    ? await supabase.from("users").select("role").eq("auth_user_id", user.id).maybeSingle()
    : { data: null };
  const isForeman = appUser?.role === "foreman";
  const canViewCosts = appUser?.role === "owner" || appUser?.role === "office_admin";

  const { data: job } = await getJobById(jobId);

  if (!job) notFound();

  const costSnapshotPromise = canViewCosts
    ? getJobCostSnapshot(jobId)
    : Promise.resolve({ data: null });

  const [{ data: timeEntries }, { data: assignments }, employeeOptions, { data: documents }, { data: costSnapshot }] =
    await Promise.all([
      getTimeEntries({ jobId }),
      getJobAssignments(jobId),
      getEmployeeOptions(),
      getDocumentsForEntity("job", jobId),
      costSnapshotPromise,
    ]);

  const allTimeEntries = timeEntries ?? [];
  const allAssignments = assignments ?? [];
  const activeCrew = allTimeEntries.filter((entry) => entry.status === "clocked_in").length;
  const customer = Array.isArray(job.customers) ? job.customers[0] : job.customers;
  const foreman = Array.isArray(job.foreman_employee) ? job.foreman_employee[0] : job.foreman_employee;
  const activeAssignments = allAssignments.filter((assignment) => assignment.is_active);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Job Hub"
        title={`${job.job_number} · ${job.name}`}
        description="The premium operations view for this project: crew, field reporting, documents, incidents, and schedule details in one place."
        action={
          <div className="flex flex-wrap gap-3">
            <Link href={`/dashboard/incidents/new?jobId=${job.id}`} className={isForeman ? primaryButtonClassName : secondaryButtonClassName}>
              Report Incident
            </Link>
            {!isForeman ? (
              <Link href={`/dashboard/jobs/${job.id}/edit`} className={primaryButtonClassName}>
                Edit Job
              </Link>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Status" value={job.status} hint="Current phase of the project lifecycle." icon="hammer" tone="warning" />
        <StatCard label="Active Crew" value={activeCrew} hint="Crew currently clocked in on this job." icon="users" tone="success" />
        <StatCard label="Assignments" value={activeAssignments.length} hint="Active foreman and crew assignments." icon="clipboard" tone="info" />
        <StatCard label="Documents" value={documents?.length ?? 0} hint="Shared uploads linked to the job." icon="upload" tone="neutral" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Customer" description="Primary customer and contact details for this job.">
          <p className="text-lg font-semibold text-zinc-950">{customer?.name || "—"}</p>
          <p className="mt-2 text-sm text-zinc-600">
            {[customer?.contact_name, customer?.phone, customer?.email].filter(Boolean).join(" · ") || "No contact details"}
          </p>
        </Section>

        <Section title="Foreman" description="Assigned foreman leading this project in the field.">
          <p className="text-lg font-semibold text-zinc-950">{foreman?.full_name || "—"}</p>
          <p className="mt-2 text-sm text-zinc-600">
            {[foreman?.job_title, foreman?.crew_name].filter(Boolean).join(" · ") || "No foreman assigned"}
          </p>
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <Section title="Job Summary" description="Description, address, and schedule details that should stay easy to reference in the field.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Start Date</p>
              <p className="mt-2 text-sm font-medium text-zinc-900">{formatDate(job.start_date)}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Target Finish</p>
              <p className="mt-2 text-sm font-medium text-zinc-900">{formatDate(job.target_finish_date)}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Address</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{job.address || "—"}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Description</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{job.description || "—"}</p>
            </div>
          </div>
        </Section>

        <Section title="Quick Actions" description="High-frequency actions related to this job.">
          <div className="space-y-3">
            <Link href={`/dashboard/daily-reports/new?jobId=${job.id}`} className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-4 text-sm font-medium text-zinc-800 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700">
              <AppIcon icon="clipboard" className="h-4 w-4" />
              <span>Create Daily Report</span>
            </Link>
            <Link href={`/dashboard/uploads?jobId=${job.id}`} className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-4 text-sm font-medium text-zinc-800 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700">
              <AppIcon icon="upload" className="h-4 w-4" />
              <span>Review Uploads</span>
            </Link>
            <Link href={`/dashboard/change-orders?jobId=${job.id}`} className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-4 text-sm font-medium text-zinc-800 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700">
              <AppIcon icon="document" className="h-4 w-4" />
              <span>Open Change Orders</span>
            </Link>
          </div>
        </Section>
      </div>

      {canViewCosts ? <JobCostSnapshotCard jobId={jobId} snapshot={costSnapshot} /> : null}

      <Section title="Assigned Crew" description="Live assignments and who is currently clocked in on this job.">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <StatusPill tone="success">{activeCrew} clocked in</StatusPill>
          <StatusPill tone="info">{activeAssignments.length} active assignments</StatusPill>
        </div>
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {activeAssignments.map((assignment) => {
            const employee = Array.isArray(assignment.employees) ? assignment.employees[0] : assignment.employees;
            return (
              <li key={assignment.id} className="rounded-[24px] border border-zinc-200 bg-zinc-50/80 p-4">
                <p className="font-medium text-zinc-900">{employee?.full_name || "Employee"}</p>
                <p className="mt-1 text-sm text-zinc-600">
                  {[assignment.assignment_role, employee?.job_title, employee?.crew_name].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  {formatDate(assignment.start_date)} to {formatDate(assignment.end_date)}
                </p>
              </li>
            );
          })}
          {activeAssignments.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-zinc-200 px-4 py-6 text-zinc-600">
              No active crew assignments yet.
            </li>
          ) : null}
        </ul>
      </Section>

      <Section
        title="Documents"
        description="Shared uploads linked to this job."
        action={
          <Link href={`/dashboard/uploads?jobId=${jobId}`} className={secondaryButtonClassName}>
            View All Uploads
          </Link>
        }
      >
        <DocumentList documents={documents ?? []} emptyMessage="No documents linked to this job yet." />
      </Section>

      {!isForeman ? <JobAssignmentsCard jobId={jobId} assignments={allAssignments} employeeOptions={employeeOptions} /> : null}

      <Link href="/dashboard/jobs" className={linkClassName}>
        Back to Jobs
      </Link>
    </div>
  );
}
