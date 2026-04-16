import Link from "next/link";
import { notFound } from "next/navigation";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { getEmployeeById } from "@/lib/db/queries";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: employee } = await getEmployeeById(id);

  if (!employee) notFound();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">{employee.full_name}</h1>
            <p className="mt-2 text-zinc-600">Update employee details used in assignments and time tracking.</p>
          </div>
          <Link href="/dashboard/employees" className="rounded-xl border px-4 py-2 text-sm">
            Back to Employees
          </Link>
        </div>
      </div>

      <EmployeeForm
        employeeId={employee.id}
        initialValues={{
          fullName: employee.full_name,
          phone: employee.phone,
          email: employee.email,
          crewName: employee.crew_name,
          jobTitle: employee.job_title,
          hireDate: employee.hire_date,
          isActive: employee.is_active,
        }}
      />
    </div>
  );
}
