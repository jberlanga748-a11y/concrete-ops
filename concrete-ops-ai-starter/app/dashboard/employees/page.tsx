import Link from "next/link";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { ErrorPanel } from "@/components/ui/feedback";
import { TableToolbar } from "@/components/ui/table";
import { getEmployees } from "@/lib/db/queries";

export default async function EmployeesPage() {
  const { data, error } = await getEmployees();
  const employees = data ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Admin</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">Employees</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600">
              Keep employee records clean for job assignments, time tracking, daily reports, and compliance without exposing payroll settings broadly.
            </p>
          </div>
          <Link
            href="/dashboard/employees/new"
            className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(249,115,22,0.28)] transition hover:bg-orange-400"
          >
            New Employee
          </Link>
        </div>
      </div>

      {error ? (
        <ErrorPanel
          title="We couldn’t load employees right now"
          description="The employee roster is temporarily unavailable. Try refreshing the page or check back in a moment."
          actionHref="/dashboard/employees"
          actionLabel="Try again"
        />
      ) : (
        <EmployeeTable
          employees={employees}
          toolbar={
            <TableToolbar
              title="Employee roster"
              description="Manage contact details, crews, titles, and active status from one table."
              countLabel={`${employees.length} employee${employees.length === 1 ? "" : "s"}`}
              actions={
                <Link
                  href="/dashboard/employees/new"
                  className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:border-orange-300 hover:bg-orange-50"
                >
                  Add employee
                </Link>
              }
            />
          }
        />
      )}
    </div>
  );
}
