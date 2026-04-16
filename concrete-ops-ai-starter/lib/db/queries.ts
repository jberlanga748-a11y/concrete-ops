import type {
  AssignmentRole,
  ChangeOrder,
  ChangeOrderFile,
  ChangeOrderLineItem,
  Customer,
  DailyReport,
  DailyReportCrewEntry,
  Employee,
  JobAssignment,
  Job,
  JobFile,
  JobPhase,
  TimeEntry,
  User,
} from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

export type JobListRow = Pick<Job, "id" | "job_number" | "name" | "status"> & {
  customers: Pick<Customer, "name">[] | Pick<Customer, "name"> | null;
};

export type JobDetailRow = Pick<
  Job,
  "id" | "customer_id" | "job_number" | "name" | "address" | "status" | "foreman_employee_id" | "start_date" | "target_finish_date" | "description"
> & {
  customers:
    | Pick<Customer, "id" | "name" | "contact_name" | "phone" | "email">[]
    | Pick<Customer, "id" | "name" | "contact_name" | "phone" | "email">
    | null;
  foreman_employee:
    | Pick<Employee, "id" | "full_name" | "job_title" | "crew_name">[]
    | Pick<Employee, "id" | "full_name" | "job_title" | "crew_name">
    | null;
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

export type DailyReportCrewEntryRow = Pick<
  DailyReportCrewEntry,
  "id" | "daily_report_id" | "employee_id" | "hours" | "notes" | "created_at"
> & {
  employees: Pick<Employee, "full_name" | "job_title" | "crew_name">[] | Pick<Employee, "full_name" | "job_title" | "crew_name"> | null;
};

export type JobAssignmentOptionRow = {
  jobId: string;
  employeeId: string;
  employeeLabel: string;
};

export type JobFileRow = Pick<
  JobFile,
  "id" | "job_id" | "daily_report_id" | "file_name" | "file_type" | "storage_path" | "tag" | "note" | "created_at"
> & {
  jobs: Pick<Job, "job_number" | "name">[] | Pick<Job, "job_number" | "name"> | null;
  daily_reports: Pick<DailyReport, "report_date">[] | Pick<DailyReport, "report_date"> | null;
  users: Pick<User, "full_name">[] | Pick<User, "full_name"> | null;
  employees: Pick<Employee, "full_name">[] | Pick<Employee, "full_name"> | null;
};

export type ChangeOrderListRow = Pick<
  ChangeOrder,
  "id" | "job_id" | "daily_report_id" | "title" | "status" | "direct_cost_total" | "markup_percent" | "total_amount" | "created_at"
> & {
  jobs: Pick<Job, "job_number" | "name">[] | Pick<Job, "job_number" | "name"> | null;
  daily_reports: Pick<DailyReport, "report_date">[] | Pick<DailyReport, "report_date"> | null;
};

export type ChangeOrderDetailRow = ChangeOrder & {
  jobs: Pick<Job, "job_number" | "name">[] | Pick<Job, "job_number" | "name"> | null;
  daily_reports: Pick<DailyReport, "id" | "report_date">[] | Pick<DailyReport, "id" | "report_date"> | null;
  users: Pick<User, "full_name">[] | Pick<User, "full_name"> | null;
};

export type ChangeOrderLineItemRow = ChangeOrderLineItem;

export type ChangeOrderFileRow = ChangeOrderFile & {
  job_files: Pick<JobFile, "id" | "file_name" | "tag" | "note" | "storage_path" | "created_at">[] | Pick<JobFile, "id" | "file_name" | "tag" | "note" | "storage_path" | "created_at"> | null;
};

export type EmployeeListRow = Pick<
  Employee,
  "id" | "full_name" | "phone" | "email" | "crew_name" | "job_title" | "is_active" | "hire_date" | "created_at"
>;

export type CustomerListRow = Pick<
  Customer,
  "id" | "name" | "contact_name" | "email" | "phone" | "status" | "created_at"
>;

export type JobAssignmentRow = Pick<
  JobAssignment,
  "id" | "job_id" | "employee_id" | "assignment_role" | "start_date" | "end_date" | "is_active" | "created_at"
> & {
  employees: Pick<Employee, "full_name" | "job_title" | "crew_name">[] | Pick<Employee, "full_name" | "job_title" | "crew_name"> | null;
};

export type TimeOption = { id: string; label: string };
export type DailyReportOption = TimeOption & { jobId: string };
export type EmployeeOption = TimeOption & { isActive: boolean };
export type CustomerOption = TimeOption & { status: Customer["status"] };

export async function getJobs() {
  const supabase = await createClient();
  const result = await supabase.from("jobs").select("id, job_number, name, status, customers(name)").order("created_at", { ascending: false });

  return {
    ...result,
    data: (result.data ?? []) as JobListRow[],
  };
}

export async function getJobById(id: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("jobs")
    .select(
      "id, customer_id, job_number, name, address, status, foreman_employee_id, start_date, target_finish_date, description, customers(id, name, contact_name, phone, email), foreman_employee:employees!jobs_foreman_fk(id, full_name, job_title, crew_name)",
    )
    .eq("id", id)
    .maybeSingle();

  return { ...result, data: (result.data ?? null) as JobDetailRow | null };
}

export async function getEmployees(filters?: { isActive?: boolean }) {
  const supabase = await createClient();

  let query = supabase
    .from("employees")
    .select("id, full_name, phone, email, crew_name, job_title, is_active, hire_date, created_at")
    .order("full_name", { ascending: true });

  if (typeof filters?.isActive === "boolean") {
    query = query.eq("is_active", filters.isActive);
  }

  const result = await query;
  return { ...result, data: (result.data ?? []) as EmployeeListRow[] };
}

export async function getEmployeeById(id: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("employees")
    .select("id, full_name, phone, email, crew_name, job_title, is_active, hire_date, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  return { ...result, data: (result.data ?? null) as Employee | null };
}

export async function getEmployeeOptions(includeInactive = false) {
  const supabase = await createClient();

  let query = supabase.from("employees").select("id, full_name, is_active").order("full_name", { ascending: true });
  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data } = await query;
  return (data ?? []).map((employee: Pick<Employee, "id" | "full_name" | "is_active">) => ({
    id: employee.id,
    label: employee.full_name,
    isActive: employee.is_active,
  })) as EmployeeOption[];
}

export async function getCustomerOptions(includeInactive = false) {
  const supabase = await createClient();

  let query = supabase.from("customers").select("id, name, status").order("name", { ascending: true });
  if (!includeInactive) {
    query = query.eq("status", "active");
  }

  const { data } = await query;
  return (data ?? []).map((customer: Pick<Customer, "id" | "name" | "status">) => ({
    id: customer.id,
    label: customer.name,
    status: customer.status,
  })) as CustomerOption[];
}

export async function getCustomers(filters?: { status?: Customer["status"] }) {
  const supabase = await createClient();

  let query = supabase
    .from("customers")
    .select("id, name, contact_name, email, phone, status, created_at")
    .order("name", { ascending: true });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const result = await query;
  return { ...result, data: (result.data ?? []) as CustomerListRow[] };
}

export async function getCustomerById(id: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("customers")
    .select("id, name, contact_name, email, phone, billing_address, notes, status, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  return { ...result, data: (result.data ?? null) as Customer | null };
}

export async function getJobAssignments(jobId: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("job_assignments")
    .select("id, job_id, employee_id, assignment_role, start_date, end_date, is_active, created_at, employees(full_name, job_title, crew_name)")
    .eq("job_id", jobId)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: true });

  return { ...result, data: (result.data ?? []) as JobAssignmentRow[] };
}

export async function getAssignmentRoleOptions(): Promise<{ value: AssignmentRole; label: string }[]> {
  return [
    { value: "foreman", label: "Foreman" },
    { value: "lead", label: "Lead" },
    { value: "crew", label: "Crew" },
  ];
}

export async function getTimeEntries(filters?: { jobId?: string; employeeId?: string }) {
  const supabase = await createClient();

  let query = supabase
    .from("time_entries")
    .select("id, employee_id, job_id, job_phase_id, clock_in_at, clock_out_at, total_hours, status, employees(full_name), job_phases(name), jobs(job_number, name)")
    .order("clock_in_at", { ascending: false });

  if (filters?.jobId) query = query.eq("job_id", filters.jobId);
  if (filters?.employeeId) query = query.eq("employee_id", filters.employeeId);

  const result = await query;
  return { ...result, data: (result.data ?? []) as JobTimeEntryRow[] };
}

export async function getTimeFilterOptions() {
  const supabase = await createClient();

  const [{ data: jobs }, { data: employees }, { data: phases }] = await Promise.all([
    supabase.from("jobs").select("id, job_number, name").order("job_number", { ascending: true }),
    supabase.from("employees").select("id, full_name").eq("is_active", true).order("full_name", { ascending: true }),
    supabase.from("job_phases").select("id, name").eq("is_active", true).order("sort_order", { ascending: true }),
  ]);

  const jobOptions: TimeOption[] = (jobs ?? []).map((job: Pick<Job, "id" | "job_number" | "name">) => ({ id: job.id, label: `${job.job_number} · ${job.name}` }));
  const employeeOptions: TimeOption[] = (employees ?? []).map((employee: Pick<Employee, "id" | "full_name">) => ({ id: employee.id, label: employee.full_name }));
  const phaseOptions: TimeOption[] = (phases ?? []).map((phase: Pick<JobPhase, "id" | "name">) => ({ id: phase.id, label: phase.name }));

  return { jobOptions, employeeOptions, phaseOptions };
}

export async function getDailyReportJobOptions() {
  const supabase = await createClient();
  const { data } = await supabase.from("jobs").select("id, job_number, name").order("job_number", { ascending: true });
  return (data ?? []).map((job: Pick<Job, "id" | "job_number" | "name">) => ({ id: job.id, label: `${job.job_number} · ${job.name}` }));
}

export async function getDailyReportOptions(jobId?: string) {
  const supabase = await createClient();

  let query = supabase.from("daily_reports").select("id, job_id, report_date, jobs(job_number, name)").order("report_date", { ascending: false }).limit(100);
  if (jobId) query = query.eq("job_id", jobId);

  const { data } = await query;

  return (data ?? []).map((report: { id: string; job_id?: string; report_date: string; jobs: Pick<Job, "job_number" | "name">[] | Pick<Job, "job_number" | "name"> | null }) => {
    const job = Array.isArray(report.jobs) ? report.jobs[0] : report.jobs;
    const jobLabel = job ? `${job.job_number} · ${job.name}` : "Job";
    return { id: report.id, label: `${report.report_date} · ${jobLabel}`, jobId: report.job_id || "" };
  }) as DailyReportOption[];
}

export async function getDailyReports(filters?: { jobId?: string; date?: string }) {
  const supabase = await createClient();

  let query = supabase
    .from("daily_reports")
    .select("id, job_id, report_date, submitted_by_user_id, work_completed, created_at, jobs(job_number, name), users(full_name)")
    .order("report_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.jobId) query = query.eq("job_id", filters.jobId);
  if (filters?.date) query = query.eq("report_date", filters.date);

  const result = await query;
  return { ...result, data: (result.data ?? []) as DailyReportListRow[] };
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

  return { ...result, data: (result.data ?? null) as DailyReportDetailRow | null };
}

export async function getDailyReportCrewEntries(dailyReportId: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("daily_report_crew_entries")
    .select("id, daily_report_id, employee_id, hours, notes, created_at, employees(full_name, job_title, crew_name)")
    .eq("daily_report_id", dailyReportId)
    .order("created_at", { ascending: true });

  return { ...result, data: (result.data ?? []) as DailyReportCrewEntryRow[] };
}

export async function getActiveJobAssignmentOptions() {
  const supabase = await createClient();
  const result = await supabase
    .from("job_assignments")
    .select("job_id, employee_id, employees(full_name)")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  const seen = new Set<string>();

  return (result.data ?? []).flatMap((assignment: {
    job_id: string;
    employee_id: string;
    employees: Pick<Employee, "full_name">[] | Pick<Employee, "full_name"> | null;
  }) => {
    const dedupeKey = `${assignment.job_id}:${assignment.employee_id}`;
    if (seen.has(dedupeKey)) return [];
    seen.add(dedupeKey);

    const employee = Array.isArray(assignment.employees) ? assignment.employees[0] : assignment.employees;
    return [{
      jobId: assignment.job_id,
      employeeId: assignment.employee_id,
      employeeLabel: employee?.full_name ?? "Employee",
    }];
  }) as JobAssignmentOptionRow[];
}

export async function getJobFiles(filters?: { jobId?: string; dailyReportId?: string; tag?: string }) {
  const supabase = await createClient();

  let query = supabase
    .from("job_files")
    .select("id, job_id, daily_report_id, file_name, file_type, storage_path, tag, note, created_at, jobs(job_number, name), daily_reports(report_date), users(full_name), employees(full_name)")
    .order("created_at", { ascending: false });

  if (filters?.jobId) query = query.eq("job_id", filters.jobId);
  if (filters?.dailyReportId) query = query.eq("daily_report_id", filters.dailyReportId);
  if (filters?.tag) query = query.eq("tag", filters.tag);

  const result = await query;
  return { ...result, data: (result.data ?? []) as JobFileRow[] };
}

export async function getChangeOrders(filters?: { jobId?: string; status?: string }) {
  const supabase = await createClient();

  let query = supabase
    .from("change_orders")
    .select("id, job_id, daily_report_id, title, status, direct_cost_total, markup_percent, total_amount, created_at, jobs(job_number, name), daily_reports(report_date)")
    .order("created_at", { ascending: false });

  if (filters?.jobId) query = query.eq("job_id", filters.jobId);
  if (filters?.status) query = query.eq("status", filters.status);

  const result = await query;
  return { ...result, data: (result.data ?? []) as ChangeOrderListRow[] };
}

export async function getChangeOrderById(id: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("change_orders")
    .select(
      "id, company_id, job_id, daily_report_id, title, description, status, direct_cost_total, markup_percent, total_amount, created_by_user_id, created_at, updated_at, jobs(job_number, name), daily_reports(id, report_date), users(full_name)",
    )
    .eq("id", id)
    .maybeSingle();

  return { ...result, data: (result.data ?? null) as ChangeOrderDetailRow | null };
}

export async function getChangeOrderLineItems(changeOrderId: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("change_order_line_items")
    .select("id, company_id, change_order_id, description, quantity, unit_cost, line_total, created_at, updated_at")
    .eq("change_order_id", changeOrderId)
    .order("created_at", { ascending: true });

  return { ...result, data: (result.data ?? []) as ChangeOrderLineItemRow[] };
}

export async function getChangeOrderFiles(changeOrderId: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("change_order_files")
    .select("id, company_id, change_order_id, job_file_id, created_at, job_files(id, file_name, tag, note, storage_path, created_at)")
    .eq("change_order_id", changeOrderId)
    .order("created_at", { ascending: false });

  return { ...result, data: (result.data ?? []) as ChangeOrderFileRow[] };
}

export async function getJobTimeEntries(jobId: string) {
  return getTimeEntries({ jobId });
}
