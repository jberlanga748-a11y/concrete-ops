import Link from "next/link";
import type { CustomerListRow } from "@/lib/db/queries";
import { DataTable, EmptyState, tableCellClassName } from "@/components/ui/primitives";

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
}

export function CustomerTable({ customers }: { customers: CustomerListRow[] }) {
  if (customers.length === 0) {
    return (
      <EmptyState
        title="No customers yet"
        description="Add a customer to start creating jobs, proposals, and estimates with real contact information."
        action={<Link href="/dashboard/customers/new" className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white">New Customer</Link>}
      />
    );
  }

  return (
    <DataTable
      headers={["Customer", "Primary Contact", "Status", "Created"]}
      emptyState={null}
      mobileCards={
        <div className="space-y-3">
          {customers.map((customer) => (
            <Link key={customer.id} href={`/dashboard/customers/${customer.id}`} className="block rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-lg font-semibold text-zinc-950">{customer.name}</p>
              <p className="mt-2 text-sm text-zinc-600">{customer.contact_name || "No primary contact"}</p>
              <p className="mt-1 text-sm text-zinc-500">{customer.email || customer.phone || "No contact info"}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-700">{customer.status}</span>
                <span className="text-xs text-zinc-500">{formatDate(customer.created_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      }
    >
      {customers.map((customer) => (
        <tr key={customer.id} className="border-t border-zinc-200 transition hover:bg-zinc-50">
          <td className={tableCellClassName}>
            <Link href={`/dashboard/customers/${customer.id}`} className="font-medium hover:underline">
              {customer.name}
            </Link>
            <p className="mt-1 text-xs text-zinc-500">{customer.email || customer.phone || "No contact info"}</p>
          </td>
          <td className={tableCellClassName}>{customer.contact_name || "—"}</td>
          <td className={tableCellClassName}>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-700">{customer.status}</span>
          </td>
          <td className={tableCellClassName}>{formatDate(customer.created_at)}</td>
        </tr>
      ))}
    </DataTable>
  );
}
