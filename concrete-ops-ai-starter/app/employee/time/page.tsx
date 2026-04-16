import { redirect } from "next/navigation";
import { EmployeeSelfClockCard } from "@/components/employee/EmployeeSelfClockCard";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
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
      <EmptyState title="Employee Time" description="No employee record is linked to your user yet. Ask an owner or office admin to connect your user to an employee profile." />
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
      <PageHeader title="Employee Time" description="Clock in and out for your shifts with a cleaner, field-friendly time card." />

      <EmployeeSelfClockCard employeeId={employee.id} jobOptions={jobOptions} phaseOptions={phaseOptions} />
    </div>
  );
}
