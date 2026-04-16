import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentList } from "@/components/documents/DocumentList";
import { JobAssignmentsCard } from "@/components/jobs/JobAssignmentsCard";
import { JobCostSnapshotCard } from "@/components/jobs/JobCostSnapshotCard";
import {
  getDocumentsForEntity,
  getEmployeeOptions,
  getJobAssignments,
  getJobById,
  getJobCostSnapshot,
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

function getStatusTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("complete") || normalized.includes("closed")) {
    return "bg-emerald-100 text-emerald-700";
  }
  if (normalized.includes("hold") || normalized.includes("delay")) {
    return "bg-amber-100 text-amber-700";
  }
  return "bg-orange-100 text-orange-700";
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

  const costSnapshotPromise = canViewCosts ? getJobCostSnapshot(jobId) : Promise.resolve({ data: null });

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
  const allDocuments = documents ?? [];

  const customer = Array.isArray(job.customers) ? job.customers[0] : job.customers;
  const foreman = Array.isArray(job.foreman_employee) ? job.foreman_employee[0] : job.foreman_employee;
  const activeAssignments = allAssignments.filter((assignment) => assignment.is_active);
  const activeCrew = allTimeEntries.filter((entry) => entry.status === "clocked_in").length;
  const recentTimeEntries = allTimeEntries.slice(0, 5);

  const summaryCards = [
    {
      label: "Status",
      value: job.status.replaceAll("_", " "),
      detail: `${activeCrew} crew clocked in right now`,
      tone: getStatusTone(job.status),
    },
    {
      label: "Customer",
      value: customer?.name || "—",
      detail: [customer?.contact_name, customer?.phone].filter(Boolean).join(" · ") || "No customer contact details",
      tone: "bg-zinc-100 text-zinc-700",
    },
    {
      label: "Foreman",
      value: foreman?.full_name || "—",
      detail: [foreman?.job_title, foreman?.crew_name].filter(Boolean).join(" · ") || "No foreman assigned",
      tone: "bg-zinc-100 text-zinc-700",
    },
    {
      label: "Schedule",
      value: `${formatDate(job.start_date)} - ${formatDate(job.target_finish_date)}`,
      detail: job.target_finish_date ? `Target finish ${formatDate(job.target_finish_date)}` : "Schedule not fully set",
      tone: "bg-zinc-100 text-zinc-700",
    },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="rounded-[32px] border border-zinc-900 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 p-6 text-white shadow-[0_30px_90px_rgba(24,24,27,0.28)] sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <Link href="/dashboard/jobs" className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-300 hover:text-orange-200">
              Back to Jobs
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {job.job_number} · {job.name}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
              Keep this project moving with one shared job view for field activity, crew assignments, documents, and office follow-up.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
            <Link
              href={`/dashboard/incidents/new?jobId=${job.id}`}
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-700 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/10"
            >
              Report Incident
            </Link>
            <Link
              href={`/dashboard/uploads?jobId=${job.id}`}
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-700 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/10"
            >
              View Uploads
            </Link>
            {!isForeman ? (
              <Link
                href={`/dashboard/jobs/${job.id}/edit`}
                className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(249,115,22,0.34)] transition hover:bg-orange-400"
              >
                Edit Job
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{card.label}</p>
            <div className="mt-4 flex items-start justify-between gap-3">
              <p className="text-lg font-semibold tracking-tight text-zinc-950">{card.value}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${card.tone}`}>
                {card.label}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-600">{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr,1fr]">
        <article className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Work Overview</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">Project details and jobsite context</h2>
            </div>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-600">
              {activeAssignments.length} active assignments
            </span>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.25fr,0.95fr]">
            <div className="rounded-[24px] border border-zinc-200 bg-zinc-50/70 p-4">
              <h3 className="text-sm font-semibold text-zinc-950">Description</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-600">{job.description || "No description added yet."}</p>
            </div>
            <div className="rounded-[24px] border border-zinc-200 bg-zinc-50/70 p-4">
              <h3 className="text-sm font-semibold text-zinc-950">Address</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-600">{job.address || "No address added yet."}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Time entries</p>
                  <p className="mt-2 text-lg font-semibold text-zinc-950">{allTimeEntries.length}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Documents</p>
                  <p className="mt-2 text-lg font-semibold text-zinc-950">{allDocuments.length}</p>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Field Activity</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">Latest crew movement</h2>
          </div>

          <div className="mt-5 rounded-[24px] border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-950">Live field status</p>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  {activeCrew > 0
                    ? `${activeCrew} crew members are clocked in on this job.`
                    : "No one is currently clocked in on this job."}
                </p>
              </div>
              <Link href="/dashboard/time" className="text-sm font-medium text-orange-600 hover:text-orange-500">
                Open time board
              </Link>
            </div>
          </div>

          <ul className="mt-4 space-y-3 text-sm">
            {recentTimeEntries.map((entry) => {
              const employee = Array.isArray(entry.employees) ? entry.employees[0] : entry.employees;
              const phase = Array.isArray(entry.job_phases) ? entry.job_phases[0] : entry.job_phases;
              return (
                <li key={entry.id} className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-zinc-950">{employee?.full_name || "Employee"}</p>
                      <p className="mt-1 text-zinc-600">{phase?.name || "General labor"}</p>
                    </div>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                      {entry.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-wide text-zinc-500">{formatDateTime(entry.clock_in_at)}</p>
                </li>
              );
            })}
            {recentTimeEntries.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-zinc-600">
                No time activity has been logged for this job yet.
              </li>
            ) : null}
          </ul>
        </article>
      </section>

      <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Crew</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">Assigned crew and schedule coverage</h2>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-600">
            {activeCrew} clocked in now
          </span>
        </div>

        <ul className="mt-5 grid gap-3 lg:grid-cols-2">
          {activeAssignments.map((assignment) => {
            const employee = Array.isArray(assignment.employees) ? assignment.employees[0] : assignment.employees;
            return (
              <li key={assignment.id} className="rounded-[24px] border border-zinc-200 bg-zinc-50/70 p-4">
                <p className="text-base font-semibold text-zinc-950">{employee?.full_name || "Employee"}</p>
                <p className="mt-2 text-sm text-zinc-600">
                  {[assignment.assignment_role, employee?.job_title, employee?.crew_name].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-2 text-xs uppercase tracking-wide text-zinc-500">
                  {formatDate(assignment.start_date)} to {formatDate(assignment.end_date)}
                </p>
              </li>
            );
          })}
          {activeAssignments.length === 0 ? (
            <li className="rounded-[24px] border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-600">
              No active crew assignments yet.
            </li>
          ) : null}
        </ul>
      </section>

      <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Documents</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">Shared files for this job</h2>
          </div>
          <Link href={`/dashboard/uploads?jobId=${jobId}`} className="text-sm font-medium text-orange-600 hover:text-orange-500">
            View all uploads
          </Link>
        </div>
        <div className="mt-5">
          <DocumentList documents={allDocuments} emptyMessage="No documents linked to this job yet." />
        </div>
      </section>

      {!isForeman ? <JobAssignmentsCard jobId={jobId} assignments={allAssignments} employeeOptions={employeeOptions} /> : null}

      {canViewCosts ? <JobCostSnapshotCard jobId={jobId} snapshot={costSnapshot} /> : null}
    </div>
  );
}
