import Link from "next/link";
import { getPPEItems, type PPEItemRow } from "@/lib/db/queries";
import { formatDateOnly } from "@/lib/time/formatting";

function getEmployee(employee: PPEItemRow["employees"]) {
  if (!employee) return null;
  if (Array.isArray(employee)) return employee[0] ?? null;
  return employee;
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

export default async function PPEPage() {
  const { data: items } = await getPPEItems();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">PPE Tracking</h1>
            <p className="mt-2 text-zinc-600">Track issued PPE, fit checks, and replacement timing across the crew.</p>
          </div>
          <Link href="/dashboard/ppe/new" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white">
            New PPE Item
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100">
            <tr>
              <th className="px-4 py-3 text-left">Employee</th>
              <th className="px-4 py-3 text-left">Item</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Issued</th>
              <th className="px-4 py-3 text-left">Replacement Due</th>
              <th className="px-4 py-3 text-left">Open</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((item) => {
              const employee = getEmployee(item.employees);
              return (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-4">
                    <div>
                      <p>{employee?.full_name || "Employee"}</p>
                      <p className="text-xs text-zinc-500">{[employee?.job_title, employee?.crew_name].filter(Boolean).join(" · ") || "—"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">{item.item_name}</td>
                  <td className="px-4 py-4 capitalize">{formatLabel(item.status)}</td>
                  <td className="px-4 py-4">{formatDateOnly(item.issued_at)}</td>
                  <td className="px-4 py-4">{formatDateOnly(item.replacement_due_at)}</td>
                  <td className="px-4 py-4">
                    <Link href={`/dashboard/ppe/${item.id}`} className="underline">
                      Open
                    </Link>
                  </td>
                </tr>
              );
            })}
            {(items ?? []).length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-zinc-600" colSpan={6}>
                  No PPE items tracked yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
