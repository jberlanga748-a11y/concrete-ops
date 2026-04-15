"use server";

import { createClient } from "@/lib/supabase/server";

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
};

export async function createDailyReport(input: DailyReportInput) {
  const supabase = await createClient();
  const { data: authResult, error: authError } = await supabase.auth.getUser();
  if (authError || !authResult.user) return { error: "You must be signed in to submit a daily report." };

  const { data: appUser, error: appUserError } = await supabase.from("users").select("id, company_id").eq("auth_user_id", authResult.user.id).single();
  if (appUserError || !appUser) return { error: "Could not resolve your app user record." };

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
  const supabase = await createClient();
  const { data: authResult, error: authError } = await supabase.auth.getUser();
  if (authError || !authResult.user) return { error: "You must be signed in." };

  const { data: appUser, error: appUserError } = await supabase.from("users").select("id, company_id").eq("auth_user_id", authResult.user.id).single();
  if (appUserError || !appUser) return { error: "Could not resolve your app user record." };

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
