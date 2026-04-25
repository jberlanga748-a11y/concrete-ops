import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentList } from "@/components/documents/DocumentList";
import { JobAssignmentsCard } from "@/components/jobs/JobAssignmentsCard";
import { JobCostSnapshotCard } from "@/components/jobs/JobCostSnapshotCard";
import { ViewerDateTime } from "@/components/time/ViewerDateTime";
import { EmptyState, StatusChip } from "@/components/ui/feedback";
import { KpiTile, OperationalCard, PageHeader, RecordPreview, SectionHeader } from "@/components/ui/page-primitives";
import {
  getDocumentsForEntity,
  getEmployeeOptions,
  getJobAssignments,
  getJobById,
  getJobCostSnapshot,
  getTimeEntries,
} from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import { formatDateOnly } from "@/lib/time/formatting";

function formatSchedule(startDate: string | null | undefined, targetFinishDate: string | null | undefined) {
  if (startDate && targetFinishDate) return `${formatDateOnly(startDate)} to ${formatDateOnly(targetFinishDate)}`;
  if (startDate) return `Starts ${formatDateOnly(startDate)}`;
  if (targetFinishDate) return `Target ${formatDateOnly(targetFinishDate)}`;
  return "Schedule not set";
}

function getStatusTone(status: string): "neutral" | "success" | "warning" | "info" {
  const normalized = status.toLowerCase();
  if (normalized.includes("complete") || normalized.includes("closed")) return "success";
  if (normalized.includes("hold") || normalized.includes("delay")) return "warning";
  return "info";
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

  return (
    <div>
      <PageHeader
        eyebrow="Job Hub"
        title={`${job.job_number} - ${job.name}`}
        description="Keep this project moving with one shared job view for field activity, crew assignments, documents, and next-step follow-up."
        actions={
          <>
            <Link href="/dashboard/jobs" className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-blue-50">
              Back to Jobs
            </Link>
            <Link href={`/dashboard/uploads?jobId=${job.id}`} className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-blue-50">
              View Uploads
            </Link>
            {!isForeman ? (
              <Link href={`/dashboard/jobs/${job.id}/edit`} className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800">
                Edit Job
              </Link>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiTile label="Status" value={job.status.replaceAll("_", " ")} helper={`${activeCrew} crew clocked in`} />
          <KpiTile label="Customer" value={customer?.name || "—"} helper={[customer?.contact_name, customer?.phone].filter(Boolean).join(" · ") || "No contact details"} />
          <KpiTile label="Foreman" value={foreman?.full_name || "—"} helper={[foreman?.job_title, foreman?.crew_name].filter(Boolean).join(" · ") || "Unassigned"} />
          <KpiTile label="Schedule" value={formatSchedule(job.start_date, job.target_finish_date)} helper={job.target_finish_date ? `Target ${formatDateOnly(job.target_finish_date)}` : "Schedule not fully set"} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <OperationalCard className="p-4">
              <SectionHeader
                title="Project Details"
                description="Jobsite scope, address, and record counts stay readable without leaving the hub."
                action={<StatusChip tone={getStatusTone(job.status)}>{job.status.replaceAll("_", " ")}</StatusChip>}
              />
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">Description</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">{job.description || "No description added yet."}</p>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">Address</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">{job.address || "No address added yet."}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-white p-3">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500">Time entries</p>
                      <p className="mt-2 text-2xl font-black text-slate-950">{allTimeEntries.length}</p>
                    </div>
                    <div className="rounded-xl bg-white p-3">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500">Documents</p>
                      <p className="mt-2 text-2xl font-black text-slate-950">{allDocuments.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </OperationalCard>

            <OperationalCard className="p-4">
              <SectionHeader
                title="Latest Crew Movement"
                description={activeCrew > 0 ? `${activeCrew} crew members are clocked in on this job.` : "No one is currently clocked in on this job."}
                action={
                  <Link href="/dashboard/time" className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-blue-50">
                    Open Time
                  </Link>
                }
              />
              <div className="space-y-2">
                {recentTimeEntries.map((entry) => {
                  const employee = Array.isArray(entry.employees) ? entry.employees[0] : entry.employees;
                  const phase = Array.isArray(entry.job_phases) ? entry.job_phases[0] : entry.job_phases;
                  return (
                    <div key={entry.id} className="rounded-xl border border-blue-100 bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-950">{employee?.full_name || "Employee"}</p>
                          <p className="mt-1 text-sm font-bold text-slate-500">{phase?.name || "General labor"}</p>
                        </div>
                        <StatusChip tone={getStatusTone(entry.status)}>{entry.status.replaceAll("_", " ")}</StatusChip>
                      </div>
                      <ViewerDateTime value={entry.clock_in_at} className="mt-2 block text-xs font-bold uppercase tracking-widest text-blue-700" />
                    </div>
                  );
                })}
                {recentTimeEntries.length === 0 ? (
                  <EmptyState
                    icon="clock"
                    title="No time activity yet"
                    description="Once the crew starts clocking time on this job, the latest movement will show up here for quick review."
                    actionHref="/dashboard/time"
                    actionLabel="Open time board"
                  />
                ) : null}
              </div>
            </OperationalCard>

            <OperationalCard className="p-4">
              <SectionHeader
                title="Documents"
                description="Shared files linked to this job."
                action={
                  <Link href={`/dashboard/uploads?jobId=${jobId}`} className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-blue-50">
                    View all
                  </Link>
                }
              />
              <DocumentList documents={allDocuments} emptyMessage="No documents linked to this job yet." />
            </OperationalCard>
          </div>

          <RecordPreview
            title="Job Snapshot"
            rows={[
              ["Customer", customer?.name || "—"],
              ["Foreman", foreman?.full_name || "—"],
              ["Schedule", formatSchedule(job.start_date, job.target_finish_date)],
              ["Crew", `${activeAssignments.length} active assignments`],
              ["Uploads", allDocuments.length.toString()],
            ]}
            actions={
              <Link href={`/dashboard/incidents/new?jobId=${job.id}`} className="inline-flex rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">
                Report Incident
              </Link>
            }
          />
        </div>

        <OperationalCard className="p-4">
          <SectionHeader title="Assigned Crew" description="Active assignments and schedule coverage for this job." />
          <div className="grid gap-3 lg:grid-cols-2">
            {activeAssignments.map((assignment) => {
              const employee = Array.isArray(assignment.employees) ? assignment.employees[0] : assignment.employees;
              return (
                <div key={assignment.id} className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                  <p className="font-black text-slate-950">{employee?.full_name || "Employee"}</p>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    {[assignment.assignment_role, employee?.job_title, employee?.crew_name].filter(Boolean).join(" · ")}
                  </p>
                  <p className="mt-2 text-xs font-black uppercase tracking-widest text-blue-700">
                    {formatDateOnly(assignment.start_date)} to {formatDateOnly(assignment.end_date)}
                  </p>
                </div>
              );
            })}
            {activeAssignments.length === 0 ? (
              <div className="lg:col-span-2">
                <EmptyState
                  icon="users"
                  title="No active crew assignments"
                  description="Add assignments below so the Job Hub, time board, and daily report crew rows all line up around the same team."
                />
              </div>
            ) : null}
          </div>
        </OperationalCard>

        {!isForeman ? <JobAssignmentsCard jobId={jobId} assignments={allAssignments} employeeOptions={employeeOptions} /> : null}

        {canViewCosts ? <JobCostSnapshotCard jobId={jobId} snapshot={costSnapshot} /> : null}
      </div>
    </div>
  );
}
