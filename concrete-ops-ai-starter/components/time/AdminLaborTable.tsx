import type { ReactNode } from "react";
import type { JobTimeEntryRow } from "@/lib/db/queries";
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

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function getStatusTone(status: string) {
  if (status === "clocked_in") return "info" as const;
  if (status === "on_break") return "warning" as const;
  return "neutral" as const;
}

export function AdminLaborTable({
  entries,
  toolbar,
}: {
  entries: JobTimeEntryRow[];
  toolbar?: ReactNode;
}) {
  return (
    <TableShell toolbar={toolbar}>
      <DataTable>
        <TableHead>
          <tr>
            <TableHeadCell>Employee</TableHeadCell>
            <TableHeadCell>Job</TableHeadCell>
            <TableHeadCell>Phase</TableHeadCell>
            <TableHeadCell>Clock In</TableHeadCell>
            <TableHeadCell>Clock Out</TableHeadCell>
            <TableHeadCell>Hours</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
          </tr>
        </TableHead>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{getEmployeeName(entry.employees)}</TableCell>
              <TableCell>{getJobLabel(entry.jobs)}</TableCell>
              <TableCell>{getPhaseName(entry.job_phases)}</TableCell>
              <TableCell>{formatDateTime(entry.clock_in_at)}</TableCell>
              <TableCell>{formatDateTime(entry.clock_out_at)}</TableCell>
              <TableCell>{entry.total_hours ?? "—"}</TableCell>
              <TableCell>
                <StatusChip tone={getStatusTone(entry.status)}>{entry.status.replaceAll("_", " ")}</StatusChip>
              </TableCell>
            </TableRow>
          ))}
          {entries.length === 0 ? (
            <TableEmptyRow colSpan={7}>
              <EmptyState
                icon="clock"
                title="No time entries match this view"
                description="Adjust the filters or add a new clock entry above to start building the labor log for this period."
                actionHref="/dashboard/time"
                actionLabel="Clear filters"
              />
            </TableEmptyRow>
          ) : null}
        </TableBody>
      </DataTable>
    </TableShell>
  );
}
