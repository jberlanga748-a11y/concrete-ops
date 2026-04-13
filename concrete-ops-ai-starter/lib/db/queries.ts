import type { Customer, DailyReport, Employee, Job, JobPhase, TimeEntry, User } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

export type JobListRow = Pick<Job, "id" | "job_number" | "name" | "status"> & {
  customers: Pick<Customer, "name">[] | Pick<Customer, "name"> | null;
};

export type JobTimeEntryRow = Pick<
  TimeEntry,
  "id" | "employee_id" | "job_id" | "job_phase_id" | "clock_in_at" | "clock_out_at" | "total_hours" | "status"
> & {
  employees: Pick<Employee, "full_name">[] | Pick<Employee, "full_name"> | null;
  job_phases: Pick<JobPhase, "name">[] | Pick<JobPhase, "name"> | null;
  jobs: Pick<Job, "job_number" | "name">[] | Pick<Job, "job_number" | "name"> | null;
};

export type DailyReportListRow = Pick<
  DailyReport,
  "id" | "job_id" | "report_date" | "submitted_by_user_id" | "work_completed" | "created_at"
> & {
  jobs: Pick<Job, "job_number" | "name">[] | Pick<Job, "job_number" | "name"> | null;
  users: Pick<User, "full_name">[] | Pick<User, "full_name"> | null;
};

export type DailyReportDetailRow = DailyReport & {
  jobs: Pick<Job, "job_number" | "name">[] | Pick<Job, "job_number" | "name"> | null;
  users: Pick<User, "full_name">[] | Pick<User, "full_name"> | null;
};

export type TimeOption = { id: string; label: string };

export async function getJobs() {
  const supabase = await createClient();
  const result = await supabase.from("jobs").select("id, job_number, name, status, customers(name)").order("created_at", { ascending: false });

  return {
    ...result,
    data: (result.data ?? []) as JobListRow[],
  };
}

export async function getTimeEntries(filters?: { jobId?: string; employeeId?: string }) {
  const supabase = await createClient();

  let query = supabase
    .from("time_entries")
    .select("id, employee_id, job_id, job_phase_id, clock_in_at, clock_out_at, total_hours, status, employees(full_name), job_phases(name), jobs(job_number, name)")
    .order("clock_in_at", { ascending: false });

  if (filters?.jobId) {
    query = query.eq("job_id", filters.jobId);
  }

  if (filters?.employeeId) {
    query = query.eq("employee_id", filters.employeeId);
  }

  const result = await query;

  return {
    ...result,
    data: (result.data ?? []) as JobTimeEntryRow[],
  };
}

export async function getTimeFilterOptions() {
  const supabase = await createClient();

  const [{ data: jobs }, { data: employees }, { data: phases }] = await Promise.all([
    supabase.from("jobs").select("id, job_number, name").order("job_number", { ascending: true }),
    supabase.from("employees").select("id, full_name").eq("is_active", true).order("full_name", { ascending: true }),
    supabase.from("job_phases").select("id, name").eq("is_active", true).order("sort_order", { ascending: true }),
  ]);

  const jobOptions: TimeOption[] = (jobs ?? []).map((job: Pick<Job, "id" | "job_number" | "name">) => ({
    id: job.id,
    label: `${job.job_number} · ${job.name}`,
  }));

  const employeeOptions: TimeOption[] = (employees ?? []).map((employee: Pick<Employee, "id" | "full_name">) => ({
    id: employee.id,
    label: employee.full_name,
  }));

  const phaseOptions: TimeOption[] = (phases ?? []).map((phase: Pick<JobPhase, "id" | "name">) => ({
    id: phase.id,
    label: phase.name,
  }));

  return { jobOptions, employeeOptions, phaseOptions };
}

export async function getDailyReportJobOptions() {
  const supabase = await createClient();
  const { data } = await supabase.from("jobs").select("id, job_number, name").order("job_number", { ascending: true });

  const jobOptions: TimeOption[] = (data ?? []).map((job: Pick<Job, "id" | "job_number" | "name">) => ({
    id: job.id,
    label: `${job.job_number} · ${job.name}`,
  }));

  return jobOptions;
}

export async function getDailyReports(filters?: { jobId?: string; date?: string }) {
  const supabase = await createClient();

  let query = supabase
    .from("daily_reports")
    .select("id, job_id, report_date, submitted_by_user_id, work_completed, created_at, jobs(job_number, name), users(full_name)")
    .order("report_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.jobId) {
    query = query.eq("job_id", filters.jobId);
  }

  if (filters?.date) {
    query = query.eq("report_date", filters.date);
  }

  const result = await query;

  return {
    ...result,
    data: (result.data ?? []) as DailyReportListRow[],
  };
}

export async function getDailyReportById(id: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("daily_reports")
    .select(
      "id, company_id, job_id, report_date, submitted_by_user_id, work_completed, delays_issues, materials_deliveries, safety_notes, created_at, updated_at, jobs(job_number, name), users(full_name)",
    )
    .eq("id", id)
    .maybeSingle();

  return {
    ...result,
    data: (result.data ?? null) as DailyReportDetailRow | null,
  };
}

export async function getJobTimeEntries(jobId: string) {
  return getTimeEntries({ jobId });
}
