import { NextResponse } from "next/server";
import { getDocumentById } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: document } = await getDocumentById(id);
  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const { data: signedUrl, error } = await supabase.storage
    .from(document.storage_bucket)
    .createSignedUrl(document.storage_path, 60);

  if (error || !signedUrl?.signedUrl) {
    return NextResponse.json({ error: error?.message || "Could not open document." }, { status: 400 });
  }

  return NextResponse.redirect(signedUrl.signedUrl);
}
