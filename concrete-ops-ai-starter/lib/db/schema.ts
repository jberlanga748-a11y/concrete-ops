export type AppRole = 'owner' | 'office_admin' | 'foreman' | 'employee';
export type UserStatus = 'invited' | 'active' | 'inactive';
export type CustomerStatus = 'active' | 'inactive';
export type JobStatus = 'draft' | 'scheduled' | 'in_progress' | 'on_hold' | 'completed' | 'archived';
export type AssignmentRole = 'foreman' | 'lead' | 'crew';
export type TimeEntryStatus = 'clocked_in' | 'on_break' | 'clocked_out' | 'approved' | 'needs_review';
export type TimeEntrySource = 'employee_app' | 'admin_entry' | 'import';
export type UploadTag = 'progress' | 'issue' | 'safety' | 'delivery' | 'damage' | 'change_order_support';
export type ChangeOrderStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'executed';

export type Company = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  subscription_plan: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  company_id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  role: AppRole;
  status: UserStatus;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Employee = {
  id: string;
  company_id: string;
  user_id: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  crew_name: string | null;
  job_title: string | null;
  hourly_rate: number | null;
  is_active: boolean;
  hire_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: string;
  company_id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  billing_address: string | null;
  notes: string | null;
  status: CustomerStatus;
  created_at: string;
  updated_at: string;
};

export type Job = {
  id: string;
  company_id: string;
  customer_id: string;
  job_number: string;
  name: string;
  address: string | null;
  status: JobStatus;
  foreman_employee_id: string | null;
  estimator_user_id: string | null;
  start_date: string | null;
  target_finish_date: string | null;
  contract_value: number | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type JobAssignment = {
  id: string;
  company_id: string;
  job_id: string;
  employee_id: string;
  assignment_role: AssignmentRole;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type JobPhase = {
  id: string;
  company_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type TimeEntry = {
  id: string;
  company_id: string;
  employee_id: string;
  job_id: string;
  job_phase_id: string | null;
  clock_in_at: string;
  clock_out_at: string | null;
  break_minutes: number;
  total_hours: number | null;
  status: TimeEntryStatus;
  source: TimeEntrySource;
  notes: string | null;
  approved_by_user_id: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DailyReport = {
  id: string;
  company_id: string;
  job_id: string;
  report_date: string;
  submitted_by_user_id: string;
  work_completed: string;
  delays_issues: string | null;
  materials_deliveries: string | null;
  safety_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type DailyReportCrewEntry = {
  id: string;
  company_id: string;
  daily_report_id: string;
  employee_id: string;
  hours: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};


export type JobFile = {
  id: string;
  company_id: string;
  job_id: string;
  daily_report_id: string | null;
  uploaded_by_user_id: string | null;
  uploaded_by_employee_id: string | null;
  file_name: string;
  file_type: string;
  storage_path: string;
  tag: UploadTag;
  note: string | null;
  created_at: string;
};


export type ChangeOrder = {
  id: string;
  company_id: string;
  job_id: string;
  daily_report_id: string | null;
  title: string;
  description: string | null;
  status: ChangeOrderStatus;
  direct_cost_total: number;
  markup_percent: number;
  total_amount: number;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ChangeOrderLineItem = {
  id: string;
  company_id: string;
  change_order_id: string;
  description: string;
  quantity: number;
  unit_cost: number;
  line_total: number;
  created_at: string;
  updated_at: string;
};

export type ChangeOrderFile = {
  id: string;
  company_id: string;
  change_order_id: string;
  job_file_id: string;
  created_at: string;
};
