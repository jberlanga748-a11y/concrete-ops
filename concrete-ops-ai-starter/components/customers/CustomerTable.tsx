import Link from "next/link";
import type { CustomerListRow } from "@/lib/db/queries";
import { EmptyState, tableCellClassName, tableHeaderClassName, tableShellClassName } from "@/components/ui/primitives";

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
    <div className={tableShellClassName}>
      <table className="w-full text-sm">
        <thead className={tableHeaderClassName}>
          <tr>
            <th className="px-4 py-3 text-left">Customer</th>
            <th className="px-4 py-3 text-left">Primary Contact</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Created</th>
          </tr>
        </thead>
        <tbody>
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
        </tbody>
      </table>
    </div>
  );
}
