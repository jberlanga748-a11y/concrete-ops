import Link from "next/link";
import type { ReactNode } from "react";
import type { JobListRow } from "@/lib/db/queries";
import { EmptyState, StatusChip } from "@/components/ui/feedback";
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

function getCustomerName(customers: JobListRow["customers"]) {
  if (!customers) return "—";
  if (Array.isArray(customers)) return customers[0]?.name ?? "—";
  return customers.name;
}

function getStatusTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("complete") || normalized.includes("archived") || normalized.includes("closed")) return "success" as const;
  if (normalized.includes("hold")) return "warning" as const;
  return "info" as const;
}

export function JobList({
  jobs,
  toolbar,
  canManage = false,
}: {
  jobs: JobListRow[];
  toolbar?: ReactNode;
  canManage?: boolean;
}) {
  return (
    <TableShell toolbar={toolbar}>
      <DataTable>
        <TableHead>
          <tr>
            <TableHeadCell>Job</TableHeadCell>
            <TableHeadCell>Customer</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell className="w-40">Actions</TableHeadCell>
          </tr>
        </TableHead>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell>
                <p className="font-semibold text-zinc-950">{job.job_number}</p>
                <p className="mt-1 text-sm text-zinc-600">{job.name}</p>
              </TableCell>
              <TableCell>{getCustomerName(job.customers)}</TableCell>
              <TableCell>
                <StatusChip tone={getStatusTone(job.status)}>{job.status.replaceAll("_", " ")}</StatusChip>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  <TableActionLink href={`/dashboard/jobs/${job.id}`} label="Open" />
                  {canManage ? <TableActionLink href={`/dashboard/jobs/${job.id}/edit`} label="Edit" /> : null}
                </div>
              </TableCell>
            </TableRow>
          ))}

          {jobs.length === 0 ? (
            <TableEmptyRow colSpan={4}>
              <EmptyState
                icon="briefcase"
                title="No jobs yet"
                description="Create the first job so your team has a project hub for reports, uploads, assignments, and field activity."
                actionHref="/dashboard/jobs/new"
                actionLabel="Create job"
              />
            </TableEmptyRow>
          ) : null}
        </TableBody>
      </DataTable>
    </TableShell>
  );
}
