import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "job-uploads";

function sanitizeFileName(fileName: string) {
  return fileName.toLowerCase().replace(/[^a-z0-9.\-_]+/g, "-");
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const jobId = String(form.get("jobId") || "").trim();
  const dailyReportIdRaw = String(form.get("dailyReportId") || "").trim();
  const tag = String(form.get("tag") || "").trim();
  const note = String(form.get("note") || "").trim();
  const file = form.get("file");

  if (!jobId || !tag || !(file instanceof File)) {
    return NextResponse.json({ error: "Job, tag, and file are required." }, { status: 400 });
  }

  const { data: appUser, error: appUserError } = await supabase
    .from("users")
    .select("id, company_id")
    .eq("auth_user_id", authData.user.id)
    .single();

  if (appUserError || !appUser) {
    return NextResponse.json({ error: "Could not resolve app user." }, { status: 400 });
  }

  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("company_id", appUser.company_id)
    .eq("user_id", appUser.id)
    .maybeSingle();

  const safeName = sanitizeFileName(file.name);
  const storagePath = `${appUser.company_id}/${jobId}/${Date.now()}-${safeName}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  const { error: insertError } = await supabase.from("job_files").insert({
    company_id: appUser.company_id,
    job_id: jobId,
    daily_report_id: dailyReportIdRaw || null,
    uploaded_by_user_id: appUser.id,
    uploaded_by_employee_id: employee?.id ?? null,
    file_name: file.name,
    file_type: file.type || "application/octet-stream",
    storage_path: storagePath,
    tag,
    note: note || null,
  });

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
