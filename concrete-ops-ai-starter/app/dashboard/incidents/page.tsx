import Link from "next/link";
import { EmptyState, ErrorPanel } from "@/components/ui/feedback";
import { getIncidents, type IncidentListRow } from "@/lib/db/queries";

function getJobLabel(jobs: IncidentListRow["jobs"]) {
  if (!jobs) return "—";
  if (Array.isArray(jobs)) {
    const job = jobs[0];
    return job ? `${job.job_number} · ${job.name}` : "—";
  }
  return `${jobs.job_number} · ${jobs.name}`;
}

function getEmployeeLabel(employees: IncidentListRow["incident_employee"]) {
  if (!employees) return "—";
  if (Array.isArray(employees)) return employees[0]?.full_name ?? "—";
  return employees.full_name;
}

function formatIncidentType(value: string) {
  return value.replace(/_/g, " ");
}

export default async function IncidentsPage() {
  const { data: incidents, error } = await getIncidents();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Incidents</h1>
            <p className="mt-2 text-zinc-600">Field incident logging for near misses, injuries, property damage, and site observations.</p>
          </div>
          <Link href="/dashboard/incidents/new" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white">
            New Incident
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        {error ? (
          <div className="p-4">
            <ErrorPanel
              title="We couldn’t load incidents right now"
              description="The incident log is temporarily unavailable. Try refreshing the page or come back in a moment."
              actionHref="/dashboard/incidents"
              actionLabel="Try again"
            />
          </div>
        ) : (incidents ?? []).length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon="alert"
              title="No incidents logged yet"
              description="Log the first incident or site observation so the shared safety record stays complete for field and office follow-up."
              actionHref="/dashboard/incidents/new"
              actionLabel="Log incident"
            />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-100">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Job</th>
                <th className="px-4 py-3 text-left">Employee</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Open</th>
              </tr>
            </thead>
            <tbody>
              {(incidents ?? []).map((incident) => (
                <tr key={incident.id} className="border-t">
                  <td className="px-4 py-4">{incident.incident_date}</td>
                  <td className="px-4 py-4 capitalize">{formatIncidentType(incident.incident_type)}</td>
                  <td className="px-4 py-4">{getJobLabel(incident.jobs)}</td>
                  <td className="px-4 py-4">{getEmployeeLabel(incident.incident_employee)}</td>
                  <td className="px-4 py-4 capitalize">{formatIncidentType(incident.status)}</td>
                  <td className="px-4 py-4">
                    <Link href={`/dashboard/incidents/${incident.id}`} className="underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
