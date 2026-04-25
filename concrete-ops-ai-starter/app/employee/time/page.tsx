import { redirect } from "next/navigation";
import { EmployeeSelfClockCard } from "@/components/employee/EmployeeSelfClockCard";
import { EmptyState, ErrorPanel } from "@/components/ui/feedback";
import { KpiTile, PageHeader } from "@/components/ui/page-primitives";
import { createClient } from "@/lib/supabase/server";
import type { Job, JobPhase } from "@/lib/db/schema";

function EmployeeTimeHeader({
  description = "Clock in and out for your shifts once the employee time board is available.",
}: {
  description?: string;
}) {
  return <PageHeader eyebrow="Employee Workflow" title="Employee Time" description={description} />;
}

export default async function EmployeeTimePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/employee/time");
  }

  const { data: appUser, error: appUserError } = await supabase.from("users").select("id, company_id").eq("auth_user_id", user.id).maybeSingle();

  if (appUserError) {
    return (
      <div>
        <EmployeeTimeHeader />

        <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        <ErrorPanel
          title="We couldn’t load your time board right now"
          description="The employee time board is temporarily unavailable. Try refreshing the page or come back in a moment."
          actionHref="/employee/time"
          actionLabel="Try again"
        />
        </div>
      </div>
    );
  }

  if (!appUser) {
    redirect("/login");
  }

  const { data: employee, error: employeeError } = await supabase.from("employees").select("id").eq("user_id", appUser.id).maybeSingle();

  if (employeeError) {
    return (
      <div>
        <EmployeeTimeHeader />

        <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        <ErrorPanel
          title="We couldn’t load your time board right now"
          description="The employee time board is temporarily unavailable. Try refreshing the page or come back in a moment."
          actionHref="/employee/time"
          actionLabel="Try again"
        />
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div>
        <EmployeeTimeHeader description="Clock in and out once your employee profile is connected." />

        <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        <EmptyState
          icon="clock"
          title="Your employee record is still missing"
          description="This time board only works after the office links your login to an employee record. Once that happens, your assigned jobs and shift controls will appear here."
        />
        </div>
      </div>
    );
  }

  const [
    { data: assignments, error: assignmentsError },
    { data: phases, error: phasesError },
  ] = await Promise.all([
    supabase
      .from("job_assignments")
      .select("job_id")
      .eq("company_id", appUser.company_id)
      .eq("employee_id", employee.id)
      .eq("is_active", true),
    supabase
      .from("job_phases")
      .select("id, name")
      .eq("company_id", appUser.company_id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  if (assignmentsError || phasesError) {
    return (
      <div>
        <EmployeeTimeHeader />

        <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        <ErrorPanel
          title="We couldn’t load your time board right now"
          description="The employee time board is temporarily unavailable. Try refreshing the page or come back in a moment."
          actionHref="/employee/time"
          actionLabel="Try again"
        />
        </div>
      </div>
    );
  }

  const assignedJobIds = Array.from(
    new Set((assignments ?? []).map((assignment: { job_id: string }) => assignment.job_id)),
  );
  const { data: jobs, error: jobsError } =
    assignedJobIds.length > 0
      ? await supabase
          .from("jobs")
          .select("id, job_number, name")
          .eq("company_id", appUser.company_id)
          .in("id", assignedJobIds)
          .order("job_number", { ascending: true })
      : { data: [], error: null };

  if (jobsError) {
    return (
      <div>
        <EmployeeTimeHeader />

        <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        <ErrorPanel
          title="We couldn’t load your time board right now"
          description="The employee time board is temporarily unavailable. Try refreshing the page or come back in a moment."
          actionHref="/employee/time"
          actionLabel="Try again"
        />
        </div>
      </div>
    );
  }

  const jobOptions = (jobs ?? []).map((job: Pick<Job, "id" | "job_number" | "name">) => ({
    id: job.id,
    label: `${job.job_number} · ${job.name}`,
  }));

  const phaseOptions = (phases ?? []).map((phase: Pick<JobPhase, "id" | "name">) => ({
    id: phase.id,
    label: phase.name,
  }));

  return (
    <div>
      <EmployeeTimeHeader description="Clock in and out for your shifts, with job options scoped to your active assignments only." />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
      <div className="grid gap-4 md:grid-cols-2">
        <KpiTile label="Assigned jobs" value={String(jobOptions.length)} helper="Active job options scoped to your assignments." />
        <KpiTile label="Phases" value={String(phaseOptions.length)} helper="Optional phase choices available for time entries." />
      </div>
      {jobOptions.length === 0 ? (
        <EmptyState
          icon="briefcase"
          title="No active job assignments yet"
          description="You are ready to use self-service time, but the office still needs to assign you to an active job before you can clock in."
          actionHref="/employee"
          actionLabel="Back to portal home"
        />
      ) : null}

      <EmployeeSelfClockCard employeeId={employee.id} jobOptions={jobOptions} phaseOptions={phaseOptions} />
      </div>
    </div>
  );
}
