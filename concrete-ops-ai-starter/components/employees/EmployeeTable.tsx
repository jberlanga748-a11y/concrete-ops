import Link from "next/link";
import type { EmployeeListRow } from "@/lib/db/queries";
import { DataTable, EmptyState, StatusPill, primaryButtonClassName, tableCellClassName } from "@/components/ui/primitives";

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
          action={<Link href="/dashboard/employees/new" className={primaryButtonClassName}>New Employee</Link>}
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
            <Link key={employee.id} href={`/dashboard/employees/${employee.id}`} className="block rounded-[28px] border border-zinc-200/80 bg-white/95 p-4 shadow-[0_16px_36px_rgba(24,24,27,0.08)] transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_20px_42px_rgba(24,24,27,0.12)]">
              <p className="text-lg font-semibold text-zinc-950">{employee.full_name}</p>
              <p className="mt-2 text-sm text-zinc-600">{employee.job_title || "No title"} · {employee.crew_name || "No crew"}</p>
              <p className="mt-1 text-sm text-zinc-500">{employee.email || employee.phone || "No contact info"}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <StatusPill tone={employee.is_active ? "success" : "neutral"}>{employee.is_active ? "Active" : "Inactive"}</StatusPill>
                <span className="text-xs text-zinc-500">{formatDate(employee.hire_date)}</span>
              </div>
            </Link>
          ))}
        </div>
      }
    >
      {employees.map((employee) => (
        <tr key={employee.id} className="border-t border-zinc-200 transition hover:bg-orange-50/50">
          <td className={tableCellClassName}>
            <Link href={`/dashboard/employees/${employee.id}`} className="font-medium text-zinc-900 hover:text-orange-600 hover:underline">
              {employee.full_name}
            </Link>
            <p className="mt-1 text-xs text-zinc-500">{employee.email || employee.phone || "No contact info"}</p>
          </td>
          <td className={tableCellClassName}>{employee.crew_name || "—"}</td>
          <td className={tableCellClassName}>{employee.job_title || "—"}</td>
          <td className={tableCellClassName}>
            <StatusPill tone={employee.is_active ? "success" : "neutral"}>{employee.is_active ? "Active" : "Inactive"}</StatusPill>
          </td>
          <td className={tableCellClassName}>{formatDate(employee.hire_date)}</td>
        </tr>
      ))}
    </DataTable>
  );
}
