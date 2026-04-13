import type { JobTimeEntryRow } from "@/lib/db/queries";

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
  return (
    <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-zinc-100">
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
            <tr key={entry.id} className="border-t">
              <td className="px-4 py-4">{getEmployeeName(entry.employees)}</td>
              <td className="px-4 py-4">{getJobLabel(entry.jobs)}</td>
              <td className="px-4 py-4">{getPhaseName(entry.job_phases)}</td>
              <td className="px-4 py-4">{entry.clock_in_at}</td>
              <td className="px-4 py-4">{entry.clock_out_at ?? "—"}</td>
              <td className="px-4 py-4">{entry.total_hours ?? "—"}</td>
              <td className="px-4 py-4">{entry.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
