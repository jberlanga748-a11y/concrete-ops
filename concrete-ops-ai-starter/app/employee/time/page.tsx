import { EmployeeSelfClockCard } from "@/components/employee/EmployeeSelfClockCard";
import { EmployeeAssignmentsState, EmployeeSetupState } from "@/components/employee/EmployeePortalStates";
import { ErrorPanel } from "@/components/ui/feedback";
import { getEmployeePortalContext } from "@/lib/employee/portal";
import type { Job, JobPhase } from "@/lib/db/schema";

function getJobLabel(job: Pick<Job, "job_number" | "name">[] | Pick<Job, "job_number" | "name"> | null) {
  if (!job) return null;
  if (Array.isArray(job)) return job[0] ? `${job[0].job_number} · ${job[0].name}` : null;
  return `${job.job_number} · ${job.name}`;
}

export default async function EmployeeTimePage() {
  const { supabase, appUser, employee, assignedJobIds, contextError } = await getEmployeePortalContext("/employee/time");

  if (!employee) {
    return (
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Employee Time</h1>
        <p className="mt-3 text-zinc-600">Clock in, clock out, and keep your shift status current.</p>
        <div className="mt-6">
          {contextError ? (
            <ErrorPanel
              title="We couldn’t load your employee setup"
              description="Your employee time workspace could not confirm your linked employee record right now. Try again, and if the issue keeps showing up, let the office know."
              actionHref="/employee/time"
              actionLabel="Try again"
            />
          ) : (
            <EmployeeSetupState actionHref="/employee" actionLabel="Back to portal home" />
          )}
        </div>
      </div>
    );
  }

  const [{ data: openEntry, error: openEntryError }, { data: phases, error: phasesError }] = await Promise.all([
    supabase
      .from("time_entries")
      .select("id, clock_in_at, status, jobs(job_number, name)")
      .eq("company_id", appUser.companyId)
      .eq("employee_id", employee.id)
      .is("clock_out_at", null)
      .in("status", ["clocked_in", "on_break"])
      .order("clock_in_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("job_phases")
      .select("id, name")
      .eq("company_id", appUser.companyId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  const { data: jobs, error: jobsError } =
    assignedJobIds.length > 0
      ? await supabase
          .from("jobs")
          .select("id, job_number, name")
          .eq("company_id", appUser.companyId)
          .in("id", assignedJobIds)
          .order("job_number", { ascending: true })
      : { data: [], error: null };

  const jobOptions = (jobs ?? []).map((job: Pick<Job, "id" | "job_number" | "name">) => ({
    id: job.id,
    label: `${job.job_number} · ${job.name}`,
  }));

  const phaseOptions = (phases ?? []).map((phase: Pick<JobPhase, "id" | "name">) => ({
    id: phase.id,
    label: phase.name,
  }));

  const pageError = contextError || openEntryError?.message || phasesError?.message || jobsError?.message || null;
  const activeShift = openEntry
    ? {
        clockInAt: openEntry.clock_in_at,
        status: openEntry.status,
        jobLabel: getJobLabel(openEntry.jobs as Pick<Job, "job_number" | "name">[] | Pick<Job, "job_number" | "name"> | null),
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">Employee Time</h1>
        <p className="mt-3 text-zinc-600">
          Clock in, clock out, and keep your shift status current.
          {assignedJobIds.length > 0 ? ` You currently have ${assignedJobIds.length} active job assignment${assignedJobIds.length === 1 ? "" : "s"} available here.` : ""}
        </p>
      </div>

      {pageError ? (
        <ErrorPanel
          title="We couldn’t fully load your time workspace"
          description="Some employee time details are unavailable right now. Try refreshing the page, and if this keeps happening, let the office know."
          actionHref="/employee/time"
          actionLabel="Try again"
        />
      ) : null}

      {assignedJobIds.length === 0 && !activeShift ? (
        <EmployeeAssignmentsState
          title="No active job assignments are ready for time entry"
          description="You do not have an active assignment on file yet, so new clock-ins are still locked. Once the office or foreman assigns you to a live job, time entry will open automatically."
          actionHref="/employee"
          actionLabel="Back to portal home"
        />
      ) : null}

      {assignedJobIds.length > 0 || activeShift ? (
        <EmployeeSelfClockCard
          employeeId={employee.id}
          jobOptions={jobOptions}
          phaseOptions={phaseOptions}
          activeShift={activeShift}
        />
      ) : null}
    </div>
  );
}
