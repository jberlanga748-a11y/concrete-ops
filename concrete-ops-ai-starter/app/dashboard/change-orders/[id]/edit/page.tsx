import Link from "next/link";
import { notFound } from "next/navigation";
import { ChangeOrderForm } from "@/components/change-orders/ChangeOrderForm";
import { KpiTile, PageHeader } from "@/components/ui/page-primitives";
import {
  getChangeOrderById,
  getChangeOrderFiles,
  getChangeOrderLineItems,
  getDailyReportJobOptions,
  getDailyReportOptions,
  getJobFiles,
} from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";

export default async function EditChangeOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: appUser } = user
    ? await supabase.from("users").select("role").eq("auth_user_id", user.id).maybeSingle()
    : { data: null };
  const isForeman = appUser?.role === "foreman";

  const [{ data: changeOrder }, { data: lineItems }, jobOptions, dailyReportOptions, { data: proofFiles }, { data: linkedFiles }] =
    await Promise.all([
      getChangeOrderById(id),
      getChangeOrderLineItems(id),
      getDailyReportJobOptions(),
      getDailyReportOptions(),
      getJobFiles(),
      getChangeOrderFiles(id),
    ]);

  if (!changeOrder) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="Change Orders"
        title="Update Change Order"
        description="Adjust scope, pricing, status, and linked field proof without recreating the record."
        actions={
          <Link href={`/dashboard/change-orders/${changeOrder.id}`} className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-blue-50">
            Back to Change Order
          </Link>
        }
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <KpiTile label="Status" value={changeOrder.status} helper="Current lifecycle state." />
          <KpiTile label="Line items" value={String((lineItems ?? []).length)} helper="Cost rows currently attached." />
          <KpiTile label="Proof files" value={String((linkedFiles ?? []).length)} helper="Files currently linked to this change." />
        </div>

        <ChangeOrderForm
          changeOrderId={changeOrder.id}
          jobOptions={jobOptions}
          dailyReportOptions={dailyReportOptions}
          proofFiles={proofFiles ?? []}
          hideFinancials={isForeman}
          initialValues={changeOrder}
          initialProofFileIds={(linkedFiles ?? []).map((file) => file.job_file_id)}
          initialLineItems={lineItems ?? []}
        />
      </div>
    </div>
  );
}
