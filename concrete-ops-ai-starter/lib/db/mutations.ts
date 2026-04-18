"use server";

import type { ApprovalStatus, ApprovalType, AppRole, AssignmentRole, CustomerStatus, DocumentLinkType, EstimateLineItemType, EstimateStatus, IncidentStatus, IncidentType, JobStatus, NotificationPriority, NotificationType, PPEItemStatus, ProposalSectionType, ProposalStatus } from "@/lib/db/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function getCurrentAppUser() {
  const supabase = await createClient();
  const { data: authResult, error: authError } = await supabase.auth.getUser();
  if (authError || !authResult.user) {
    return { supabase, error: "You must be signed in." };
  }

  const { data: appUser, error: appUserError } = await supabase
    .from("users")
    .select("id, company_id, role")
    .eq("auth_user_id", authResult.user.id)
    .single();

  if (appUserError || !appUser) {
    return { supabase, error: "Could not resolve your app user record." };
  }

  return { supabase, appUser };
}

function isOfficeAdminRole(role?: AppRole | null) {
  return role === "owner" || role === "office_admin";
}

function getOfficeAdminRoleError(role: AppRole, action: string) {
  if (isOfficeAdminRole(role)) return null;
  return `Only owner and office admin users can ${action}.`;
}

function canManageOwnerRole(currentRole: AppRole, targetRole: AppRole) {
  if (targetRole !== "owner") return true;
  return currentRole === "owner";
}

function getInviteRedirectTo() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredUrl) return `${configuredUrl.replace(/\/$/, "")}/login`;

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl.replace(/\/$/, "")}/login`;

  return undefined;
}

async function syncEmployeeUserLink(args: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  companyId: string;
  userId: string;
  employeeId?: string;
}) {
  const { supabase, companyId, userId, employeeId } = args;

  const { data: selectedEmployee, error: selectedError } = employeeId
    ? await supabase
        .from("employees")
        .select("id, user_id")
        .eq("company_id", companyId)
        .eq("id", employeeId)
        .maybeSingle()
    : { data: null, error: null };

  if (selectedError) return { error: selectedError.message };
  if (employeeId && !selectedEmployee) return { error: "Selected employee was not found." };
  if (selectedEmployee?.user_id && selectedEmployee.user_id !== userId) {
    return { error: "That employee is already linked to another user." };
  }

  const clearQuery = supabase
    .from("employees")
    .update({ user_id: null })
    .eq("company_id", companyId)
    .eq("user_id", userId);

  if (employeeId) {
    const { error } = await clearQuery.neq("id", employeeId);
    if (error) return { error: error.message };

    const { error: linkError } = await supabase
      .from("employees")
      .update({ user_id: userId })
      .eq("company_id", companyId)
      .eq("id", employeeId);

    if (linkError) return { error: linkError.message };
    return { data: true };
  }

  const { error } = await clearQuery;
  if (error) return { error: error.message };
  return { data: true };
}

async function ensureOwnerSafety(args: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  companyId: string;
  currentUserRole: AppRole;
  existingRole: AppRole;
  nextRole: AppRole;
  nextStatus: "invited" | "active" | "inactive";
  userId: string;
}) {
  const { supabase, companyId, currentUserRole, existingRole, nextRole, nextStatus, userId } = args;

  if ((existingRole === "owner" || nextRole === "owner") && currentUserRole !== "owner") {
    return { error: "Only an owner can create or edit owner users." };
  }

  const wouldRemoveOwner = existingRole === "owner" && (nextRole !== "owner" || nextStatus === "inactive");
  if (!wouldRemoveOwner) return { data: true };

  const { count, error } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("role", "owner")
    .neq("status", "inactive")
    .neq("id", userId);

  if (error) return { error: error.message };
  if ((count ?? 0) < 1) {
    return { error: "At least one active owner must remain assigned." };
  }

  return { data: true };
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

async function ensureDocumentForJobFile(args: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  companyId: string;
  jobFileId: string;
}) {
  const { supabase, companyId, jobFileId } = args;

  const { data: existingDocument, error: existingError } = await supabase
    .from("documents")
    .select("id")
    .eq("company_id", companyId)
    .eq("source_job_file_id", jobFileId)
    .maybeSingle();

  if (existingError) return { error: existingError.message };
  if (existingDocument) return { data: existingDocument };

  const { data: jobFile, error: jobFileError } = await supabase
    .from("job_files")
    .select("id, company_id, job_id, daily_report_id, uploaded_by_user_id, uploaded_by_employee_id, file_name, file_type, storage_path, tag, note, created_at")
    .eq("company_id", companyId)
    .eq("id", jobFileId)
    .single();

  if (jobFileError || !jobFile) {
    return { error: jobFileError?.message || "Job file not found." };
  }

  const { data: document, error: insertError } = await supabase
    .from("documents")
    .insert({
      company_id: companyId,
      source_job_file_id: jobFile.id,
      job_id: jobFile.job_id,
      daily_report_id: jobFile.daily_report_id,
      uploaded_by_user_id: jobFile.uploaded_by_user_id,
      uploaded_by_employee_id: jobFile.uploaded_by_employee_id,
      file_name: jobFile.file_name,
      file_type: jobFile.file_type,
      storage_bucket: "job-uploads",
      storage_path: jobFile.storage_path,
      tag: jobFile.tag,
      note: jobFile.note,
      created_at: jobFile.created_at,
    })
    .select("id")
    .single();

  if (insertError) return { error: insertError.message };
  return { data: document };
}

async function upsertDocumentLink(args: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  companyId: string;
  documentId: string;
  linkType: DocumentLinkType;
  linkedRecordId: string;
}) {
  const { supabase, companyId, documentId, linkType, linkedRecordId } = args;
  const { error } = await supabase.from("document_links").upsert(
    {
      company_id: companyId,
      document_id: documentId,
      link_type: linkType,
      linked_record_id: linkedRecordId,
    },
    { onConflict: "document_id,link_type,linked_record_id" },
  );

  if (error) return { error: error.message };
  return { data: true };
}

async function syncPolicyAcknowledgments(args: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  companyId: string;
  policyId: string;
}) {
  const { supabase, companyId, policyId } = args;

  const [{ data: activeUsers, error: usersError }, { data: activeEmployees, error: employeesError }] = await Promise.all([
    supabase
      .from("users")
      .select("id")
      .eq("company_id", companyId)
      .eq("status", "active"),
    supabase
      .from("employees")
      .select("id, user_id")
      .eq("company_id", companyId)
      .eq("is_active", true),
  ]);

  if (usersError) return { error: usersError.message };
  if (employeesError) return { error: employeesError.message };

  const userRows = (activeUsers ?? []).map((user: { id: string }) => ({
    company_id: companyId,
    policy_id: policyId,
    user_id: user.id,
    status: "unsigned",
  }));

  const employeeRows = (activeEmployees ?? [])
    .filter((employee: { id: string; user_id: string | null }) => !employee.user_id)
    .map((employee: { id: string }) => ({
      company_id: companyId,
      policy_id: policyId,
      employee_id: employee.id,
      status: "unsigned",
    }));

  if (userRows.length > 0) {
    const { error } = await supabase.from("policy_acknowledgments").upsert(userRows, { onConflict: "policy_id,user_id" });
    if (error) return { error: error.message };
  }

  if (employeeRows.length > 0) {
    const { error } = await supabase.from("policy_acknowledgments").upsert(employeeRows, { onConflict: "policy_id,employee_id" });
    if (error) return { error: error.message };
  }

  return { data: true };
}

async function createAdminNotifications(args: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  companyId: string;
  notificationType: NotificationType;
  title: string;
  body: string;
  relatedTable?: string;
  relatedId?: string;
  priority?: NotificationPriority;
}) {
  const { supabase, companyId, notificationType, title, body, relatedTable, relatedId, priority = "normal" } = args;

  const { data: recipients, error } = await supabase
    .from("users")
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "active")
    .in("role", ["owner", "office_admin"]);

  if (error) return { error: error.message };
  if (!recipients?.length) return { data: true };

  const { error: insertError } = await supabase.from("notifications").insert(
    recipients.map((recipient: { id: string }) => ({
      company_id: companyId,
      user_id: recipient.id,
      notification_type: notificationType,
      title,
      body,
      related_table: relatedTable || null,
      related_id: relatedId || null,
      priority,
    })),
  );

  if (insertError) return { error: insertError.message };
  return { data: true };
}

async function getActorEmployeeId(args: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  companyId: string;
  userId: string;
}) {
  const { supabase, companyId, userId } = args;
  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .maybeSingle();

  return employee?.id ?? null;
}

async function createAuditLog(args: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  companyId: string;
  actorUserId?: string | null;
  actorEmployeeId?: string | null;
  actionType: string;
  targetTable: string;
  targetId: string;
  summary: string;
}) {
  const { supabase, companyId, actorUserId, actorEmployeeId, actionType, targetTable, targetId, summary } = args;
  const { error } = await supabase.from("audit_logs").insert({
    company_id: companyId,
    actor_user_id: actorUserId || null,
    actor_employee_id: actorEmployeeId || null,
    action_type: actionType,
    target_table: targetTable,
    target_id: targetId,
    summary,
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

  const notification = await createAdminNotifications({
    supabase,
    companyId: appUser.company_id,
    notificationType: "daily_report_submitted",
    title: "New daily report submitted",
    body: `A daily report was submitted for ${input.reportDate}.`,
    relatedTable: "daily_reports",
    relatedId: data.id,
    priority: "normal",
  });
  if (notification.error) return { error: notification.error };

  const actorEmployeeId = await getActorEmployeeId({
    supabase,
    companyId: appUser.company_id,
    userId: appUser.id,
  });
  const audit = await createAuditLog({
    supabase,
    companyId: appUser.company_id,
    actorUserId: appUser.id,
    actorEmployeeId,
    actionType: "daily_report.created",
    targetTable: "daily_reports",
    targetId: data.id,
    summary: `Created daily report for ${input.reportDate}.`,
  });
  if (audit.error) return { error: audit.error };

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

  const actorEmployeeId = await getActorEmployeeId({
    supabase,
    companyId: appUser.company_id,
    userId: appUser.id,
  });
  const audit = await createAuditLog({
    supabase,
    companyId: appUser.company_id,
    actorUserId: appUser.id,
    actorEmployeeId,
    actionType: "daily_report.updated",
    targetTable: "daily_reports",
    targetId: id,
    summary: `Updated daily report for ${input.reportDate}.`,
  });
  if (audit.error) return { error: audit.error };

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

    for (const jobFileId of proofFileIds) {
      const ensuredDocument = await ensureDocumentForJobFile({
        supabase,
        companyId: appUser.company_id,
        jobFileId,
      });
      if (ensuredDocument.error || !ensuredDocument.data) {
        return { error: ensuredDocument.error || "Failed to create linked document." };
      }

      const linked = await upsertDocumentLink({
        supabase,
        companyId: appUser.company_id,
        documentId: ensuredDocument.data.id,
        linkType: "change_order",
        linkedRecordId: changeOrder.id,
      });
      if (linked.error) return { error: linked.error };
    }
  }

  const notification = await createAdminNotifications({
    supabase,
    companyId: appUser.company_id,
    notificationType: "change_order_created",
    title: "New change order created",
    body: input.title.trim(),
    relatedTable: "change_orders",
    relatedId: changeOrder.id,
    priority: "high",
  });
  if (notification.error) return { error: notification.error };

  const actorEmployeeId = await getActorEmployeeId({
    supabase,
    companyId: appUser.company_id,
    userId: appUser.id,
  });
  const audit = await createAuditLog({
    supabase,
    companyId: appUser.company_id,
    actorUserId: appUser.id,
    actorEmployeeId,
    actionType: "change_order.created",
    targetTable: "change_orders",
    targetId: changeOrder.id,
    summary: `Created change order "${input.title.trim()}".`,
  });
  if (audit.error) return { error: audit.error };

  return { data: changeOrder };
}

export async function createDocumentLink(input: { documentId: string; linkType: DocumentLinkType; linkedRecordId: string }) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;

  return upsertDocumentLink({
    supabase,
    companyId: appUser.company_id,
    documentId: input.documentId,
    linkType: input.linkType,
    linkedRecordId: input.linkedRecordId,
  });
}

type IncidentInput = {
  jobId?: string;
  employeeId?: string;
  incidentType: IncidentType;
  incidentDate: string;
  description: string;
  correctiveAction?: string;
  status: IncidentStatus;
};

export async function createIncident(input: IncidentInput) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;

  const { data: reportingEmployee } = await supabase
    .from("employees")
    .select("id")
    .eq("company_id", appUser.company_id)
    .eq("user_id", appUser.id)
    .maybeSingle();

  const payload = {
    company_id: appUser.company_id,
    job_id: input.jobId || null,
    employee_id: input.employeeId || null,
    reported_by_user_id: appUser.id,
    reported_by_employee_id: reportingEmployee?.id ?? null,
    incident_type: input.incidentType,
    incident_date: input.incidentDate,
    description: input.description.trim(),
    corrective_action: input.correctiveAction?.trim() || null,
    status: input.status,
  };

  const { data, error } = await supabase.from("incidents").insert(payload).select("id").single();
  if (error) return { error: error.message };

  const notification = await createAdminNotifications({
    supabase,
    companyId: appUser.company_id,
    notificationType: "incident_created",
    title: "New incident reported",
    body: `${input.incidentType.replace(/_/g, " ")} logged for ${input.incidentDate}.`,
    relatedTable: "incidents",
    relatedId: data.id,
    priority: input.incidentType === "injury" ? "high" : "normal",
  });
  if (notification.error) return { error: notification.error };

  const audit = await createAuditLog({
    supabase,
    companyId: appUser.company_id,
    actorUserId: appUser.id,
    actorEmployeeId: reportingEmployee?.id ?? null,
    actionType: "incident.created",
    targetTable: "incidents",
    targetId: data.id,
    summary: `Created ${input.incidentType.replace(/_/g, " ")} incident for ${input.incidentDate}.`,
  });
  if (audit.error) return { error: audit.error };

  return { data };
}

type PolicyInput = {
  title: string;
  category?: string;
  versionLabel?: string;
  content: string;
  isActive: boolean;
};

export async function createPolicy(input: PolicyInput) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;

  const { data, error } = await supabase
    .from("policies")
    .insert({
      company_id: appUser.company_id,
      title: input.title.trim(),
      category: input.category?.trim() || null,
      version_label: input.versionLabel?.trim() || null,
      content: input.content.trim(),
      is_active: input.isActive,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message || "Failed to create policy." };

  const synced = await syncPolicyAcknowledgments({
    supabase,
    companyId: appUser.company_id,
    policyId: data.id,
  });
  if (synced.error) return { error: synced.error };

  const actorEmployeeId = await getActorEmployeeId({
    supabase,
    companyId: appUser.company_id,
    userId: appUser.id,
  });
  const audit = await createAuditLog({
    supabase,
    companyId: appUser.company_id,
    actorUserId: appUser.id,
    actorEmployeeId,
    actionType: "policy.created",
    targetTable: "policies",
    targetId: data.id,
    summary: `Created policy "${input.title.trim()}".`,
  });
  if (audit.error) return { error: audit.error };

  return { data };
}

export async function updatePolicy(id: string, input: PolicyInput) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;

  const { data, error } = await supabase
    .from("policies")
    .update({
      title: input.title.trim(),
      category: input.category?.trim() || null,
      version_label: input.versionLabel?.trim() || null,
      content: input.content.trim(),
      is_active: input.isActive,
    })
    .eq("company_id", appUser.company_id)
    .eq("id", id)
    .select("id")
    .single();

  if (error || !data) return { error: error?.message || "Failed to update policy." };

  const synced = await syncPolicyAcknowledgments({
    supabase,
    companyId: appUser.company_id,
    policyId: id,
  });
  if (synced.error) return { error: synced.error };

  const actorEmployeeId = await getActorEmployeeId({
    supabase,
    companyId: appUser.company_id,
    userId: appUser.id,
  });
  const audit = await createAuditLog({
    supabase,
    companyId: appUser.company_id,
    actorUserId: appUser.id,
    actorEmployeeId,
    actionType: "policy.updated",
    targetTable: "policies",
    targetId: id,
    summary: `Updated policy "${input.title.trim()}".`,
  });
  if (audit.error) return { error: audit.error };

  return { data };
}

export async function signMyPolicyAcknowledgment(policyId: string) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;

  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("company_id", appUser.company_id)
    .eq("user_id", appUser.id)
    .maybeSingle();

  let query = supabase
    .from("policy_acknowledgments")
    .update({
      status: "signed",
      acknowledged_at: new Date().toISOString(),
    })
    .eq("company_id", appUser.company_id)
    .eq("policy_id", policyId)
    .eq("user_id", appUser.id);

  const { data, error } = await query.select("id").maybeSingle();
  if (!error && data) return { data };

  if (employee?.id) {
    const fallback = await supabase
      .from("policy_acknowledgments")
      .update({
        status: "signed",
        acknowledged_at: new Date().toISOString(),
      })
      .eq("company_id", appUser.company_id)
      .eq("policy_id", policyId)
      .eq("employee_id", employee.id)
      .select("id")
      .maybeSingle();

    if (!fallback.error && fallback.data) return { data: fallback.data };
  }

  return { error: error?.message || "Could not find a policy acknowledgment for your account." };
}

type PPEItemInput = {
  employeeId: string;
  itemName: string;
  status: PPEItemStatus;
  fitNotes?: string;
  issuedAt?: string;
  replacementDueAt?: string;
};

type EstimateLineItemInput = {
  itemType: EstimateLineItemType;
  description: string;
  quantity: number;
  unit?: string;
  unitCost: number;
};

type EstimateInput = {
  customerId: string;
  jobId?: string;
  title: string;
  status: EstimateStatus;
  notes?: string;
  lineItems: EstimateLineItemInput[];
};

type ProposalSectionInput = {
  sectionType: ProposalSectionType;
  heading?: string;
  content: string;
};

type ProposalInput = {
  customerId: string;
  jobId?: string;
  title: string;
  status: ProposalStatus;
  notes?: string;
  sections: ProposalSectionInput[];
};

type ApprovalInput = {
  approvalType: ApprovalType;
  relatedId: string;
};

function normalizeEstimateLineItems(lineItems: EstimateLineItemInput[]) {
  return lineItems
    .filter((item) => item.description.trim())
    .map((item) => {
      const quantity = Number(item.quantity) || 0;
      const unitCost = Number(item.unitCost) || 0;
      return {
        item_type: item.itemType,
        description: item.description.trim(),
        quantity,
        unit: item.unit?.trim() || null,
        unit_cost: unitCost,
        line_total: Number((quantity * unitCost).toFixed(2)),
      };
    });
}

function normalizeProposalSections(sections: ProposalSectionInput[]) {
  return sections
    .filter((section) => section.content.trim())
    .map((section, index) => ({
      section_type: section.sectionType,
      heading: section.heading?.trim() || null,
      content: section.content.trim(),
      sort_order: index,
    }));
}

export async function createPPEItem(input: PPEItemInput) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;

  const { data, error } = await supabase
    .from("ppe_items")
    .insert({
      company_id: appUser.company_id,
      employee_id: input.employeeId,
      item_name: input.itemName.trim(),
      status: input.status,
      fit_notes: input.fitNotes?.trim() || null,
      issued_at: input.issuedAt || null,
      replacement_due_at: input.replacementDueAt || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (input.status !== "issued") {
    const notification = await createAdminNotifications({
      supabase,
      companyId: appUser.company_id,
      notificationType: "ppe_attention",
      title: "PPE item needs attention",
      body: `${input.itemName.trim()} was logged as ${input.status.replace(/_/g, " ")}.`,
      relatedTable: "ppe_items",
      relatedId: data.id,
      priority: "normal",
    });
    if (notification.error) return { error: notification.error };
  }

  const actorEmployeeId = await getActorEmployeeId({
    supabase,
    companyId: appUser.company_id,
    userId: appUser.id,
  });
  const audit = await createAuditLog({
    supabase,
    companyId: appUser.company_id,
    actorUserId: appUser.id,
    actorEmployeeId,
    actionType: "ppe_item.created",
    targetTable: "ppe_items",
    targetId: data.id,
    summary: `Created PPE item "${input.itemName.trim()}".`,
  });
  if (audit.error) return { error: audit.error };

  return { data };
}

export async function updatePPEItem(id: string, input: PPEItemInput) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;

  const { data, error } = await supabase
    .from("ppe_items")
    .update({
      employee_id: input.employeeId,
      item_name: input.itemName.trim(),
      status: input.status,
      fit_notes: input.fitNotes?.trim() || null,
      issued_at: input.issuedAt || null,
      replacement_due_at: input.replacementDueAt || null,
    })
    .eq("company_id", appUser.company_id)
    .eq("id", id)
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (input.status !== "issued") {
    const notification = await createAdminNotifications({
      supabase,
      companyId: appUser.company_id,
      notificationType: "ppe_attention",
      title: "PPE item needs attention",
      body: `${input.itemName.trim()} is marked ${input.status.replace(/_/g, " ")}.`,
      relatedTable: "ppe_items",
      relatedId: id,
      priority: "normal",
    });
    if (notification.error) return { error: notification.error };
  }

  const actorEmployeeId = await getActorEmployeeId({
    supabase,
    companyId: appUser.company_id,
    userId: appUser.id,
  });
  const audit = await createAuditLog({
    supabase,
    companyId: appUser.company_id,
    actorUserId: appUser.id,
    actorEmployeeId,
    actionType: "ppe_item.updated",
    targetTable: "ppe_items",
    targetId: id,
    summary: `Updated PPE item "${input.itemName.trim()}".`,
  });
  if (audit.error) return { error: audit.error };

  return { data };
}

export async function markNotificationRead(notificationId: string) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;

  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("company_id", appUser.company_id)
    .eq("user_id", appUser.id)
    .eq("id", notificationId)
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function markAllNotificationsRead() {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("company_id", appUser.company_id)
    .eq("user_id", appUser.id)
    .eq("is_read", false);

  if (error) return { error: error.message };
  return { data: true };
}

export async function createEstimate(input: EstimateInput) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;
  const officeError = getOfficeAdminRoleError(appUser.role, "manage estimates");
  if (officeError) return { error: officeError };

  const normalizedLineItems = normalizeEstimateLineItems(input.lineItems);
  const subtotal = Number(
    normalizedLineItems.reduce((sum, item) => sum + item.line_total, 0).toFixed(2),
  );

  const { data: estimate, error: estimateError } = await supabase
    .from("estimates")
    .insert({
      company_id: appUser.company_id,
      customer_id: input.customerId,
      job_id: input.jobId || null,
      created_by_user_id: appUser.id,
      title: input.title.trim(),
      status: input.status,
      notes: input.notes?.trim() || null,
      subtotal,
    })
    .select("id")
    .single();

  if (estimateError || !estimate) return { error: estimateError?.message || "Failed to create estimate." };

  if (normalizedLineItems.length > 0) {
    const { error: lineItemsError } = await supabase.from("estimate_line_items").insert(
      normalizedLineItems.map((item) => ({
        company_id: appUser.company_id,
        estimate_id: estimate.id,
        ...item,
      })),
    );

    if (lineItemsError) return { error: lineItemsError.message };
  }

  const actorEmployeeId = await getActorEmployeeId({
    supabase,
    companyId: appUser.company_id,
    userId: appUser.id,
  });
  const audit = await createAuditLog({
    supabase,
    companyId: appUser.company_id,
    actorUserId: appUser.id,
    actorEmployeeId,
    actionType: "estimate.created",
    targetTable: "estimates",
    targetId: estimate.id,
    summary: `Created estimate "${input.title.trim()}".`,
  });
  if (audit.error) return { error: audit.error };

  return { data: estimate };
}

export async function updateEstimate(id: string, input: EstimateInput) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;
  const officeError = getOfficeAdminRoleError(appUser.role, "manage estimates");
  if (officeError) return { error: officeError };

  const normalizedLineItems = normalizeEstimateLineItems(input.lineItems);
  const subtotal = Number(
    normalizedLineItems.reduce((sum, item) => sum + item.line_total, 0).toFixed(2),
  );

  const { data: estimate, error: estimateError } = await supabase
    .from("estimates")
    .update({
      customer_id: input.customerId,
      job_id: input.jobId || null,
      title: input.title.trim(),
      status: input.status,
      notes: input.notes?.trim() || null,
      subtotal,
    })
    .eq("company_id", appUser.company_id)
    .eq("id", id)
    .select("id")
    .single();

  if (estimateError || !estimate) return { error: estimateError?.message || "Failed to update estimate." };

  const { error: deleteError } = await supabase
    .from("estimate_line_items")
    .delete()
    .eq("company_id", appUser.company_id)
    .eq("estimate_id", id);

  if (deleteError) return { error: deleteError.message };

  if (normalizedLineItems.length > 0) {
    const { error: lineItemsError } = await supabase.from("estimate_line_items").insert(
      normalizedLineItems.map((item) => ({
        company_id: appUser.company_id,
        estimate_id: id,
        ...item,
      })),
    );

    if (lineItemsError) return { error: lineItemsError.message };
  }

  const actorEmployeeId = await getActorEmployeeId({
    supabase,
    companyId: appUser.company_id,
    userId: appUser.id,
  });
  const audit = await createAuditLog({
    supabase,
    companyId: appUser.company_id,
    actorUserId: appUser.id,
    actorEmployeeId,
    actionType: "estimate.updated",
    targetTable: "estimates",
    targetId: id,
    summary: `Updated estimate "${input.title.trim()}".`,
  });
  if (audit.error) return { error: audit.error };

  return { data: estimate };
}

export async function createProposal(input: ProposalInput) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;
  const officeError = getOfficeAdminRoleError(appUser.role, "manage proposals");
  if (officeError) return { error: officeError };

  const normalizedSections = normalizeProposalSections(input.sections);

  const { data: proposal, error: proposalError } = await supabase
    .from("proposals")
    .insert({
      company_id: appUser.company_id,
      customer_id: input.customerId,
      job_id: input.jobId || null,
      created_by_user_id: appUser.id,
      title: input.title.trim(),
      status: input.status,
      notes: input.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (proposalError || !proposal) return { error: proposalError?.message || "Failed to create proposal." };

  if (normalizedSections.length > 0) {
    const { error: sectionsError } = await supabase.from("proposal_sections").insert(
      normalizedSections.map((section) => ({
        company_id: appUser.company_id,
        proposal_id: proposal.id,
        ...section,
      })),
    );

    if (sectionsError) return { error: sectionsError.message };
  }

  const actorEmployeeId = await getActorEmployeeId({
    supabase,
    companyId: appUser.company_id,
    userId: appUser.id,
  });
  const audit = await createAuditLog({
    supabase,
    companyId: appUser.company_id,
    actorUserId: appUser.id,
    actorEmployeeId,
    actionType: "proposal.created",
    targetTable: "proposals",
    targetId: proposal.id,
    summary: `Created proposal "${input.title.trim()}".`,
  });
  if (audit.error) return { error: audit.error };

  return { data: proposal };
}

export async function updateProposal(id: string, input: ProposalInput) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;
  const officeError = getOfficeAdminRoleError(appUser.role, "manage proposals");
  if (officeError) return { error: officeError };

  const normalizedSections = normalizeProposalSections(input.sections);

  const { data: proposal, error: proposalError } = await supabase
    .from("proposals")
    .update({
      customer_id: input.customerId,
      job_id: input.jobId || null,
      title: input.title.trim(),
      status: input.status,
      notes: input.notes?.trim() || null,
    })
    .eq("company_id", appUser.company_id)
    .eq("id", id)
    .select("id")
    .single();

  if (proposalError || !proposal) return { error: proposalError?.message || "Failed to update proposal." };

  const { error: deleteError } = await supabase
    .from("proposal_sections")
    .delete()
    .eq("company_id", appUser.company_id)
    .eq("proposal_id", id);

  if (deleteError) return { error: deleteError.message };

  if (normalizedSections.length > 0) {
    const { error: sectionsError } = await supabase.from("proposal_sections").insert(
      normalizedSections.map((section) => ({
        company_id: appUser.company_id,
        proposal_id: id,
        ...section,
      })),
    );

    if (sectionsError) return { error: sectionsError.message };
  }

  const actorEmployeeId = await getActorEmployeeId({
    supabase,
    companyId: appUser.company_id,
    userId: appUser.id,
  });
  const audit = await createAuditLog({
    supabase,
    companyId: appUser.company_id,
    actorUserId: appUser.id,
    actorEmployeeId,
    actionType: "proposal.updated",
    targetTable: "proposals",
    targetId: id,
    summary: `Updated proposal "${input.title.trim()}".`,
  });
  if (audit.error) return { error: audit.error };

  return { data: proposal };
}

export async function createApproval(input: ApprovalInput) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;
  const officeError = getOfficeAdminRoleError(appUser.role, "send approvals");
  if (officeError) return { error: officeError };

  const payload = {
    company_id: appUser.company_id,
    approval_type: input.approvalType,
    proposal_id: input.approvalType === "proposal" ? input.relatedId : null,
    change_order_id: input.approvalType === "change_order" ? input.relatedId : null,
    created_by_user_id: appUser.id,
    status: "sent" as ApprovalStatus,
  };

  const { data: approval, error } = await supabase.from("approvals").insert(payload).select("id").single();
  if (error || !approval) return { error: error?.message || "Failed to create approval." };

  if (input.approvalType === "proposal") {
    const { error: proposalError } = await supabase
      .from("proposals")
      .update({ status: "sent" })
      .eq("company_id", appUser.company_id)
      .eq("id", input.relatedId);

    if (proposalError) return { error: proposalError.message };
  } else {
    const { error: changeOrderError } = await supabase
      .from("change_orders")
      .update({ status: "submitted" })
      .eq("company_id", appUser.company_id)
      .eq("id", input.relatedId);

    if (changeOrderError) return { error: changeOrderError.message };
  }

  const actorEmployeeId = await getActorEmployeeId({
    supabase,
    companyId: appUser.company_id,
    userId: appUser.id,
  });
  const audit = await createAuditLog({
    supabase,
    companyId: appUser.company_id,
    actorUserId: appUser.id,
    actorEmployeeId,
    actionType: "approval.sent",
    targetTable: "approvals",
    targetId: approval.id,
    summary: `Sent ${input.approvalType.replace(/_/g, " ")} approval.`,
  });
  if (audit.error) return { error: audit.error };

  return { data: approval };
}

export async function updateApprovalStatus(input: { approvalId: string; status: ApprovalStatus }) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;
  const officeError = getOfficeAdminRoleError(appUser.role, "update approvals");
  if (officeError) return { error: officeError };

  const { data: approval, error: approvalError } = await supabase
    .from("approvals")
    .select("id, approval_type, proposal_id, change_order_id")
    .eq("company_id", appUser.company_id)
    .eq("id", input.approvalId)
    .single();

  if (approvalError || !approval) return { error: approvalError?.message || "Approval not found." };

  const payload = {
    status: input.status,
    viewed_at: input.status === "viewed" || input.status === "approved" || input.status === "rejected" ? new Date().toISOString() : null,
    decided_at: input.status === "approved" || input.status === "rejected" ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from("approvals")
    .update(payload)
    .eq("company_id", appUser.company_id)
    .eq("id", input.approvalId)
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (approval.approval_type === "proposal" && approval.proposal_id) {
    const proposalStatus =
      input.status === "approved" ? "approved" : input.status === "rejected" ? "rejected" : "sent";
    const { error: proposalError } = await supabase
      .from("proposals")
      .update({ status: proposalStatus })
      .eq("company_id", appUser.company_id)
      .eq("id", approval.proposal_id);

    if (proposalError) return { error: proposalError.message };
  }

  if (approval.approval_type === "change_order" && approval.change_order_id) {
    const changeOrderStatus =
      input.status === "approved" ? "approved" : input.status === "rejected" ? "rejected" : "submitted";
    const { error: changeOrderError } = await supabase
      .from("change_orders")
      .update({ status: changeOrderStatus })
      .eq("company_id", appUser.company_id)
      .eq("id", approval.change_order_id);

    if (changeOrderError) return { error: changeOrderError.message };
  }

  const actorEmployeeId = await getActorEmployeeId({
    supabase,
    companyId: appUser.company_id,
    userId: appUser.id,
  });
  const audit = await createAuditLog({
    supabase,
    companyId: appUser.company_id,
    actorUserId: appUser.id,
    actorEmployeeId,
    actionType: `approval.${input.status}`,
    targetTable: "approvals",
    targetId: input.approvalId,
    summary: `${input.status.charAt(0).toUpperCase()}${input.status.slice(1)} approval.`,
  });
  if (audit.error) return { error: audit.error };

  return { data };
}

export async function refreshJobCostSnapshot(jobId: string) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;

  if (!isOfficeAdminRole(appUser.role)) {
    return { error: "Only owner and office admin users can refresh cost snapshots." };
  }

  const [{ data: job, error: jobError }, { data: timeEntries, error: timeError }, { count: dailyReportCount, error: reportError }, { data: changeOrders, error: changeOrderError }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, contract_value")
      .eq("company_id", appUser.company_id)
      .eq("id", jobId)
      .single(),
    supabase
      .from("time_entries")
      .select("id, total_hours, employees(hourly_rate)")
      .eq("company_id", appUser.company_id)
      .eq("job_id", jobId)
      .not("total_hours", "is", null),
    supabase
      .from("daily_reports")
      .select("id", { count: "exact", head: true })
      .eq("company_id", appUser.company_id)
      .eq("job_id", jobId),
    supabase
      .from("change_orders")
      .select("total_amount, status")
      .eq("company_id", appUser.company_id)
      .eq("job_id", jobId)
      .in("status", ["approved", "executed"]),
  ]);

  if (jobError || !job) return { error: jobError?.message || "Job not found." };
  if (timeError) return { error: timeError.message };
  if (reportError) return { error: reportError.message };
  if (changeOrderError) return { error: changeOrderError.message };

  const actualLaborHours = (timeEntries ?? []).reduce((sum, entry: { total_hours: number | null }) => sum + Number(entry.total_hours || 0), 0);
  const actualLaborCost = (timeEntries ?? []).reduce((sum, entry: { total_hours: number | null; employees: { hourly_rate: number | null }[] | { hourly_rate: number | null } | null }) => {
    const employee = Array.isArray(entry.employees) ? entry.employees[0] : entry.employees;
    return sum + Number(entry.total_hours || 0) * Number(employee?.hourly_rate || 0);
  }, 0);
  const approvedChangeOrderTotal = (changeOrders ?? []).reduce((sum, entry: { total_amount: number | null }) => sum + Number(entry.total_amount || 0), 0);
  const projectedRevenueTotal = Number(job.contract_value || 0) + approvedChangeOrderTotal;

  const payload = {
    company_id: appUser.company_id,
    job_id: jobId,
    snapshot_date: new Date().toISOString().slice(0, 10),
    actual_labor_hours: Number(actualLaborHours.toFixed(2)),
    actual_labor_cost: Number(actualLaborCost.toFixed(2)),
    approved_change_order_total: Number(approvedChangeOrderTotal.toFixed(2)),
    projected_revenue_total: Number(projectedRevenueTotal.toFixed(2)),
    time_entry_count: (timeEntries ?? []).length,
    daily_report_count: dailyReportCount ?? 0,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("job_cost_snapshots")
    .upsert(payload, { onConflict: "company_id,job_id" })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const actorEmployeeId = await getActorEmployeeId({
    supabase,
    companyId: appUser.company_id,
    userId: appUser.id,
  });
  const audit = await createAuditLog({
    supabase,
    companyId: appUser.company_id,
    actorUserId: appUser.id,
    actorEmployeeId,
    actionType: "job_cost_snapshot.refreshed",
    targetTable: "job_cost_snapshots",
    targetId: data.id,
    summary: "Refreshed job cost snapshot.",
  });
  if (audit.error) return { error: audit.error };

  return { data };
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
  const officeError = getOfficeAdminRoleError(appUser.role, "manage employees");
  if (officeError) return { error: officeError };

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
  const officeError = getOfficeAdminRoleError(appUser.role, "manage employees");
  if (officeError) return { error: officeError };

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
  const officeError = getOfficeAdminRoleError(appUser.role, "manage customers");
  if (officeError) return { error: officeError };

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
  const officeError = getOfficeAdminRoleError(appUser.role, "manage customers");
  if (officeError) return { error: officeError };

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

  const actorEmployeeId = await getActorEmployeeId({
    supabase,
    companyId: appUser.company_id,
    userId: appUser.id,
  });
  const audit = await createAuditLog({
    supabase,
    companyId: appUser.company_id,
    actorUserId: appUser.id,
    actorEmployeeId,
    actionType: "job.created",
    targetTable: "jobs",
    targetId: data.id,
    summary: `Created job "${input.jobNumber.trim()} · ${input.name.trim()}".`,
  });
  if (audit.error) return { error: audit.error };

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

  const actorEmployeeId = await getActorEmployeeId({
    supabase,
    companyId: appUser.company_id,
    userId: appUser.id,
  });
  const audit = await createAuditLog({
    supabase,
    companyId: appUser.company_id,
    actorUserId: appUser.id,
    actorEmployeeId,
    actionType: "job.updated",
    targetTable: "jobs",
    targetId: id,
    summary: `Updated job "${input.jobNumber.trim()} · ${input.name.trim()}".`,
  });
  if (audit.error) return { error: audit.error };

  return { data };
}

type ToolboxTalkInput = {
  topic: string;
  talkDate: string;
  foremanEmployeeId?: string;
  notes?: string;
  attendeeEmployeeIds: string[];
};

export async function createToolboxTalk(input: ToolboxTalkInput) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;

  const payload = {
    company_id: appUser.company_id,
    topic: input.topic.trim(),
    talk_date: input.talkDate,
    foreman_employee_id: input.foremanEmployeeId || null,
    notes: input.notes?.trim() || null,
  };

  const { data, error } = await supabase.from("toolbox_talks").insert(payload).select("id").single();
  if (error) return { error: error.message };

  const attendeeEmployeeIds = Array.from(new Set(input.attendeeEmployeeIds.filter(Boolean)));
  if (attendeeEmployeeIds.length > 0) {
    const { error: attendeeError } = await supabase.from("toolbox_talk_attendees").insert(
      attendeeEmployeeIds.map((employeeId) => ({
        company_id: appUser.company_id,
        toolbox_talk_id: data.id,
        employee_id: employeeId,
      })),
    );

    if (attendeeError) return { error: attendeeError.message };
  }

  const actorEmployeeId = await getActorEmployeeId({
    supabase,
    companyId: appUser.company_id,
    userId: appUser.id,
  });
  const audit = await createAuditLog({
    supabase,
    companyId: appUser.company_id,
    actorUserId: appUser.id,
    actorEmployeeId,
    actionType: "toolbox_talk.created",
    targetTable: "toolbox_talks",
    targetId: data.id,
    summary: `Created toolbox talk "${input.topic.trim()}".`,
  });
  if (audit.error) return { error: audit.error };

  return { data };
}

export async function createToolboxTalkAttendee(input: { toolboxTalkId: string; employeeId: string }) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;

  const { data, error } = await supabase
    .from("toolbox_talk_attendees")
    .insert({
      company_id: appUser.company_id,
      toolbox_talk_id: input.toolboxTalkId,
      employee_id: input.employeeId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function updateToolboxTalkAttendeeSignedAt(input: { attendeeId: string; signed: boolean }) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;

  const { data, error } = await supabase
    .from("toolbox_talk_attendees")
    .update({ signed_at: input.signed ? new Date().toISOString() : null })
    .eq("company_id", appUser.company_id)
    .eq("id", input.attendeeId)
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { data };
}

type InviteUserInput = {
  fullName: string;
  email: string;
  phone?: string;
  role: AppRole;
  employeeId?: string;
};

export async function inviteAppUser(input: InviteUserInput) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;

  if (!isOfficeAdminRole(appUser.role)) {
    return { error: "Only owner and office admin users can invite users." };
  }

  if (input.role === "owner") {
    return { error: "Owner access cannot be assigned from this UI." };
  }

  if (!canManageOwnerRole(appUser.role, input.role)) {
    return { error: "Only an owner can invite another owner." };
  }

  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();

  if (!email || !fullName) {
    return { error: "Full name and email are required." };
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    return { error: "Invites are not configured. Set SUPABASE_SERVICE_ROLE_KEY first." };
  }

  const { data: existingUser, error: existingError } = await supabase
    .from("users")
    .select("id, auth_user_id")
    .eq("company_id", appUser.company_id)
    .ilike("email", email)
    .maybeSingle();

  if (existingError) return { error: existingError.message };
  if (existingUser?.auth_user_id) {
    return { error: "A real app user already exists for this email. Edit the existing user instead." };
  }

  const { data: inviteResult, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: getInviteRedirectTo(),
  });

  if (inviteError) return { error: inviteError.message };

  const payload = {
    company_id: appUser.company_id,
    auth_user_id: inviteResult.user?.id ?? null,
    full_name: fullName,
    email,
    phone: input.phone?.trim() || null,
    role: input.role,
    status: "invited" as const,
  };

  const { data: userRecord, error: userError } = existingUser
    ? await supabase
        .from("users")
        .update(payload)
        .eq("company_id", appUser.company_id)
        .eq("id", existingUser.id)
        .select("id")
        .single()
    : await supabase
        .from("users")
        .insert(payload)
        .select("id")
        .single();

  if (userError || !userRecord) {
    return { error: userError?.message || "Could not save the invited user record." };
  }

  const link = await syncEmployeeUserLink({
    supabase,
    companyId: appUser.company_id,
    userId: userRecord.id,
    employeeId: input.employeeId,
  });
  if (link.error) return { error: link.error };

  const actorEmployeeId = await getActorEmployeeId({
    supabase,
    companyId: appUser.company_id,
    userId: appUser.id,
  });
  const audit = await createAuditLog({
    supabase,
    companyId: appUser.company_id,
    actorUserId: appUser.id,
    actorEmployeeId,
    actionType: "user.invited",
    targetTable: "users",
    targetId: userRecord.id,
    summary: `Invited ${email} as ${input.role}.`,
  });
  if (audit.error) return { error: audit.error };

  return { data: userRecord };
}

export async function resendAppUserInvite(userId: string) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;

  if (!isOfficeAdminRole(appUser.role)) {
    return { error: "Only owner and office admin users can resend invites." };
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    return { error: "Invites are not configured. Set SUPABASE_SERVICE_ROLE_KEY first." };
  }

  const { data: managedUser, error } = await supabase
    .from("users")
    .select("id, email, full_name, role")
    .eq("company_id", appUser.company_id)
    .eq("id", userId)
    .single();

  if (error || !managedUser) return { error: error?.message || "User not found." };
  if (!canManageOwnerRole(appUser.role, managedUser.role)) {
    return { error: "Only an owner can resend an owner invite." };
  }

  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(managedUser.email, {
    data: { full_name: managedUser.full_name },
    redirectTo: getInviteRedirectTo(),
  });

  if (inviteError) return { error: inviteError.message };

  const actorEmployeeId = await getActorEmployeeId({
    supabase,
    companyId: appUser.company_id,
    userId: appUser.id,
  });
  const audit = await createAuditLog({
    supabase,
    companyId: appUser.company_id,
    actorUserId: appUser.id,
    actorEmployeeId,
    actionType: "user.invite_resent",
    targetTable: "users",
    targetId: managedUser.id,
    summary: `Resent invite to ${managedUser.email}.`,
  });
  if (audit.error) return { error: audit.error };

  return { data: true };
}

type UpdateManagedUserInput = {
  fullName: string;
  phone?: string;
  role: AppRole;
  status: "invited" | "active" | "inactive";
  employeeId?: string;
};

export async function updateManagedUser(userId: string, input: UpdateManagedUserInput) {
  const auth = await getCurrentAppUser();
  if (auth.error || !auth.appUser) return { error: auth.error || "You must be signed in." };
  const { supabase, appUser } = auth;

  if (!isOfficeAdminRole(appUser.role)) {
    return { error: "Only owner and office admin users can update users." };
  }

  const { data: existingUser, error: existingError } = await supabase
    .from("users")
    .select("id, role, status")
    .eq("company_id", appUser.company_id)
    .eq("id", userId)
    .single();

  if (existingError || !existingUser) return { error: existingError?.message || "User not found." };

  if (input.role === "owner" && existingUser.role !== "owner") {
    return { error: "Owner access cannot be assigned from this UI." };
  }

  const ownerSafety = await ensureOwnerSafety({
    supabase,
    companyId: appUser.company_id,
    currentUserRole: appUser.role,
    existingRole: existingUser.role,
    nextRole: input.role,
    nextStatus: input.status,
    userId,
  });
  if (ownerSafety.error) return { error: ownerSafety.error };

  const { data, error } = await supabase
    .from("users")
    .update({
      full_name: input.fullName.trim(),
      phone: input.phone?.trim() || null,
      role: input.role,
      status: input.status,
    })
    .eq("company_id", appUser.company_id)
    .eq("id", userId)
    .select("id")
    .single();

  if (error || !data) return { error: error?.message || "Failed to update user." };

  const link = await syncEmployeeUserLink({
    supabase,
    companyId: appUser.company_id,
    userId,
    employeeId: input.employeeId,
  });
  if (link.error) return { error: link.error };

  const actorEmployeeId = await getActorEmployeeId({
    supabase,
    companyId: appUser.company_id,
    userId: appUser.id,
  });
  const audit = await createAuditLog({
    supabase,
    companyId: appUser.company_id,
    actorUserId: appUser.id,
    actorEmployeeId,
    actionType: "user.updated",
    targetTable: "users",
    targetId: userId,
    summary: `Updated user access for ${input.fullName.trim()}.`,
  });
  if (audit.error) return { error: audit.error };

  return { data };
}
