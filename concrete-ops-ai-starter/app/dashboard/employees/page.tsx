import Link from "next/link";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { InlineNotice, PageActionLink, PageHeader } from "@/components/ui/primitives";
import { getEmployees } from "@/lib/db/queries";

export default async function EmployeesPage() {
  const { data, error } = await getEmployees();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Manage field employees, crews, and contact details without exposing payroll settings broadly."
        action={<PageActionLink href="/dashboard/employees/new">New Employee</PageActionLink>}
      />

      {error ? (
        <InlineNotice tone="error">We couldn’t load employees right now. Please refresh and try again.</InlineNotice>
      ) : (
        <EmployeeTable employees={data ?? []} />
      )}
    </div>
  );
}
