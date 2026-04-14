import { redirect } from "next/navigation";
import { EmployeeSelfClockCard } from "@/components/employee/EmployeeSelfClockCard";
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
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Employee Time</h1>
        <p className="mt-3 text-zinc-600">No employee record is linked to your user yet.</p>
      </div>
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
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">Employee Time</h1>
        <p className="mt-3 text-zinc-600">Clock in/out for your shifts.</p>
      </div>

      <EmployeeSelfClockCard employeeId={employee.id} jobOptions={jobOptions} phaseOptions={phaseOptions} />
    </div>
  );
}
