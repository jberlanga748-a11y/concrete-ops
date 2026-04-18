import type {
  Approval,
  AssignmentRole,
  ChangeOrder,
  ChangeOrderFile,
  ChangeOrderLineItem,
  Customer,
  DailyReport,
  DailyReportCrewEntry,
  Document,
  DocumentLink,
  DocumentLinkType,
  Employee,
  Estimate,
  EstimateLineItem,
  Incident,
  JobCostSnapshot,
  AuditLog,
  Notification,
  PPEItem,
  Policy,
  PolicyAcknowledgment,
  Proposal,
  ProposalSection,
  JobAssignment,
  Job,
  JobFile,
  JobPhase,
  TimeEntry,
  ToolboxTalk,
  ToolboxTalkAttendee,
  User,
} from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { getEmployeeUploadAccess } from "@/lib/uploads/employeeAccess";

export type JobListRow = Pick<Job, "id" | "job_number" | "name" | "status" | "start_date" | "target_finish_date"> & {
  customers: Pick<Customer, "name">[] | Pick<Customer, "name"> | null;
  foreman_employee: Pick<Employee, "full_name">[] | Pick<Employee, "full_name"> | null;
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

export type ToolboxTalkListRow = Pick<
  ToolboxTalk,
  "id" | "topic" | "talk_date" | "foreman_employee_id" | "created_at"
> & {
  foreman_employee:
    | Pick<Employee, "full_name">[]
    | Pick<Employee, "full_name">
    | null;
};

export type ToolboxTalkDetailRow = ToolboxTalk & {
  foreman_employee:
    | Pick<Employee, "id" | "full_name" | "job_title" | "crew_name">[]
    | Pick<Employee, "id" | "full_name" | "job_title" | "crew_name">
    | null;
};

export type ToolboxTalkAttendeeRow = Pick<
  ToolboxTalkAttendee,
  "id" | "toolbox_talk_id" | "employee_id" | "signed_at" | "created_at"
> & {
  employees:
    | Pick<Employee, "full_name" | "job_title" | "crew_name">[]
    | Pick<Employee, "full_name" | "job_title" | "crew_name">
    | null;
};

export type ToolboxTalkAttendeeOptionRow = {
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

export type DocumentLinkRow = Pick<DocumentLink, "id" | "link_type" | "linked_record_id">;

export type DocumentRow = Pick<
  Document,
  "id" | "source_job_file_id" | "job_id" | "daily_report_id" | "file_name" | "file_type" | "storage_bucket" | "storage_path" | "file_size_bytes" | "tag" | "note" | "created_at"
> & {
  jobs: Pick<Job, "job_number" | "name">[] | Pick<Job, "job_number" | "name"> | null;
  daily_reports: Pick<DailyReport, "report_date">[] | Pick<DailyReport, "report_date"> | null;
  users: Pick<User, "full_name">[] | Pick<User, "full_name"> | null;
  employees: Pick<Employee, "full_name">[] | Pick<Employee, "full_name"> | null;
  document_links: DocumentLinkRow[] | null;
};

export type DocumentDetailRow = DocumentRow & Pick<Document, "company_id">;

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

export type IncidentListRow = Pick<
  Incident,
  "id" | "job_id" | "employee_id" | "incident_type" | "incident_date" | "status" | "created_at"
> & {
  jobs: Pick<Job, "job_number" | "name">[] | Pick<Job, "job_number" | "name"> | null;
  incident_employee: Pick<Employee, "full_name">[] | Pick<Employee, "full_name"> | null;
};

export type IncidentDetailRow = Incident & {
  jobs: Pick<Job, "id" | "job_number" | "name">[] | Pick<Job, "id" | "job_number" | "name"> | null;
  incident_employee: Pick<Employee, "id" | "full_name" | "job_title" | "crew_name">[] | Pick<Employee, "id" | "full_name" | "job_title" | "crew_name"> | null;
  reported_by_user: Pick<User, "full_name">[] | Pick<User, "full_name"> | null;
  reported_by_employee: Pick<Employee, "full_name" | "job_title" | "crew_name">[] | Pick<Employee, "full_name" | "job_title" | "crew_name"> | null;
};

export type PolicyListRow = Pick<
  Policy,
  "id" | "title" | "category" | "version_label" | "is_active" | "created_at"
>;

export type PolicyDetailRow = Policy;

export type PolicyAcknowledgmentRow = Pick<
  PolicyAcknowledgment,
  "id" | "policy_id" | "employee_id" | "user_id" | "status" | "acknowledged_at" | "created_at"
> & {
  employees: Pick<Employee, "full_name" | "job_title" | "crew_name">[] | Pick<Employee, "full_name" | "job_title" | "crew_name"> | null;
  users: Pick<User, "full_name" | "email" | "role">[] | Pick<User, "full_name" | "email" | "role"> | null;
};

export type PPEItemRow = Pick<
  PPEItem,
  "id" | "employee_id" | "item_name" | "status" | "fit_notes" | "issued_at" | "replacement_due_at" | "created_at"
> & {
  employees: Pick<Employee, "full_name" | "job_title" | "crew_name">[] | Pick<Employee, "full_name" | "job_title" | "crew_name"> | null;
};

export type PPEDetailRow = PPEItem & {
  employees: Pick<Employee, "id" | "full_name" | "job_title" | "crew_name">[] | Pick<Employee, "id" | "full_name" | "job_title" | "crew_name"> | null;
};

export type NotificationRow = Pick<
  Notification,
  "id" | "notification_type" | "title" | "body" | "related_table" | "related_id" | "priority" | "is_read" | "created_at"
>;

export type AuditLogRow = Pick<
  AuditLog,
  "id" | "actor_user_id" | "actor_employee_id" | "action_type" | "target_table" | "target_id" | "summary" | "created_at"
> & {
  actor_user: Pick<User, "full_name" | "email" | "role">[] | Pick<User, "full_name" | "email" | "role"> | null;
  actor_employee: Pick<Employee, "full_name" | "job_title" | "crew_name">[] | Pick<Employee, "full_name" | "job_title" | "crew_name"> | null;
};

export type EstimateListRow = Pick<
  Estimate,
  "id" | "customer_id" | "job_id" | "title" | "status" | "subtotal" | "created_at"
> & {
  customers: Pick<Customer, "name">[] | Pick<Customer, "name"> | null;
  jobs: Pick<Job, "job_number" | "name">[] | Pick<Job, "job_number" | "name"> | null;
};

export type EstimateDetailRow = Estimate & {
  customers: Pick<Customer, "id" | "name" | "contact_name" | "email" | "phone">[] | Pick<Customer, "id" | "name" | "contact_name" | "email" | "phone"> | null;
  jobs: Pick<Job, "id" | "job_number" | "name">[] | Pick<Job, "id" | "job_number" | "name"> | null;
  users: Pick<User, "full_name">[] | Pick<User, "full_name"> | null;
};

export type EstimateLineItemRow = EstimateLineItem;

export type ProposalListRow = Pick<
  Proposal,
  "id" | "customer_id" | "job_id" | "title" | "status" | "created_at"
> & {
  customers: Pick<Customer, "name">[] | Pick<Customer, "name"> | null;
  jobs: Pick<Job, "job_number" | "name">[] | Pick<Job, "job_number" | "name"> | null;
};

export type ProposalDetailRow = Proposal & {
  customers: Pick<Customer, "id" | "name" | "contact_name" | "email" | "phone">[] | Pick<Customer, "id" | "name" | "contact_name" | "email" | "phone"> | null;
  jobs: Pick<Job, "id" | "job_number" | "name">[] | Pick<Job, "id" | "job_number" | "name"> | null;
  users: Pick<User, "full_name">[] | Pick<User, "full_name"> | null;
};

export type ProposalSectionRow = ProposalSection;

export type ApprovalRow = Pick<
  Approval,
  "id" | "approval_type" | "proposal_id" | "change_order_id" | "status" | "sent_at" | "viewed_at" | "decided_at" | "created_at"
> & {
  proposals: Pick<Proposal, "id" | "title" | "status">[] | Pick<Proposal, "id" | "title" | "status"> | null;
  change_orders: Pick<ChangeOrder, "id" | "title" | "status">[] | Pick<ChangeOrder, "id" | "title" | "status"> | null;
  users: Pick<User, "full_name">[] | Pick<User, "full_name"> | null;
};

export type JobCostSnapshotRow = Pick<
  JobCostSnapshot,
  "id" | "job_id" | "snapshot_date" | "actual_labor_hours" | "actual_labor_cost" | "approved_change_order_total" | "projected_revenue_total" | "time_entry_count" | "daily_report_count" | "updated_at"
>;

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
export type ManagedUserRow = Pick<
  User,
  "id" | "full_name" | "email" | "phone" | "role" | "status" | "last_login_at" | "created_at"
> & {
  linkedEmployee:
    | Pick<Employee, "id" | "full_name" | "job_title" | "crew_name" | "email" | "user_id">
    | null;
};
export type EmployeeUserLinkOption = Pick<Employee, "id" | "user_id" | "is_active"> & {
  label: string;
};

export async function getJobs() {
  const supabase = await createClient();
  const result = await supabase
    .from("jobs")
    .select(
      "id, job_number, name, status, start_date, target_finish_date, customers(name), foreman_employee:employees!jobs_foreman_fk(full_name)",
    )
    .order("created_at", { ascending: false });

  return {
    ...result,
    data: (result.data ?? []) as JobListRow[],
  };
}

export async function getToolboxTalks(filters?: { date?: string; foremanEmployeeId?: string }) {
  const supabase = await createClient();

  let query = supabase
    .from("toolbox_talks")
    .select("id, topic, talk_date, foreman_employee_id, created_at, foreman_employee:employees!toolbox_talks_foreman_fk(full_name)")
    .order("talk_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.date) query = query.eq("talk_date", filters.date);
  if (filters?.foremanEmployeeId) query = query.eq("foreman_employee_id", filters.foremanEmployeeId);

  const result = await query;
  return { ...result, data: (result.data ?? []) as ToolboxTalkListRow[] };
}

export async function getToolboxTalkById(id: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("toolbox_talks")
    .select("id, company_id, topic, talk_date, foreman_employee_id, notes, created_at, foreman_employee:employees!toolbox_talks_foreman_fk(id, full_name, job_title, crew_name)")
    .eq("id", id)
    .maybeSingle();

  return { ...result, data: (result.data ?? null) as ToolboxTalkDetailRow | null };
}

export async function getToolboxTalkAttendees(toolboxTalkId: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("toolbox_talk_attendees")
    .select("id, toolbox_talk_id, employee_id, signed_at, created_at, employees(full_name, job_title, crew_name)")
    .eq("toolbox_talk_id", toolboxTalkId)
    .order("created_at", { ascending: true });

  return { ...result, data: (result.data ?? []) as ToolboxTalkAttendeeRow[] };
}

export async function getToolboxTalkAttendeeOptions() {
  const [employeeOptions, assignmentOptions] = await Promise.all([
    getEmployeeOptions(),
    getActiveJobAssignmentOptions(),
  ]);

  const options = new Map<string, ToolboxTalkAttendeeOptionRow>();

  for (const employee of employeeOptions) {
    options.set(employee.id, {
      employeeId: employee.id,
      employeeLabel: employee.label,
    });
  }

  for (const assignment of assignmentOptions) {
    if (!options.has(assignment.employeeId)) {
      options.set(assignment.employeeId, {
        employeeId: assignment.employeeId,
        employeeLabel: assignment.employeeLabel,
      });
    }
  }

  return Array.from(options.values()).sort((a, b) => a.employeeLabel.localeCompare(b.employeeLabel));
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

export async function getManagedUsers() {
  const supabase = await createClient();
  const [{ data: users, error: usersError }, { data: employees, error: employeesError }] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, email, phone, role, status, last_login_at, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("employees")
      .select("id, user_id, full_name, job_title, crew_name, email"),
  ]);

  if (usersError) {
    return { data: [] as ManagedUserRow[], error: usersError };
  }

  if (employeesError) {
    return { data: [] as ManagedUserRow[], error: employeesError };
  }

  const employeeByUserId = new Map<string, {
    id: string;
    user_id: string | null;
    full_name: string;
    job_title: string | null;
    crew_name: string | null;
    email: string | null;
  }>();

  for (const employee of employees ?? []) {
    if (employee.user_id) {
      employeeByUserId.set(employee.user_id, employee);
    }
  }

  return {
    data: (users ?? []).map((user) => ({
      ...user,
      linkedEmployee: employeeByUserId.get(user.id) ?? null,
    })) as ManagedUserRow[],
    error: null,
  };
}

export async function getEmployeeUserLinkOptions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, user_id, full_name, job_title, crew_name, email, is_active")
    .order("is_active", { ascending: false })
    .order("full_name", { ascending: true });

  if (error) {
    return [] as EmployeeUserLinkOption[];
  }

  return (data ?? []).map((employee) => ({
    id: employee.id,
    user_id: employee.user_id,
    is_active: employee.is_active,
    label: [
      employee.full_name,
      employee.job_title,
      employee.crew_name,
      employee.email,
      employee.is_active ? null : "Inactive",
    ].filter(Boolean).join(" · "),
  })) as EmployeeUserLinkOption[];
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

export async function getEmployeeUploadJobOptions() {
  const accessResult = await getEmployeeUploadAccess();
  const assignedJobIds = accessResult.data?.assignedJobIds ?? [];

  if (assignedJobIds.length === 0) {
    return [] as TimeOption[];
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("jobs")
    .select("id, job_number, name")
    .in("id", assignedJobIds)
    .order("job_number", { ascending: true });

  return (data ?? []).map((job: Pick<Job, "id" | "job_number" | "name">) => ({
    id: job.id,
    label: `${job.job_number} · ${job.name}`,
  }));
}

export async function getEmployeeUploadDailyReportOptions(jobId?: string) {
  const accessResult = await getEmployeeUploadAccess();
  const assignedJobIds = accessResult.data?.assignedJobIds ?? [];
  const scopedJobIds = jobId ? assignedJobIds.filter((assignedJobId: string) => assignedJobId === jobId) : assignedJobIds;

  if (scopedJobIds.length === 0) {
    return [] as DailyReportOption[];
  }

  const supabase = await createClient();
  let query = supabase
    .from("daily_reports")
    .select("id, job_id, report_date, jobs(job_number, name)")
    .in("job_id", scopedJobIds)
    .order("report_date", { ascending: false })
    .limit(100);

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

type DocumentFilters = {
  jobId?: string;
  dailyReportId?: string;
  changeOrderId?: string;
  incidentId?: string;
  tag?: string;
};

const DOCUMENT_SELECT =
  "id, company_id, source_job_file_id, job_id, daily_report_id, file_name, file_type, storage_bucket, storage_path, file_size_bytes, tag, note, created_at, jobs(job_number, name), daily_reports(report_date), users(full_name), employees(full_name), document_links(id, link_type, linked_record_id)";

export async function getDocuments(filters?: DocumentFilters) {
  const supabase = await createClient();

  let linkedDocumentIds: string[] | null = null;

  if (filters?.changeOrderId || filters?.incidentId) {
    const linkType: DocumentLinkType = filters.changeOrderId ? "change_order" : "incident";
    const linkedRecordId = filters.changeOrderId || filters.incidentId || "";
    const { data: links, error } = await supabase
      .from("document_links")
      .select("document_id")
      .eq("link_type", linkType)
      .eq("linked_record_id", linkedRecordId);

    if (error) {
      return { data: [] as DocumentRow[], error };
    }

    linkedDocumentIds = Array.from(new Set((links ?? []).map((link: { document_id: string }) => link.document_id)));
    if (linkedDocumentIds.length === 0) {
      return { data: [] as DocumentRow[], error: null };
    }
  }

  let query = supabase.from("documents").select(DOCUMENT_SELECT).order("created_at", { ascending: false });

  if (filters?.jobId) query = query.eq("job_id", filters.jobId);
  if (filters?.dailyReportId) query = query.eq("daily_report_id", filters.dailyReportId);
  if (filters?.tag) query = query.eq("tag", filters.tag);
  if (linkedDocumentIds) query = query.in("id", linkedDocumentIds);

  const result = await query;
  return { ...result, data: (result.data ?? []) as DocumentRow[] };
}

export async function getDocumentById(id: string) {
  const supabase = await createClient();
  const result = await supabase.from("documents").select(DOCUMENT_SELECT).eq("id", id).maybeSingle();
  return { ...result, data: (result.data ?? null) as DocumentDetailRow | null };
}

export async function getDocumentsForEntity(entityType: DocumentLinkType, entityId: string) {
  if (entityType === "job") return getDocuments({ jobId: entityId });
  if (entityType === "daily_report") return getDocuments({ dailyReportId: entityId });
  if (entityType === "change_order") return getDocuments({ changeOrderId: entityId });
  return getDocuments({ incidentId: entityId });
}

export async function getIncidents(filters?: { jobId?: string; status?: string; incidentType?: string }) {
  const supabase = await createClient();

  let query = supabase
    .from("incidents")
    .select("id, job_id, employee_id, incident_type, incident_date, status, created_at, jobs(job_number, name), incident_employee:employees!incidents_employee_fk(full_name)")
    .order("incident_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.jobId) query = query.eq("job_id", filters.jobId);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.incidentType) query = query.eq("incident_type", filters.incidentType);

  const result = await query;
  return { ...result, data: (result.data ?? []) as IncidentListRow[] };
}

export async function getIncidentById(id: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("incidents")
    .select(
      "id, company_id, job_id, employee_id, reported_by_user_id, reported_by_employee_id, incident_type, incident_date, description, corrective_action, status, created_at, updated_at, jobs(id, job_number, name), incident_employee:employees!incidents_employee_fk(id, full_name, job_title, crew_name), reported_by_user:users(full_name), reported_by_employee:employees!incidents_reported_employee_fk(full_name, job_title, crew_name)",
    )
    .eq("id", id)
    .maybeSingle();

  return { ...result, data: (result.data ?? null) as IncidentDetailRow | null };
}

export async function getIncidentTypeOptions() {
  return [
    { value: "near_miss", label: "Near Miss" },
    { value: "injury", label: "Injury" },
    { value: "property_damage", label: "Property Damage" },
    { value: "observation", label: "Observation" },
  ] as const;
}

export async function getIncidentStatusOptions() {
  return [
    { value: "open", label: "Open" },
    { value: "under_review", label: "Under Review" },
    { value: "closed", label: "Closed" },
  ] as const;
}

export async function getPolicies(filters?: { isActive?: boolean }) {
  const supabase = await createClient();

  let query = supabase
    .from("policies")
    .select("id, title, category, version_label, is_active, created_at")
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false });

  if (typeof filters?.isActive === "boolean") {
    query = query.eq("is_active", filters.isActive);
  }

  const result = await query;
  return { ...result, data: (result.data ?? []) as PolicyListRow[] };
}

export async function getPolicyById(id: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("policies")
    .select("id, company_id, title, category, version_label, content, is_active, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  return { ...result, data: (result.data ?? null) as PolicyDetailRow | null };
}

export async function getPolicyAcknowledgments(policyId: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("policy_acknowledgments")
    .select("id, policy_id, employee_id, user_id, status, acknowledged_at, created_at, employees(full_name, job_title, crew_name), users(full_name, email, role)")
    .eq("policy_id", policyId)
    .order("status", { ascending: true })
    .order("created_at", { ascending: true });

  return { ...result, data: (result.data ?? []) as PolicyAcknowledgmentRow[] };
}

export async function getMyPolicyAcknowledgments() {
  const supabase = await createClient();
  const result = await supabase
    .from("policy_acknowledgments")
    .select("id, policy_id, employee_id, user_id, status, acknowledged_at, created_at, employees(full_name, job_title, crew_name), users(full_name, email, role), policies(id, title, category, version_label, content, is_active, created_at, updated_at)")
    .order("created_at", { ascending: false });

  return {
    ...result,
    data: (result.data ?? []) as (PolicyAcknowledgmentRow & {
      policies: PolicyDetailRow[] | PolicyDetailRow | null;
    })[],
  };
}

export async function getPPEItems(filters?: { employeeId?: string; status?: string }) {
  const supabase = await createClient();

  let query = supabase
    .from("ppe_items")
    .select("id, employee_id, item_name, status, fit_notes, issued_at, replacement_due_at, created_at, employees(full_name, job_title, crew_name)")
    .order("replacement_due_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (filters?.employeeId) query = query.eq("employee_id", filters.employeeId);
  if (filters?.status) query = query.eq("status", filters.status);

  const result = await query;
  return { ...result, data: (result.data ?? []) as PPEItemRow[] };
}

export async function getPPEItemById(id: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("ppe_items")
    .select("id, company_id, employee_id, item_name, status, fit_notes, issued_at, replacement_due_at, created_at, updated_at, employees(id, full_name, job_title, crew_name)")
    .eq("id", id)
    .maybeSingle();

  return { ...result, data: (result.data ?? null) as PPEDetailRow | null };
}

export async function getMyPPEItems() {
  return getPPEItems();
}

export async function getPPEStatusOptions() {
  return [
    { value: "issued", label: "Issued" },
    { value: "needs_replacement", label: "Needs Replacement" },
    { value: "pending_fit_check", label: "Pending Fit Check" },
  ] as const;
}

export async function getNotifications(filters?: { unreadOnly?: boolean }) {
  const supabase = await createClient();

  let query = supabase
    .from("notifications")
    .select("id, notification_type, title, body, related_table, related_id, priority, is_read, created_at")
    .order("is_read", { ascending: true })
    .order("created_at", { ascending: false });

  if (filters?.unreadOnly) {
    query = query.eq("is_read", false);
  }

  const result = await query;
  return { ...result, data: (result.data ?? []) as NotificationRow[] };
}

export async function getAuditLogs(filters?: { actionType?: string; targetTable?: string }) {
  const supabase = await createClient();

  let query = supabase
    .from("audit_logs")
    .select("id, actor_user_id, actor_employee_id, action_type, target_table, target_id, summary, created_at, actor_user:users(full_name, email, role), actor_employee:employees(full_name, job_title, crew_name)")
    .order("created_at", { ascending: false });

  if (filters?.actionType) query = query.eq("action_type", filters.actionType);
  if (filters?.targetTable) query = query.eq("target_table", filters.targetTable);

  const result = await query;
  return { ...result, data: (result.data ?? []) as AuditLogRow[] };
}

export async function getEstimates(filters?: { customerId?: string; status?: string }) {
  const supabase = await createClient();

  let query = supabase
    .from("estimates")
    .select("id, customer_id, job_id, title, status, subtotal, created_at, customers(name), jobs(job_number, name)")
    .order("created_at", { ascending: false });

  if (filters?.customerId) query = query.eq("customer_id", filters.customerId);
  if (filters?.status) query = query.eq("status", filters.status);

  const result = await query;
  return { ...result, data: (result.data ?? []) as EstimateListRow[] };
}

export async function getEstimateById(id: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("estimates")
    .select("id, company_id, customer_id, job_id, created_by_user_id, title, status, notes, subtotal, created_at, updated_at, customers(id, name, contact_name, email, phone), jobs(id, job_number, name), users(full_name)")
    .eq("id", id)
    .maybeSingle();

  return { ...result, data: (result.data ?? null) as EstimateDetailRow | null };
}

export async function getEstimateLineItems(estimateId: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("estimate_line_items")
    .select("id, company_id, estimate_id, item_type, description, quantity, unit, unit_cost, line_total, created_at, updated_at")
    .eq("estimate_id", estimateId)
    .order("created_at", { ascending: true });

  return { ...result, data: (result.data ?? []) as EstimateLineItemRow[] };
}

export async function getEstimateStatusOptions() {
  return [
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ] as const;
}

export async function getEstimateLineItemTypeOptions() {
  return [
    { value: "labor", label: "Labor" },
    { value: "material", label: "Material" },
    { value: "equipment", label: "Equipment" },
    { value: "other", label: "Other" },
  ] as const;
}

export async function getProposals(filters?: { customerId?: string; status?: string }) {
  const supabase = await createClient();

  let query = supabase
    .from("proposals")
    .select("id, customer_id, job_id, title, status, created_at, customers(name), jobs(job_number, name)")
    .order("created_at", { ascending: false });

  if (filters?.customerId) query = query.eq("customer_id", filters.customerId);
  if (filters?.status) query = query.eq("status", filters.status);

  const result = await query;
  return { ...result, data: (result.data ?? []) as ProposalListRow[] };
}

export async function getProposalById(id: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("proposals")
    .select("id, company_id, customer_id, job_id, created_by_user_id, title, status, notes, created_at, updated_at, customers(id, name, contact_name, email, phone), jobs(id, job_number, name), users(full_name)")
    .eq("id", id)
    .maybeSingle();

  return { ...result, data: (result.data ?? null) as ProposalDetailRow | null };
}

export async function getProposalSections(proposalId: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("proposal_sections")
    .select("id, company_id, proposal_id, section_type, heading, content, sort_order, created_at, updated_at")
    .eq("proposal_id", proposalId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return { ...result, data: (result.data ?? []) as ProposalSectionRow[] };
}

export async function getProposalStatusOptions() {
  return [
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ] as const;
}

export async function getProposalSectionTypeOptions() {
  return [
    { value: "scope", label: "Scope" },
    { value: "exclusion", label: "Exclusion" },
    { value: "term", label: "Term" },
  ] as const;
}

export async function getApprovals(filters?: { approvalType?: "proposal" | "change_order"; status?: "sent" | "viewed" | "approved" | "rejected" }) {
  const supabase = await createClient();

  let query = supabase
    .from("approvals")
    .select("id, approval_type, proposal_id, change_order_id, status, sent_at, viewed_at, decided_at, created_at, proposals(id, title, status), change_orders(id, title, status), users(full_name)")
    .order("created_at", { ascending: false });

  if (filters?.approvalType) query = query.eq("approval_type", filters.approvalType);
  if (filters?.status) query = query.eq("status", filters.status);

  const result = await query;
  return { ...result, data: (result.data ?? []) as ApprovalRow[] };
}

export async function getJobCostSnapshot(jobId: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("job_cost_snapshots")
    .select("id, job_id, snapshot_date, actual_labor_hours, actual_labor_cost, approved_change_order_total, projected_revenue_total, time_entry_count, daily_report_count, updated_at")
    .eq("job_id", jobId)
    .maybeSingle();

  return { ...result, data: (result.data ?? null) as JobCostSnapshotRow | null };
}

export async function getApprovalsForEntity(input: { approvalType: "proposal" | "change_order"; relatedId: string }) {
  const supabase = await createClient();
  let query = supabase
    .from("approvals")
    .select("id, approval_type, proposal_id, change_order_id, status, sent_at, viewed_at, decided_at, created_at, proposals(id, title, status), change_orders(id, title, status), users(full_name)")
    .order("created_at", { ascending: false });

  query = input.approvalType === "proposal"
    ? query.eq("proposal_id", input.relatedId)
    : query.eq("change_order_id", input.relatedId);

  const result = await query;
  return { ...result, data: (result.data ?? []) as ApprovalRow[] };
}

export async function getApprovalTypeOptions() {
  return [
    { value: "proposal", label: "Proposal" },
    { value: "change_order", label: "Change Order" },
  ] as const;
}

export async function getApprovalStatusOptions() {
  return [
    { value: "sent", label: "Sent" },
    { value: "viewed", label: "Viewed" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ] as const;
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
