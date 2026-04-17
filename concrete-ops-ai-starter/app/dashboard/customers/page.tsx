import Link from "next/link";
import { CustomerTable } from "@/components/customers/CustomerTable";
import { ErrorPanel } from "@/components/ui/feedback";
import { TableToolbar } from "@/components/ui/table";
import { getCustomers } from "@/lib/db/queries";

export default async function CustomersPage() {
  const { data, error } = await getCustomers();
  const customers = data ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Office</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">Customers</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600">
              Keep customer contacts and account status organized so jobs, proposals, and change orders all point back to a clean source record.
            </p>
          </div>
          <Link
            href="/dashboard/customers/new"
            className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(249,115,22,0.28)] transition hover:bg-orange-400"
          >
            New Customer
          </Link>
        </div>
      </div>

      {error ? (
        <ErrorPanel
          title="We couldn’t load customers right now"
          description="The customer list is temporarily unavailable. Try refreshing the page or come back in a moment."
          actionHref="/dashboard/customers"
          actionLabel="Try again"
        />
      ) : (
        <CustomerTable
          customers={customers}
          toolbar={
            <TableToolbar
              title="Customer list"
              description="Review customer contact details, account status, and quick edit actions from one place."
              countLabel={`${customers.length} customer${customers.length === 1 ? "" : "s"}`}
              actions={
                <Link
                  href="/dashboard/customers/new"
                  className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:border-orange-300 hover:bg-orange-50"
                >
                  Add customer
                </Link>
              }
            />
          }
        />
      )}
    </div>
  );
}
