import Link from "next/link";
import { EmployeeForm } from "@/components/employees/EmployeeForm";

export default function NewEmployeePage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">New Employee</h1>
            <p className="mt-2 text-zinc-600">Create a simple employee record that can be used for time tracking and job assignments.</p>
          </div>
          <Link href="/dashboard/employees" className="rounded-xl border px-4 py-2 text-sm">
            Back to Employees
          </Link>
        </div>
      </div>

      <EmployeeForm />
    </div>
  );
}
