import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEmployeeUploadAccessFromClient } from "@/lib/uploads/employeeAccess";

const BUCKET = "job-uploads";

function sanitizeFileName(fileName: string) {
  return fileName.toLowerCase().replace(/[^a-z0-9.\-_]+/g, "-");
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const form = await request.formData();
  const jobId = String(form.get("jobId") || "").trim();
  const dailyReportIdRaw = String(form.get("dailyReportId") || "").trim();
  const tag = String(form.get("tag") || "").trim();
  const note = String(form.get("note") || "").trim();
  const file = form.get("file");

  if (!jobId || !tag || !(file instanceof File)) {
    return NextResponse.json({ error: "Job, tag, and file are required." }, { status: 400 });
  }

  const accessResult = await getEmployeeUploadAccessFromClient(supabase);
  if (accessResult.error || !accessResult.data) {
    return NextResponse.json(
      { error: accessResult.error || "Unauthorized" },
      { status: accessResult.error === "Unauthorized" ? 401 : 403 },
    );
  }

  const { appUserId, companyId, employeeId, assignedJobIds } = accessResult.data;

  if (!assignedJobIds.includes(jobId)) {
    return NextResponse.json({ error: "You can only upload to jobs assigned to you." }, { status: 403 });
  }

  if (dailyReportIdRaw) {
    const { data: dailyReport, error: dailyReportError } = await supabase
      .from("daily_reports")
      .select("id")
      .eq("company_id", companyId)
      .eq("job_id", jobId)
      .eq("id", dailyReportIdRaw)
      .maybeSingle();

    if (dailyReportError || !dailyReport) {
      return NextResponse.json(
        { error: dailyReportError?.message || "The selected daily report is not available for this upload." },
        { status: 403 },
      );
    }
  }

  const safeName = sanitizeFileName(file.name);
  const storagePath = `${companyId}/${jobId}/${Date.now()}-${safeName}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  const { error: insertError } = await supabase.from("job_files").insert({
    company_id: companyId,
    job_id: jobId,
    daily_report_id: dailyReportIdRaw || null,
    uploaded_by_user_id: appUserId,
    uploaded_by_employee_id: employeeId,
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

  const { data: jobFile, error: jobFileError } = await supabase
    .from("job_files")
    .select("id")
    .eq("company_id", companyId)
    .eq("storage_path", storagePath)
    .single();

  if (jobFileError || !jobFile) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json({ error: jobFileError?.message || "Upload metadata was not created." }, { status: 400 });
  }

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .insert({
      company_id: companyId,
      source_job_file_id: jobFile.id,
      job_id: jobId,
      daily_report_id: dailyReportIdRaw || null,
      uploaded_by_user_id: appUserId,
      uploaded_by_employee_id: employeeId,
      file_name: file.name,
      file_type: file.type || "application/octet-stream",
      storage_bucket: BUCKET,
      storage_path: storagePath,
      file_size_bytes: file.size,
      tag,
      note: note || null,
    })
    .select("id")
    .single();

  if (documentError || !document) {
    await supabase.from("job_files").delete().eq("company_id", companyId).eq("id", jobFile.id);
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json({ error: documentError?.message || "Document record was not created." }, { status: 400 });
  }

  const documentLinks = [
    { company_id: companyId, document_id: document.id, link_type: "job", linked_record_id: jobId },
    ...(dailyReportIdRaw
      ? [{ company_id: companyId, document_id: document.id, link_type: "daily_report", linked_record_id: dailyReportIdRaw }]
      : []),
  ];

  const { error: linkError } = await supabase.from("document_links").insert(documentLinks);

  if (linkError) {
    await supabase.from("documents").delete().eq("company_id", companyId).eq("id", document.id);
    await supabase.from("job_files").delete().eq("company_id", companyId).eq("id", jobFile.id);
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json({ error: linkError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
