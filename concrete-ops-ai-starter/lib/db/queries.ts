import { createClient } from "@/lib/supabase/server";

export async function getJobs() {
  const supabase = await createClient();
  return supabase
    .from("jobs")
    .select("id, job_number, name, status, customers(name)")
    .order("created_at", { ascending: false });
}

export async function getJobTimeEntries(jobId: string) {
  const supabase = await createClient();
  return supabase
    .from("time_entries")
    .select("id, clock_in_at, clock_out_at, total_hours, status, employees(full_name), job_phases(name)")
    .eq("job_id", jobId)
    .order("clock_in_at", { ascending: false });
}
