import type { ReactNode } from "react";
import type { EmployeeListRow } from "@/lib/db/queries";
import { EmptyState, StatusChip } from "@/components/ui/feedback";
import { formatDateOnly } from "@/lib/time/formatting";
import {
  DataTable,
  TableActionLink,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeadCell,
  TableRow,
  TableShell,
} from "@/components/ui/table";

export function EmployeeTable({
  employees,
  toolbar,
}: {
  employees: EmployeeListRow[];
  toolbar?: ReactNode;
}) {
  return (
    <TableShell toolbar={toolbar}>
      <DataTable>
        <TableHead>
          <tr>
            <TableHeadCell>Employee</TableHeadCell>
            <TableHeadCell>Crew</TableHeadCell>
            <TableHeadCell>Title</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell>Hire Date</TableHeadCell>
            <TableHeadCell className="w-32">Actions</TableHeadCell>
          </tr>
        </TableHead>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell>
                <p className="font-semibold text-zinc-950">{employee.full_name}</p>
                <p className="mt-1 text-sm text-zinc-600">{employee.email || employee.phone || "No contact info"}</p>
              </TableCell>
              <TableCell>{employee.crew_name || "—"}</TableCell>
              <TableCell>{employee.job_title || "—"}</TableCell>
              <TableCell>
                <StatusChip tone={employee.is_active ? "success" : "warning"}>
                  {employee.is_active ? "Active" : "Inactive"}
                </StatusChip>
              </TableCell>
              <TableCell>{formatDateOnly(employee.hire_date)}</TableCell>
              <TableCell>
                <TableActionLink href={`/dashboard/employees/${employee.id}`} label="Edit" />
              </TableCell>
            </TableRow>
          ))}
          {employees.length === 0 ? (
            <TableEmptyRow colSpan={6}>
              <EmptyState
                icon="users"
                title="No employees found"
                description="Add employees so they can be assigned to jobs, clock time, and appear in daily report crew rows."
                actionHref="/dashboard/employees/new"
                actionLabel="Add employee"
              />
            </TableEmptyRow>
          ) : null}
        </TableBody>
      </DataTable>
    </TableShell>
  );
}
