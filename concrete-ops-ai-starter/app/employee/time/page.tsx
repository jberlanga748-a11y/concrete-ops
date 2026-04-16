import { redirect } from "next/navigation";
import { EmployeeSelfClockCard } from "@/components/employee/EmployeeSelfClockCard";
import { AppIcon } from "@/components/ui/icons";
import { EmptyState, PageHeader, Section, StatCard } from "@/components/ui/primitives";
import { createClient } from "@/lib/supabase/server";
import type { Job, JobPhase } from "@/lib/db/schema";

export default async function EmployeeTimePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/employee/time");
  }

  const { data: appUser } = await supabase.from("users").select("id").eq("auth_user_id", user.id).maybeSingle();

  if (!appUser) {
    redirect("/login");
  }

  const { data: employee } = await supabase.from("employees").select("id").eq("user_id", appUser.id).maybeSingle();

  if (!employee) {
    return (
      <EmptyState
        title="Employee Time"
        description="No employee record is linked to your user yet. Ask an owner or office admin to connect your user to an employee profile."
      />
    );
  }

  const [{ data: jobs }, { data: phases }] = await Promise.all([
    supabase.from("jobs").select("id, job_number, name").order("job_number", { ascending: true }),
    supabase.from("job_phases").select("id, name").eq("is_active", true).order("sort_order", { ascending: true }),
  ]);

  const jobOptions = (jobs ?? []).map((job: Pick<Job, "id" | "job_number" | "name">) => ({
    id: job.id,
    label: `${job.job_number} · ${job.name}`,
  }));

  const phaseOptions = (phases ?? []).map((phase: Pick<JobPhase, "id" | "name">) => ({
    id: phase.id,
    label: phase.name,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="My Work"
        title="Employee Time"
        description="Clock in, pick the right job and phase, and keep your shift updates easy to manage from the field."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Available Jobs" value={jobOptions.length} hint="Projects you can clock time against today." icon="hammer" tone="warning" />
        <StatCard label="Active Phases" value={phaseOptions.length} hint="Optional phase tagging for cleaner labor records." icon="clipboard" tone="info" />
        <StatCard label="Primary Action" value="Clock In" hint="Use the time card below to start or end your shift." icon="clock" tone="success" />
        <StatCard label="Field Tip" value="Stay accurate" hint="Pick the right job before you start work so hours land in the right place." icon="truck" tone="neutral" />
      </div>

      <Section title="Today’s workflow" description="Pick the job, add a phase if needed, and use the card below to clock in or out quickly on mobile.">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-orange-100 p-3 text-orange-600">
                <AppIcon icon="clock" className="h-5 w-5" />
              </div>
              <p className="text-sm text-zinc-700">Start your shift with the correct job selected.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
                <AppIcon icon="clipboard" className="h-5 w-5" />
              </div>
              <p className="text-sm text-zinc-700">Add a phase when the crew is tracking a specific part of the work.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600">
                <AppIcon icon="check" className="h-5 w-5" />
              </div>
              <p className="text-sm text-zinc-700">Clock out before leaving so payroll and job costing stay accurate.</p>
            </div>
          </div>
        </div>
      </Section>

      <EmployeeSelfClockCard employeeId={employee.id} jobOptions={jobOptions} phaseOptions={phaseOptions} />
    </div>
  );
}
