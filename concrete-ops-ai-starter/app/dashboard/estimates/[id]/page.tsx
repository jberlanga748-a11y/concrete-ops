import Link from "next/link";
import { notFound } from "next/navigation";
import { EstimateForm } from "@/components/estimates/EstimateForm";
import { KpiTile, PageHeader, RecordPreview } from "@/components/ui/page-primitives";
import { getCustomerOptions, getDailyReportJobOptions, getEstimateById, getEstimateLineItems, type EstimateDetailRow } from "@/lib/db/queries";
import { formatTimestamp } from "@/lib/time/formatting";

function getCustomer(customer: EstimateDetailRow["customers"]) {
  if (!customer) return null;
  if (Array.isArray(customer)) return customer[0] ?? null;
  return customer;
}

function getJob(job: EstimateDetailRow["jobs"]) {
  if (!job) return null;
  if (Array.isArray(job)) return job[0] ?? null;
  return job;
}

function getCreator(user: EstimateDetailRow["users"]) {
  if (!user) return null;
  if (Array.isArray(user)) return user[0] ?? null;
  return user;
}

export default async function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ data: estimate }, { data: lineItems }, customerOptions, jobOptions] = await Promise.all([
    getEstimateById(id),
    getEstimateLineItems(id),
    getCustomerOptions(true),
    getDailyReportJobOptions(),
  ]);

  if (!estimate) notFound();

  const customer = getCustomer(estimate.customers);
  const job = getJob(estimate.jobs);
  const creator = getCreator(estimate.users);

  return (
    <div>
      <PageHeader
        eyebrow="Estimate"
        title={estimate.title}
        description={[estimate.status, customer?.name, job ? `${job.job_number} · ${job.name}` : null].filter(Boolean).join(" · ")}
        actions={
          <Link href="/dashboard/estimates" className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-blue-50">
            Back to Estimates
          </Link>
        }
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-4 md:grid-cols-2">
            <KpiTile label="Subtotal" value={estimate.subtotal.toFixed(2)} helper="Current estimate line-item total." />
            <KpiTile label="Status" value={estimate.status} helper="Pricing workflow state." />
          </div>
          <RecordPreview
            title={customer?.name || "Customer"}
            rows={[
              ["Contact", [customer?.contact_name, customer?.phone, customer?.email].filter(Boolean).join(" · ") || "No contact details"],
              ["Job", job ? `${job.job_number} · ${job.name}` : "—"],
              ["Created", formatTimestamp(estimate.created_at)],
              ["Owner", creator?.full_name || "—"],
            ]}
          />
        </div>

        <EstimateForm estimate={estimate} lineItems={lineItems ?? []} customerOptions={customerOptions} jobOptions={jobOptions} />
      </div>
    </div>
  );
}
