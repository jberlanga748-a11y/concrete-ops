"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { ZonedDateTime } from "@/components/time/ZonedDateTime";
import { EmptyState, StatusChip } from "@/components/ui/feedback";
import {
  DataTable,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeadCell,
  TableRow,
  TableShell,
} from "@/components/ui/table";
import type { JobTimeEntryRow } from "@/lib/db/queries";
import { getViewerTimeZone } from "@/lib/time/formatting";

function getEmployeeName(employees: JobTimeEntryRow["employees"]) {
  if (!employees) return "—";
  if (Array.isArray(employees)) return employees[0]?.full_name ?? "—";
  return employees.full_name;
}

function getPhaseName(jobPhases: JobTimeEntryRow["job_phases"]) {
  if (!jobPhases) return "—";
  if (Array.isArray(jobPhases)) return jobPhases[0]?.name ?? "—";
  return jobPhases.name;
}

function getJobLabel(jobs: JobTimeEntryRow["jobs"]) {
  if (!jobs) return "—";
  if (Array.isArray(jobs)) {
    const job = jobs[0];
    return job ? `${job.job_number} · ${job.name}` : "—";
  }

  return `${jobs.job_number} · ${jobs.name}`;
}

function formatHours(value: number | null | undefined) {
  if (value == null) return "—";

  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: value > 0 && value < 10 && value % 1 !== 0 ? 1 : 0,
    maximumFractionDigits: 2,
  }).format(value)} h`;
}

function getStatusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function getStatusTone(status: string): "neutral" | "success" | "info" | "warning" {
  if (status === "clocked_in") return "info";
  if (status === "on_break") return "warning";
  if (status === "clocked_out") return "success";
  return "neutral";
}

export function AdminLaborTable({
  entries,
  toolbar,
  filters,
  emptyState,
}: {
  entries: JobTimeEntryRow[];
  toolbar?: ReactNode;
  filters?: ReactNode;
  emptyState?: {
    title: string;
    description: string;
    actionHref?: string;
    actionLabel?: string;
  };
}) {
  const [timeZone, setTimeZone] = useState("UTC");

  useEffect(() => {
    setTimeZone(getViewerTimeZone());
  }, []);

  return (
    <TableShell toolbar={toolbar} filters={filters}>
      <DataTable>
        <TableHead>
          <tr>
            <TableHeadCell>Crew Member</TableHeadCell>
            <TableHeadCell className="hidden md:table-cell">Assignment</TableHeadCell>
            <TableHeadCell className="hidden lg:table-cell">Clock In</TableHeadCell>
            <TableHeadCell className="hidden xl:table-cell">Clock Out</TableHeadCell>
            <TableHeadCell>Hours</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
          </tr>
        </TableHead>
        <TableBody>
          {entries.map((entry) => {
            const employeeName = getEmployeeName(entry.employees);
            const jobLabel = getJobLabel(entry.jobs);
            const phaseName = getPhaseName(entry.job_phases);

            return (
              <TableRow key={entry.id}>
                <TableCell className="min-w-[16rem]">
                  <p className="font-black text-slate-950">{employeeName}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500 md:hidden">{jobLabel}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">Timezone · {timeZone}</p>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <p className="font-bold text-slate-700">{jobLabel}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{phaseName === "—" ? "No phase tagged" : `Phase · ${phaseName}`}</p>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <ZonedDateTime value={entry.clock_in_at} timeZone={timeZone} />
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <ZonedDateTime value={entry.clock_out_at} timeZone={timeZone} emptyLabel="Still open" />
                </TableCell>
                <TableCell className="font-black text-slate-950">
                  {entry.clock_out_at ? formatHours(entry.total_hours) : "In progress"}
                </TableCell>
                <TableCell>
                  <StatusChip tone={getStatusTone(entry.status)}>{getStatusLabel(entry.status)}</StatusChip>
                </TableCell>
              </TableRow>
            );
          })}
          {entries.length === 0 ? (
            <TableEmptyRow colSpan={6}>
              <EmptyState
                icon="clock"
                title={emptyState?.title ?? "No time entries match this view"}
                description={emptyState?.description ?? "Adjust the filters or add a new clock entry above to start building the labor log for this period."}
                actionHref={emptyState?.actionHref}
                actionLabel={emptyState?.actionLabel}
              />
            </TableEmptyRow>
          ) : null}
        </TableBody>
      </DataTable>
    </TableShell>
  );
}
