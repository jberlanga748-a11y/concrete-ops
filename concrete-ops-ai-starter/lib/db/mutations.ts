import { createClient } from "@/lib/supabase/server";

export async function createClockInEntry(input: {
  employeeId: string;
  jobId: string;
  jobPhaseId: string;
}) {
  const supabase = await createClient();

  return supabase.from("time_entries").insert({
    employee_id: input.employeeId,
    job_id: input.jobId,
    job_phase_id: input.jobPhaseId,
    clock_in_at: new Date().toISOString(),
    status: "clocked_in",
    source: "employee_app",
  });
}
