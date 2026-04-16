import Link from "next/link";
import type { EmployeeListRow } from "@/lib/db/queries";
import { EmptyState, tableCellClassName, tableHeaderClassName, tableShellClassName } from "@/components/ui/primitives";

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
    <div className={tableShellClassName}>
      <table className="w-full text-sm">
        <thead className={tableHeaderClassName}>
          <tr>
            <th className="px-4 py-3 text-left">Employee</th>
            <th className="px-4 py-3 text-left">Crew</th>
            <th className="px-4 py-3 text-left">Title</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Hire Date</th>
          </tr>
        </thead>
        <tbody>
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
        </tbody>
      </table>
    </div>
  );
}
