import Link from "next/link";
import { CustomerTable } from "@/components/customers/CustomerTable";
import { getCustomers } from "@/lib/db/queries";

export default async function CustomersPage() {
  const { data, error } = await getCustomers();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Customers</h1>
            <p className="mt-2 text-zinc-600">Keep customer contacts and billing notes organized for the jobs you manage.</p>
          </div>
          <Link href="/dashboard/customers/new" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white">
            New Customer
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-700">{error.message}</div>
      ) : (
        <CustomerTable customers={data ?? []} />
      )}
    </div>
  );
}
