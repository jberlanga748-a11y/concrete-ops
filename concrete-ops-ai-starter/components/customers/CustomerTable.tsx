import Link from "next/link";
import type { CustomerListRow } from "@/lib/db/queries";
import { DataTable, EmptyState, StatusPill, primaryButtonClassName, tableCellClassName } from "@/components/ui/primitives";

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
          action={<Link href="/dashboard/customers/new" className={primaryButtonClassName}>New Customer</Link>}
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
            <Link key={customer.id} href={`/dashboard/customers/${customer.id}`} className="block rounded-[28px] border border-zinc-200/80 bg-white/95 p-4 shadow-[0_16px_36px_rgba(24,24,27,0.08)] transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_20px_42px_rgba(24,24,27,0.12)]">
              <p className="text-lg font-semibold text-zinc-950">{customer.name}</p>
              <p className="mt-2 text-sm text-zinc-600">{customer.contact_name || "No primary contact"}</p>
              <p className="mt-1 text-sm text-zinc-500">{customer.email || customer.phone || "No contact info"}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <StatusPill tone="info">{customer.status}</StatusPill>
                <span className="text-xs text-zinc-500">{formatDate(customer.created_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      }
    >
      {customers.map((customer) => (
        <tr key={customer.id} className="border-t border-zinc-200 transition hover:bg-orange-50/50">
          <td className={tableCellClassName}>
            <Link href={`/dashboard/customers/${customer.id}`} className="font-medium text-zinc-900 hover:text-orange-600 hover:underline">
              {customer.name}
            </Link>
            <p className="mt-1 text-xs text-zinc-500">{customer.email || customer.phone || "No contact info"}</p>
          </td>
          <td className={tableCellClassName}>{customer.contact_name || "—"}</td>
          <td className={tableCellClassName}>
            <StatusPill tone="info">{customer.status}</StatusPill>
          </td>
          <td className={tableCellClassName}>{formatDate(customer.created_at)}</td>
        </tr>
      ))}
    </DataTable>
  );
}
