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

function getForemanName(foreman: JobListRow["foreman_employee"]) {
  if (!foreman) return "Unassigned";
  if (Array.isArray(foreman)) return foreman[0]?.full_name ?? "Unassigned";
  return foreman.full_name;
}

function formatDateOnly(value: string | null | undefined) {
  if (!value) return "";

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function formatSchedule(startDate: string | null | undefined, targetFinishDate: string | null | undefined) {
  if (startDate && targetFinishDate) return `${formatDateOnly(startDate)} - ${formatDateOnly(targetFinishDate)}`;
  if (startDate) return `Starts ${formatDateOnly(startDate)}`;
  if (targetFinishDate) return `Target ${formatDateOnly(targetFinishDate)}`;
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
            <TableHeadCell className="hidden md:table-cell">Customer</TableHeadCell>
            <TableHeadCell className="hidden xl:table-cell">Foreman</TableHeadCell>
            <TableHeadCell className="hidden lg:table-cell">Schedule</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell className="w-40">Actions</TableHeadCell>
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
                  <div className="space-y-3">
                    <div>
                      <p className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">{job.job_number}</p>
                      <p className="mt-2 text-base font-semibold tracking-[-0.03em] text-zinc-950">{job.name}</p>
                    </div>

                    <div className="grid gap-2 text-xs text-zinc-600 md:hidden">
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-3 py-2">
                        <p className="font-app-mono uppercase tracking-[0.16em] text-zinc-500">Customer</p>
                        <p className="mt-1 text-sm font-medium text-zinc-900">{customerName}</p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-3 py-2">
                          <p className="font-app-mono uppercase tracking-[0.16em] text-zinc-500">Foreman</p>
                          <p className="mt-1 text-sm font-medium text-zinc-900">{foremanName}</p>
                        </div>
                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-3 py-2">
                          <p className="font-app-mono uppercase tracking-[0.16em] text-zinc-500">Schedule</p>
                          <p className="mt-1 text-sm font-medium text-zinc-900">{scheduleLabel}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="space-y-1">
                    <p className="font-medium text-zinc-900">{customerName}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Customer record</p>
                  </div>
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <div className="space-y-1">
                    <p className="font-medium text-zinc-900">{foremanName}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Assigned foreman</p>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="space-y-1">
                    <p className="font-medium text-zinc-900">{scheduleLabel}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                      {job.target_finish_date ? `Target ${formatDateOnly(job.target_finish_date)}` : "Planning in progress"}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <StatusChip tone={getStatusTone(job.status)}>{job.status.replaceAll("_", " ")}</StatusChip>
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                      {job.status === "on_hold" ? "Needs follow-up" : "Project status"}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <TableActionLink href={`/dashboard/jobs/${job.id}`} label="Open hub" />
                    {canManage ? <TableActionLink href={`/dashboard/jobs/${job.id}/edit`} label="Edit plan" /> : null}
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
