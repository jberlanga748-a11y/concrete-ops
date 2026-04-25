import Link from "next/link";
import { ChangeOrderForm } from "@/components/change-orders/ChangeOrderForm";
import { KpiTile, PageHeader } from "@/components/ui/page-primitives";
import { getDailyReportJobOptions, getDailyReportOptions, getJobFiles } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";

export default async function NewChangeOrderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: appUser } = user
    ? await supabase.from("users").select("role").eq("auth_user_id", user.id).maybeSingle()
    : { data: null };
  const isForeman = appUser?.role === "foreman";

  const [jobOptions, dailyReportOptions, { data: proofFiles }] = await Promise.all([
    getDailyReportJobOptions(),
    getDailyReportOptions(),
    getJobFiles(),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Change Orders"
        title="Create Change Order"
        description="Link to job, optional daily report, and optional field proof uploads."
        actions={
          <Link href="/dashboard/change-orders" className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-blue-50">
            Back to Change Orders
          </Link>
        }
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <KpiTile label="Jobs" value={String(jobOptions.length)} helper="Available projects for change orders." />
          <KpiTile label="Daily reports" value={String(dailyReportOptions.length)} helper="Optional field records to connect." />
          <KpiTile label="Proof files" value={String((proofFiles ?? []).length)} helper="Uploads available for supporting proof." />
        </div>
        <ChangeOrderForm jobOptions={jobOptions} dailyReportOptions={dailyReportOptions} proofFiles={proofFiles ?? []} hideFinancials={isForeman} />
      </div>
    </div>
  );
}
