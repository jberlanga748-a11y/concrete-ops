import { NextResponse } from "next/server";
import { buildExportPdf } from "@/lib/exports/recordDocuments";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const document = await buildExportPdf("change_order", id);
  if (!document) {
    return NextResponse.json({ error: "Change order not found." }, { status: 404 });
  }

  return new NextResponse(document.pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${document.fileName}"`,
    },
  });
}
