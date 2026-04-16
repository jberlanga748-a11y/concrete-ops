import Link from "next/link";
import { notFound } from "next/navigation";
import { EstimateForm } from "@/components/estimates/EstimateForm";
import { getCustomerOptions, getDailyReportJobOptions, getEstimateById, getEstimateLineItems, type EstimateDetailRow } from "@/lib/db/queries";

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

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
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
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">{estimate.title}</h1>
            <p className="mt-2 text-zinc-600">
              {[estimate.status, customer?.name, job ? `${job.job_number} · ${job.name}` : null].filter(Boolean).join(" · ")}
            </p>
          </div>
          <Link href="/dashboard/estimates" className="rounded-xl border px-4 py-2 text-sm">
            Back to Estimates
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Customer</h2>
          <p className="mt-2">{customer?.name || "—"}</p>
          <p className="mt-1 text-sm text-zinc-600">
            {[customer?.contact_name, customer?.phone, customer?.email].filter(Boolean).join(" · ") || "No contact details"}
          </p>
        </section>
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Subtotal</h2>
          <p className="mt-2 text-2xl font-semibold">{estimate.subtotal.toFixed(2)}</p>
        </section>
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Created</h2>
          <p className="mt-2 text-sm text-zinc-700">{formatDateTime(estimate.created_at)}</p>
          <p className="mt-1 text-sm text-zinc-600">{creator?.full_name || "—"}</p>
        </section>
      </div>

      <EstimateForm estimate={estimate} lineItems={lineItems ?? []} customerOptions={customerOptions} jobOptions={jobOptions} />
    </div>
  );
}
