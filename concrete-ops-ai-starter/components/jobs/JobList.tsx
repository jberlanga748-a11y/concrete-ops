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
import { formatDateOnly } from "@/lib/time/formatting";

function getCustomerName(customers: JobListRow["customers"]) {
  if (!customers) return "—";
  if (Array.isArray(customers)) return customers[0]?.name ?? "—";
  return customers.name;
}

function getForemanName(foreman: JobListRow["foreman_employee"]) {
  if (!foreman) return "Unassigned";
  if (Array.isArray(foreman)) return foreman[0]?.full_name ?? "Unassigned";
  return foreman.full_name;
}

function formatSchedule(startDate: string | null | undefined, targetFinishDate: string | null | undefined) {
  if (startDate && targetFinishDate) return `${formatDateOnly(startDate, "")} - ${formatDateOnly(targetFinishDate, "")}`;
  if (startDate) return `Starts ${formatDateOnly(startDate, "")}`;
  if (targetFinishDate) return `Target ${formatDateOnly(targetFinishDate, "")}`;
  return "Schedule not set";
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
  filters,
  canManage = false,
}: {
  jobs: JobListRow[];
  toolbar?: ReactNode;
  filters?: ReactNode;
  canManage?: boolean;
}) {
  return (
    <TableShell toolbar={toolbar} filters={filters}>
      <DataTable>
        <TableHead>
          <tr>
            <TableHeadCell>Job</TableHeadCell>
            <TableHeadCell className="hidden md:table-cell">Customer</TableHeadCell>
            <TableHeadCell className="hidden xl:table-cell">Foreman</TableHeadCell>
            <TableHeadCell className="hidden lg:table-cell">Schedule</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell className="w-40">Action</TableHeadCell>
          </tr>
        </TableHead>
        <TableBody>
          {jobs.map((job) => {
            const customerName = getCustomerName(job.customers);
            const foremanName = getForemanName(job.foreman_employee);
            const scheduleLabel = formatSchedule(job.start_date, job.target_finish_date);

            return (
              <TableRow key={job.id}>
                <TableCell className="min-w-[18rem]">
                  <p className="font-black text-slate-950">{job.name}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{job.job_number} · <span className="md:hidden">{customerName}</span><span className="hidden md:inline">Job record</span></p>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <p className="font-bold text-slate-700">{customerName}</p>
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <p className="font-bold text-slate-700">{foremanName}</p>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <p className="font-bold text-slate-700">{scheduleLabel}</p>
                </TableCell>
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
            );
          })}

          {jobs.length === 0 ? (
            <TableEmptyRow colSpan={6}>
              <EmptyState
                icon="briefcase"
                title="No jobs are on the board yet"
                description="Create the first job to give the team a clean project hub for scheduling, assignments, documents, and day-to-day field follow-up."
                actionHref="/dashboard/jobs/new"
                actionLabel="Create first job"
              />
            </TableEmptyRow>
          ) : null}
        </TableBody>
      </DataTable>
    </TableShell>
  );
}
