import { NextResponse } from "next/server";
import { z } from "zod";
import { sendRecordEmail } from "@/lib/email/sendRecordEmail";
import { buildExportPdf } from "@/lib/exports/recordDocuments";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  recordType: z.enum(["proposal", "change_order", "daily_report"]),
  recordId: z.string().uuid(),
  to: z.string().email(),
  subject: z.string().min(1),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request." }, { status: 400 });
  }

  const document = await buildExportPdf(parsed.data.recordType, parsed.data.recordId);
  if (!document) {
    return NextResponse.json({ error: "Record not found." }, { status: 404 });
  }

  const result = await sendRecordEmail({
    to: parsed.data.to,
    subject: parsed.data.subject,
    fileName: document.fileName,
    pdf: document.pdf,
    recordType: parsed.data.recordType,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
