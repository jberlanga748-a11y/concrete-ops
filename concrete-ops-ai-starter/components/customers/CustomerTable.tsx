import Link from "next/link";
import type { CustomerListRow } from "@/lib/db/queries";

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
}

export function CustomerTable({ customers }: { customers: CustomerListRow[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-zinc-100">
          <tr>
            <th className="px-4 py-3 text-left">Customer</th>
            <th className="px-4 py-3 text-left">Primary Contact</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Created</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className="border-t">
              <td className="px-4 py-4">
                <Link href={`/dashboard/customers/${customer.id}`} className="font-medium hover:underline">
                  {customer.name}
                </Link>
                <p className="mt-1 text-xs text-zinc-500">{customer.email || customer.phone || "No contact info"}</p>
              </td>
              <td className="px-4 py-4">{customer.contact_name || "—"}</td>
              <td className="px-4 py-4">{customer.status}</td>
              <td className="px-4 py-4">{formatDate(customer.created_at)}</td>
            </tr>
          ))}
          {customers.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-zinc-600" colSpan={4}>
                No customers found yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
