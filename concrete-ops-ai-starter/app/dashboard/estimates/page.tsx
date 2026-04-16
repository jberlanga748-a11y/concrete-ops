import Link from "next/link";
import { getEstimates, type EstimateListRow } from "@/lib/db/queries";

function getCustomer(customers: EstimateListRow["customers"]) {
  if (!customers) return "—";
  if (Array.isArray(customers)) return customers[0]?.name ?? "—";
  return customers.name;
}

function getJob(jobs: EstimateListRow["jobs"]) {
  if (!jobs) return "—";
  if (Array.isArray(jobs)) {
    const job = jobs[0];
    return job ? `${job.job_number} · ${job.name}` : "—";
  }
  return `${jobs.job_number} · ${jobs.name}`;
}

export default async function EstimatesPage() {
  const { data: estimates } = await getEstimates();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Estimates</h1>
            <p className="mt-2 text-zinc-600">Build and track estimate scope with practical labor, material, and equipment line items.</p>
          </div>
          <Link href="/dashboard/estimates/new" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white">
            New Estimate
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Job</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Subtotal</th>
              <th className="px-4 py-3 text-left">Open</th>
            </tr>
          </thead>
          <tbody>
            {(estimates ?? []).map((estimate) => (
              <tr key={estimate.id} className="border-t">
                <td className="px-4 py-4">{estimate.title}</td>
                <td className="px-4 py-4">{getCustomer(estimate.customers)}</td>
                <td className="px-4 py-4">{getJob(estimate.jobs)}</td>
                <td className="px-4 py-4">{estimate.status}</td>
                <td className="px-4 py-4">{estimate.subtotal.toFixed(2)}</td>
                <td className="px-4 py-4">
                  <Link href={`/dashboard/estimates/${estimate.id}`} className="underline">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {(estimates ?? []).length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-zinc-600" colSpan={6}>
                  No estimates created yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
