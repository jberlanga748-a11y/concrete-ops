"use server";

import type { AssignmentRole, CustomerStatus, JobStatus } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

async function getCurrentAppUser() {
  const supabase = await createClient();
  const { data: authResult, error: authError } = await supabase.auth.getUser();
  if (authError || !authResult.user) {
    return { supabase, error: "You must be signed in." };
  }

  const { data: appUser, error: appUserError } = await supabase
    .from("users")
    .select("id, company_id")
    .eq("auth_user_id", authResult.user.id)
    .single();

  if (appUserError || !appUser) {
    return { supabase, error: "Could not resolve your app user record." };
  }

  return { supabase, appUser };
}

async function syncForemanAssignment(args: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  companyId: string;
  jobId: string;
  foremanEmployeeId?: string;
}) {
  const { supabase, companyId, jobId, foremanEmployeeId } = args;

  const { data: existingForemanAssignments, error: existingError } = await supabase
    .from("job_assignments")
    .select("id, employee_id")
    .eq("company_id", companyId)
    .eq("job_id", jobId)
    .eq("assignment_role", "foreman");

  if (existingError) return { error: existingError.message };

  for (const assignment of existingForemanAssignments ?? []) {
    const shouldBeActive = foremanEmployeeId === assignment.employee_id;
    const { error } = await supabase
      .from("job_assignments")
      .update({ is_active: shouldBeActive, end_date: shouldBeActive ? null : new Date().toISOString().slice(0, 10) })
      .eq("id", assignment.id);

    if (error) return { error: error.message };
  }

  if (!foremanEmployeeId) {
    return { data: true };
  }

  const { data: matchingAssignment, error: matchingError } = await supabase
    .from("job_assignments")
    .select("id")
    .eq("company_id", companyId)
    .eq("job_id", jobId)
    .eq("employee_id", foremanEmployeeId)
    .maybeSingle();

  if (matchingError) return { error: matchingError.message };

  if (matchingAssignment) {
    const { error } = await supabase
      .from("job_assignments")
      .update({ assignment_role: "foreman", is_active: true, end_date: null })
      .eq("id", matchingAssignment.id);

    if (error) return { error: error.message };
    return { data: true };
  }

  const { error } = await supabase.from("job_assignments").insert({
    company_id: companyId,
    job_id: jobId,
    employee_id: foremanEmployeeId,
    assignment_role: "foreman",
    is_active: true,
  });

  if (error) return { error: error.message };
  return { data: true };
}

type ClockInInput = {
  employeeId: string;
  jobId: string;
  jobPhaseId?: string;
};

export async function createClockInEntry(input: ClockInInput) {
  const supabase = await createClient();

  const payload = {
    employee_id: input.employeeId,
    job_id: input.jobId,
    job_phase_id: input.jobPhaseId || null,
    clock_in_at: new Date().toISOString(),
    status: "clocked_in",
    source: "employee_app",
  };

  const { data, error } = await supabase.from("time_entries").insert(payload).select("id").single();
  if (error) return { error: error.message };
  return { data };
}

export async function clockOutLatestEntry(input: { employeeId: string; jobId?: string }) {
  const supabase = await createClient();

  let openEntryQuery = supabase
    .from("time_entries")
    .select("id, clock_in_at, break_minutes")
    .eq("employee_id", input.employeeId)
    .is("clock_out_at", null)
    .in("status", ["clocked_in", "on_break"])
    .order("clock_in_at", { ascending: false })
    .limit(1);

  if (input.jobId) openEntryQuery = openEntryQuery.eq("job_id", input.jobId);

  const { data: openEntries, error: openEntryError } = await openEntryQuery;
  if (openEntryError) return { error: openEntryError.message };

  const openEntry = openEntries?.[0];
  if (!openEntry) return { error: "No open time entry found for this employee." };

  const nowIso = new Date().toISOString();
  const elapsedMs = new Date(nowIso).getTime() - new Date(openEntry.clock_in_at).getTime();
  const breakMs = (openEntry.break_minutes ?? 0) * 60 * 1000;
  const totalHours = Math.max(0, (elapsedMs - breakMs) / 1000 / 60 / 60);

  const { error: updateError } = await supabase
    .from("time_entries")
    .update({ clock_out_at: nowIso, total_hours: Number(totalHours.toFixed(2)), status: "clocked_out" })
    .eq("id", openEntry.id);

  if (updateError) return { error: updateError.message };
  return { data: { id: openEntry.id } };
}

type DailyReportInput = {
  jobId: string;
  reportDate: string;
  workCompleted: string;
  delaysIssues?: string;
  materialsDeliveries?: string;
  safetyNotes?: string;
  crewEntries: {
    employeeId: string;
    hours: number;
    notes?: string;
  }[];
};

export async function createDailyReport(input: DailyReportInput) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in to submit a daily report." };
  const { supabase, appUser } = auth;

  const payload = {
    company_id: appUser.company_id,
    submitted_by_user_id: appUser.id,
    job_id: input.jobId,
    report_date: input.reportDate,
    work_completed: input.workCompleted,
    delays_issues: input.delaysIssues?.trim() || null,
    materials_deliveries: input.materialsDeliveries?.trim() || null,
    safety_notes: input.safetyNotes?.trim() || null,
  };

  const { data, error } = await supabase.from("daily_reports").insert(payload).select("id").single();
  if (error) return { error: error.message };

  const crewRows = input.crewEntries.filter((entry) => entry.employeeId);
  if (crewRows.length > 0) {
    const { error: crewError } = await supabase.from("daily_report_crew_entries").insert(
      crewRows.map((entry) => ({
        company_id: appUser.company_id,
        daily_report_id: data.id,
        employee_id: entry.employeeId,
        hours: entry.hours,
        notes: entry.notes?.trim() || null,
      })),
    );

    if (crewError) return { error: crewError.message };
  }

  return { data };
}

export async function updateDailyReport(
  id: string,
  input: DailyReportInput,
) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in to update a daily report." };
  const { supabase, appUser } = auth;

  const payload = {
    job_id: input.jobId,
    report_date: input.reportDate,
    work_completed: input.workCompleted,
    delays_issues: input.delaysIssues?.trim() || null,
    materials_deliveries: input.materialsDeliveries?.trim() || null,
    safety_notes: input.safetyNotes?.trim() || null,
  };

  const { data, error } = await supabase
    .from("daily_reports")
    .update(payload)
    .eq("company_id", appUser.company_id)
    .eq("id", id)
    .select("id")
    .single();

  if (error) return { error: error.message };

  const { error: deleteCrewError } = await supabase
    .from("daily_report_crew_entries")
    .delete()
    .eq("company_id", appUser.company_id)
    .eq("daily_report_id", id);

  if (deleteCrewError) return { error: deleteCrewError.message };

  const crewRows = input.crewEntries.filter((entry) => entry.employeeId);
  if (crewRows.length > 0) {
    const { error: crewError } = await supabase.from("daily_report_crew_entries").insert(
      crewRows.map((entry) => ({
        company_id: appUser.company_id,
        daily_report_id: id,
        employee_id: entry.employeeId,
        hours: entry.hours,
        notes: entry.notes?.trim() || null,
      })),
    );

    if (crewError) return { error: crewError.message };
  }

  return { data };
}

type ChangeOrderInput = {
  jobId: string;
  dailyReportId?: string;
  title: string;
  description?: string;
  status: "draft" | "submitted" | "approved" | "rejected" | "executed";
  directCostTotal: number;
  markupPercent: number;
  totalAmount: number;
  proofFileIds: string[];
};

export async function createChangeOrder(input: ChangeOrderInput) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;

  const payload = {
    company_id: appUser.company_id,
    job_id: input.jobId,
    daily_report_id: input.dailyReportId || null,
    title: input.title,
    description: input.description?.trim() || null,
    status: input.status,
    direct_cost_total: input.directCostTotal,
    markup_percent: input.markupPercent,
    total_amount: input.totalAmount,
    created_by_user_id: appUser.id,
  };

  const { data: changeOrder, error: changeOrderError } = await supabase.from("change_orders").insert(payload).select("id").single();
  if (changeOrderError || !changeOrder) return { error: changeOrderError?.message || "Failed to create change order." };

  const proofFileIds = Array.from(new Set(input.proofFileIds.filter(Boolean)));
  if (proofFileIds.length > 0) {
    const { error: proofError } = await supabase.from("change_order_files").insert(
      proofFileIds.map((jobFileId) => ({
        company_id: appUser.company_id,
        change_order_id: changeOrder.id,
        job_file_id: jobFileId,
      })),
    );

    if (proofError) return { error: proofError.message };
  }

  return { data: changeOrder };
}

type EmployeeInput = {
  fullName: string;
  phone?: string;
  email?: string;
  crewName?: string;
  jobTitle?: string;
  hireDate?: string;
  isActive: boolean;
};

export async function createEmployee(input: EmployeeInput) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;

  const payload = {
    company_id: appUser.company_id,
    full_name: input.fullName.trim(),
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    crew_name: input.crewName?.trim() || null,
    job_title: input.jobTitle?.trim() || null,
    hire_date: input.hireDate || null,
    is_active: input.isActive,
  };

  const { data, error } = await supabase.from("employees").insert(payload).select("id").single();
  if (error) return { error: error.message };
  return { data };
}

export async function updateEmployee(id: string, input: EmployeeInput) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;

  const payload = {
    full_name: input.fullName.trim(),
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    crew_name: input.crewName?.trim() || null,
    job_title: input.jobTitle?.trim() || null,
    hire_date: input.hireDate || null,
    is_active: input.isActive,
  };

  const { data, error } = await supabase
    .from("employees")
    .update(payload)
    .eq("company_id", appUser.company_id)
    .eq("id", id)
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { data };
}

type CustomerInput = {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  billingAddress?: string;
  notes?: string;
  status: CustomerStatus;
};

export async function createCustomer(input: CustomerInput) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;

  const payload = {
    company_id: appUser.company_id,
    name: input.name.trim(),
    contact_name: input.contactName?.trim() || null,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    billing_address: input.billingAddress?.trim() || null,
    notes: input.notes?.trim() || null,
    status: input.status,
  };

  const { data, error } = await supabase.from("customers").insert(payload).select("id").single();
  if (error) return { error: error.message };
  return { data };
}

export async function updateCustomer(id: string, input: CustomerInput) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;

  const payload = {
    name: input.name.trim(),
    contact_name: input.contactName?.trim() || null,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    billing_address: input.billingAddress?.trim() || null,
    notes: input.notes?.trim() || null,
    status: input.status,
  };

  const { data, error } = await supabase
    .from("customers")
    .update(payload)
    .eq("company_id", appUser.company_id)
    .eq("id", id)
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { data };
}

type JobAssignmentInput = {
  jobId: string;
  employeeId: string;
  assignmentRole: AssignmentRole;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
};

export async function createJobAssignment(input: JobAssignmentInput) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;

  const payload = {
    company_id: appUser.company_id,
    job_id: input.jobId,
    employee_id: input.employeeId,
    assignment_role: input.assignmentRole,
    start_date: input.startDate || null,
    end_date: input.endDate || null,
    is_active: input.isActive,
  };

  const { data, error } = await supabase.from("job_assignments").insert(payload).select("id").single();
  if (error) return { error: error.message };

  if (input.assignmentRole === "foreman" && input.isActive) {
    const { error: jobError } = await supabase
      .from("jobs")
      .update({ foreman_employee_id: input.employeeId })
      .eq("company_id", appUser.company_id)
      .eq("id", input.jobId);

    if (jobError) return { error: jobError.message };
  }

  return { data };
}

export async function updateJobAssignment(id: string, input: JobAssignmentInput) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;

  const { data: existingAssignment, error: assignmentError } = await supabase
    .from("job_assignments")
    .select("job_id, employee_id, assignment_role")
    .eq("company_id", appUser.company_id)
    .eq("id", id)
    .single();

  if (assignmentError || !existingAssignment) return { error: assignmentError?.message || "Assignment not found." };

  const payload = {
    assignment_role: input.assignmentRole,
    start_date: input.startDate || null,
    end_date: input.endDate || null,
    is_active: input.isActive,
  };

  const { data, error } = await supabase
    .from("job_assignments")
    .update(payload)
    .eq("company_id", appUser.company_id)
    .eq("id", id)
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (input.assignmentRole === "foreman" && input.isActive) {
    const { error: jobError } = await supabase
      .from("jobs")
      .update({ foreman_employee_id: input.employeeId })
      .eq("company_id", appUser.company_id)
      .eq("id", input.jobId);

    if (jobError) return { error: jobError.message };
  }

  if (
    existingAssignment.assignment_role === "foreman" &&
    (!input.isActive || input.assignmentRole !== "foreman")
  ) {
    const { data: job } = await supabase
      .from("jobs")
      .select("foreman_employee_id")
      .eq("company_id", appUser.company_id)
      .eq("id", existingAssignment.job_id)
      .maybeSingle();

    if (job?.foreman_employee_id === existingAssignment.employee_id) {
      const { error: clearError } = await supabase
        .from("jobs")
        .update({ foreman_employee_id: null })
        .eq("company_id", appUser.company_id)
        .eq("id", existingAssignment.job_id);

      if (clearError) return { error: clearError.message };
    }
  }

  return { data };
}

type JobInput = {
  customerId: string;
  jobNumber: string;
  name: string;
  foremanEmployeeId?: string;
  status: JobStatus;
  startDate?: string;
  targetFinishDate?: string;
  address?: string;
  description?: string;
};

export async function createJob(input: JobInput) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;

  const payload = {
    company_id: appUser.company_id,
    customer_id: input.customerId,
    job_number: input.jobNumber.trim(),
    name: input.name.trim(),
    foreman_employee_id: input.foremanEmployeeId || null,
    status: input.status,
    start_date: input.startDate || null,
    target_finish_date: input.targetFinishDate || null,
    address: input.address?.trim() || null,
    description: input.description?.trim() || null,
  };

  const { data, error } = await supabase.from("jobs").insert(payload).select("id").single();
  if (error) return { error: error.message };

  const syncResult = await syncForemanAssignment({
    supabase,
    companyId: appUser.company_id,
    jobId: data.id,
    foremanEmployeeId: input.foremanEmployeeId,
  });
  if (syncResult.error) return { error: syncResult.error };

  return { data };
}

export async function updateJob(id: string, input: JobInput) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;

  const payload = {
    customer_id: input.customerId,
    job_number: input.jobNumber.trim(),
    name: input.name.trim(),
    foreman_employee_id: input.foremanEmployeeId || null,
    status: input.status,
    start_date: input.startDate || null,
    target_finish_date: input.targetFinishDate || null,
    address: input.address?.trim() || null,
    description: input.description?.trim() || null,
  };

  const { data, error } = await supabase
    .from("jobs")
    .update(payload)
    .eq("company_id", appUser.company_id)
    .eq("id", id)
    .select("id")
    .single();

  if (error) return { error: error.message };

  const syncResult = await syncForemanAssignment({
    supabase,
    companyId: appUser.company_id,
    jobId: id,
    foremanEmployeeId: input.foremanEmployeeId,
  });
  if (syncResult.error) return { error: syncResult.error };

  return { data };
}
