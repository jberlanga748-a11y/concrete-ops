import Link from "next/link";
import type { EmployeeListRow } from "@/lib/db/queries";
import { DataTable, EmptyState, tableCellClassName } from "@/components/ui/primitives";

function formatDate(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
}

export function EmployeeTable({ employees }: { employees: EmployeeListRow[] }) {
  if (employees.length === 0) {
    return (
      <EmptyState
        title="No employees yet"
        description="Add the field team here so assignments, daily reports, toolbox talks, and PPE tracking all have real people to work with."
        action={<Link href="/dashboard/employees/new" className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white">New Employee</Link>}
      />
    );
  }

  return (
    <DataTable
      headers={["Employee", "Crew", "Title", "Status", "Hire Date"]}
      emptyState={null}
      mobileCards={
        <div className="space-y-3">
          {employees.map((employee) => (
            <Link key={employee.id} href={`/dashboard/employees/${employee.id}`} className="block rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-lg font-semibold text-zinc-950">{employee.full_name}</p>
              <p className="mt-2 text-sm text-zinc-600">{employee.job_title || "No title"} · {employee.crew_name || "No crew"}</p>
              <p className="mt-1 text-sm text-zinc-500">{employee.email || employee.phone || "No contact info"}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-700">{employee.is_active ? "Active" : "Inactive"}</span>
                <span className="text-xs text-zinc-500">{formatDate(employee.hire_date)}</span>
              </div>
            </Link>
          ))}
        </div>
      }
    >
      {employees.map((employee) => (
        <tr key={employee.id} className="border-t border-zinc-200 transition hover:bg-zinc-50">
          <td className={tableCellClassName}>
            <Link href={`/dashboard/employees/${employee.id}`} className="font-medium hover:underline">
              {employee.full_name}
            </Link>
            <p className="mt-1 text-xs text-zinc-500">{employee.email || employee.phone || "No contact info"}</p>
          </td>
          <td className={tableCellClassName}>{employee.crew_name || "—"}</td>
          <td className={tableCellClassName}>{employee.job_title || "—"}</td>
          <td className={tableCellClassName}>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-700">
              {employee.is_active ? "Active" : "Inactive"}
            </span>
          </td>
          <td className={tableCellClassName}>{formatDate(employee.hire_date)}</td>
        </tr>
      ))}
    </DataTable>
  );
}
