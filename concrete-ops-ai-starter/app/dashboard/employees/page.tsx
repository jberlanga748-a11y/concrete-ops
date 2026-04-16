import Link from "next/link";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { getEmployees } from "@/lib/db/queries";

export default async function EmployeesPage() {
  const { data, error } = await getEmployees();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Employees</h1>
            <p className="mt-2 text-zinc-600">Manage field employees, crews, and contact details without exposing payroll settings broadly.</p>
          </div>
          <Link href="/dashboard/employees/new" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white">
            New Employee
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-700">{error.message}</div>
      ) : (
        <EmployeeTable employees={data ?? []} />
      )}
    </div>
  );
}
