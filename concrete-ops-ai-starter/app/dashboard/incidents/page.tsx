import Link from "next/link";
import { EmptyState, ErrorPanel, StatusChip } from "@/components/ui/feedback";
import { PageHeader, RecordPreview } from "@/components/ui/page-primitives";
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
  TableToolbar,
} from "@/components/ui/table";
import { getIncidents, type IncidentListRow } from "@/lib/db/queries";
import { formatDateOnly } from "@/lib/time/formatting";

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
  const incidentRows = incidents ?? [];
  const latestIncident = incidentRows[0] ?? null;

  return (
    <div>
      <PageHeader
        eyebrow="Safety"
        title="Incidents"
        description="Field incident logging for near misses, injuries, property damage, and site observations."
        actions={
          <Link href="/dashboard/incidents/new" className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800">
            New Incident
          </Link>
        }
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        {error ? (
          <ErrorPanel
            title="We couldn’t load incidents right now"
            description="The incident log is temporarily unavailable. Try refreshing the page or come back in a moment."
            actionHref="/dashboard/incidents"
            actionLabel="Try again"
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <TableShell
              toolbar={
                <TableToolbar
                  title="Incident log"
                  description="Review the safety record with date, type, job, employee, status, and next action in one scan."
                  countLabel={`${incidentRows.length} incident${incidentRows.length === 1 ? "" : "s"}`}
                />
              }
            >
              <DataTable>
                <TableHead>
                  <tr>
                    <TableHeadCell>Incident</TableHeadCell>
                    <TableHeadCell className="hidden md:table-cell">Job</TableHeadCell>
                    <TableHeadCell className="hidden lg:table-cell">Employee</TableHeadCell>
                    <TableHeadCell>Status</TableHeadCell>
                    <TableHeadCell className="w-32">Action</TableHeadCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {incidentRows.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell className="min-w-[18rem]">
                        <p className="font-black capitalize text-slate-950">{formatIncidentType(incident.incident_type)}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">{formatDateOnly(incident.incident_date)}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{getJobLabel(incident.jobs)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{getEmployeeLabel(incident.incident_employee)}</TableCell>
                      <TableCell>
                        <StatusChip tone={incident.status === "closed" ? "success" : "warning"}>{formatIncidentType(incident.status)}</StatusChip>
                      </TableCell>
                      <TableCell>
                        <TableActionLink href={`/dashboard/incidents/${incident.id}`} label="Open" />
                      </TableCell>
                    </TableRow>
                  ))}
                  {incidentRows.length === 0 ? (
                    <TableEmptyRow colSpan={5}>
                      <EmptyState
                        icon="alert"
                        title="No incidents logged yet"
                        description="Log the first incident or site observation so the shared safety record stays complete for field and office follow-up."
                        actionHref="/dashboard/incidents/new"
                        actionLabel="Log incident"
                      />
                    </TableEmptyRow>
                  ) : null}
                </TableBody>
              </DataTable>
            </TableShell>

            <RecordPreview
              title={latestIncident ? formatIncidentType(latestIncident.incident_type) : undefined}
              rows={[
                ["Date", latestIncident ? formatDateOnly(latestIncident.incident_date) : "—"],
                ["Job", latestIncident ? getJobLabel(latestIncident.jobs) : "—"],
                ["Employee", latestIncident ? getEmployeeLabel(latestIncident.incident_employee) : "—"],
                ["Status", latestIncident ? formatIncidentType(latestIncident.status) : "—"],
              ]}
              actions={
                latestIncident ? (
                  <Link href={`/dashboard/incidents/${latestIncident.id}`} className="inline-flex rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">
                    Open Incident
                  </Link>
                ) : null
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
