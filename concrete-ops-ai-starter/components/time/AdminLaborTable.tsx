import type { JobTimeEntryRow } from "@/lib/db/queries";
import { EmptyState, tableCellClassName, tableHeaderClassName, tableShellClassName } from "@/components/ui/primitives";

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
    <div className={tableShellClassName}>
      <table className="w-full text-sm">
        <thead className={tableHeaderClassName}>
          <tr>
            <th className="px-4 py-3 text-left">Employee</th>
            <th className="px-4 py-3 text-left">Job</th>
            <th className="px-4 py-3 text-left">Phase</th>
            <th className="px-4 py-3 text-left">Clock In</th>
            <th className="px-4 py-3 text-left">Clock Out</th>
            <th className="px-4 py-3 text-left">Hours</th>
            <th className="px-4 py-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-t border-zinc-200 transition hover:bg-zinc-50">
              <td className={tableCellClassName}>{getEmployeeName(entry.employees)}</td>
              <td className={tableCellClassName}>{getJobLabel(entry.jobs)}</td>
              <td className={tableCellClassName}>{getPhaseName(entry.job_phases)}</td>
              <td className={tableCellClassName}>{entry.clock_in_at}</td>
              <td className={tableCellClassName}>{entry.clock_out_at ?? "—"}</td>
              <td className={tableCellClassName}>{entry.total_hours ?? "—"}</td>
              <td className={tableCellClassName}>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-700">{entry.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
