import type { ReactNode } from "react";
import type { CustomerListRow } from "@/lib/db/queries";
import { EmptyState, StatusChip } from "@/components/ui/feedback";
import { formatTimestampDateOnly } from "@/lib/time/formatting";
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

export function CustomerTable({
  customers,
  toolbar,
}: {
  customers: CustomerListRow[];
  toolbar?: ReactNode;
}) {
  return (
    <TableShell toolbar={toolbar}>
      <DataTable>
        <TableHead>
          <tr>
            <TableHeadCell>Customer</TableHeadCell>
            <TableHeadCell>Primary Contact</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell>Created</TableHeadCell>
            <TableHeadCell className="w-32">Actions</TableHeadCell>
          </tr>
        </TableHead>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>
                <p className="font-semibold text-zinc-950">{customer.name}</p>
                <p className="mt-1 text-sm text-zinc-600">{customer.email || customer.phone || "No contact info"}</p>
              </TableCell>
              <TableCell>{customer.contact_name || "—"}</TableCell>
              <TableCell>
                <StatusChip tone={customer.status === "active" ? "success" : "warning"}>
                  {customer.status}
                </StatusChip>
              </TableCell>
              <TableCell>{formatTimestampDateOnly(customer.created_at)}</TableCell>
              <TableCell>
                <TableActionLink href={`/dashboard/customers/${customer.id}`} label="Edit" />
              </TableCell>
            </TableRow>
          ))}
          {customers.length === 0 ? (
            <TableEmptyRow colSpan={5}>
              <EmptyState
                icon="briefcase"
                title="No customers found"
                description="Add a customer to start building jobs, estimates, proposals, and the rest of the office workflow around a real account."
                actionHref="/dashboard/customers/new"
                actionLabel="Add customer"
              />
            </TableEmptyRow>
          ) : null}
        </TableBody>
      </DataTable>
    </TableShell>
  );
}
