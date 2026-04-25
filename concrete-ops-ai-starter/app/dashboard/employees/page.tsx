import Link from "next/link";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { ErrorPanel } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-primitives";
import { TableToolbar } from "@/components/ui/table";
import { getEmployees } from "@/lib/db/queries";

export default async function EmployeesPage() {
  const { data, error } = await getEmployees();
  const employees = data ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Employees"
        description="Keep employee records clean for job assignments, time tracking, daily reports, and compliance without exposing payroll settings broadly."
        actions={
          <Link href="/dashboard/employees/new" className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800">
            New Employee
          </Link>
        }
      />

      <div className="px-5 sm:px-6 lg:px-8">
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
              />
            }
          />
        )}
      </div>
    </div>
  );
}
