import type { JobTimeEntryRow } from "@/lib/db/queries";
import { DataTable, EmptyState, StatusPill, tableCellClassName } from "@/components/ui/primitives";

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

export function AdminLaborTable({ entries }: { entries: JobTimeEntryRow[] }) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="No time entries match these filters"
        description="Try widening the filters or have the crew clock in from the employee or admin time tools."
      />
    );
  }

  return (
    <DataTable
      headers={["Employee", "Job", "Phase", "Clock In", "Clock Out", "Hours", "Status"]}
      emptyState={null}
      mobileCards={
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-[28px] border border-zinc-200/80 bg-white/95 p-4 shadow-[0_16px_36px_rgba(24,24,27,0.08)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-zinc-950">{getEmployeeName(entry.employees)}</p>
                  <p className="mt-1 text-sm text-zinc-600">{getJobLabel(entry.jobs)}</p>
                  <p className="mt-1 text-sm text-zinc-500">{getPhaseName(entry.job_phases)}</p>
                </div>
                <StatusPill tone={entry.status === "clocked_in" ? "success" : "info"}>{entry.status}</StatusPill>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-zinc-600">
                <div><p className="text-xs uppercase tracking-wide text-zinc-400">Clock In</p><p className="mt-1">{entry.clock_in_at}</p></div>
                <div><p className="text-xs uppercase tracking-wide text-zinc-400">Clock Out</p><p className="mt-1">{entry.clock_out_at ?? "—"}</p></div>
                <div><p className="text-xs uppercase tracking-wide text-zinc-400">Hours</p><p className="mt-1">{entry.total_hours ?? "—"}</p></div>
              </div>
            </div>
          ))}
        </div>
      }
    >
      {entries.map((entry) => (
        <tr key={entry.id} className="border-t border-zinc-200 transition hover:bg-orange-50/50">
          <td className={tableCellClassName}>{getEmployeeName(entry.employees)}</td>
          <td className={tableCellClassName}>{getJobLabel(entry.jobs)}</td>
          <td className={tableCellClassName}>{getPhaseName(entry.job_phases)}</td>
          <td className={tableCellClassName}>{entry.clock_in_at}</td>
          <td className={tableCellClassName}>{entry.clock_out_at ?? "—"}</td>
          <td className={tableCellClassName}>{entry.total_hours ?? "—"}</td>
          <td className={tableCellClassName}>
            <StatusPill tone={entry.status === "clocked_in" ? "success" : "info"}>{entry.status}</StatusPill>
          </td>
        </tr>
      ))}
    </DataTable>
  );
}
