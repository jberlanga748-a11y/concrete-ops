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

  const { data, error } = await supabase
    .from("time_entries")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

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

  if (input.jobId) {
    openEntryQuery = openEntryQuery.eq("job_id", input.jobId);
  }

  const { data: openEntries, error: openEntryError } = await openEntryQuery;

  if (openEntryError) {
    return { error: openEntryError.message };
  }

  const openEntry = openEntries?.[0];

  if (!openEntry) {
    return { error: "No open time entry found for this employee." };
  }

  const nowIso = new Date().toISOString();
  const elapsedMs = new Date(nowIso).getTime() - new Date(openEntry.clock_in_at).getTime();
  const breakMs = (openEntry.break_minutes ?? 0) * 60 * 1000;
  const totalHours = Math.max(0, (elapsedMs - breakMs) / 1000 / 60 / 60);

  const { error: updateError } = await supabase
    .from("time_entries")
    .update({
      clock_out_at: nowIso,
      total_hours: Number(totalHours.toFixed(2)),
      status: "clocked_out",
    })
    .eq("id", openEntry.id);

  if (updateError) {
    return { error: updateError.message };
  }

  return { data: { id: openEntry.id } };
}
