import Link from "next/link";
import { notFound } from "next/navigation";
import { ChangeOrderForm } from "@/components/change-orders/ChangeOrderForm";
import {
  getChangeOrderById,
  getChangeOrderFiles,
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

  const [{ data: changeOrder }, jobOptions, dailyReportOptions, { data: proofFiles }, { data: linkedFiles }] =
    await Promise.all([
      getChangeOrderById(id),
      getDailyReportJobOptions(),
      getDailyReportOptions(),
      getJobFiles(),
      getChangeOrderFiles(id),
    ]);

  if (!changeOrder) notFound();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Update Change Order</h1>
            <p className="mt-2 text-zinc-600">Adjust scope, pricing, status, and linked field proof without recreating the record.</p>
          </div>
          <Link href={`/dashboard/change-orders/${changeOrder.id}`} className="rounded-xl border px-4 py-2 text-sm">
            Back to Change Order
          </Link>
        </div>
      </div>

      <ChangeOrderForm
        changeOrderId={changeOrder.id}
        jobOptions={jobOptions}
        dailyReportOptions={dailyReportOptions}
        proofFiles={proofFiles ?? []}
        hideFinancials={isForeman}
        initialValues={changeOrder}
        initialProofFileIds={(linkedFiles ?? []).map((file) => file.job_file_id)}
      />
    </div>
  );
}
