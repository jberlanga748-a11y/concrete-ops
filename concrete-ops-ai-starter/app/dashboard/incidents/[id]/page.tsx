import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentList } from "@/components/documents/DocumentList";
import { getDocumentsForEntity, getIncidentById, type IncidentDetailRow } from "@/lib/db/queries";
import { formatDateOnly } from "@/lib/time/formatting";

function getJob(job: IncidentDetailRow["jobs"]) {
  if (!job) return null;
  if (Array.isArray(job)) return job[0] ?? null;
  return job;
}

function getEmployee(employee: IncidentDetailRow["incident_employee"]) {
  if (!employee) return null;
  if (Array.isArray(employee)) return employee[0] ?? null;
  return employee;
}

function getReportedByUser(user: IncidentDetailRow["reported_by_user"]) {
  if (!user) return null;
  if (Array.isArray(user)) return user[0] ?? null;
  return user;
}

function getReportedByEmployee(employee: IncidentDetailRow["reported_by_employee"]) {
  if (!employee) return null;
  if (Array.isArray(employee)) return employee[0] ?? null;
  return employee;
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ data: incident }, { data: documents }] = await Promise.all([
    getIncidentById(id),
    getDocumentsForEntity("incident", id),
  ]);

  if (!incident) notFound();

  const job = getJob(incident.jobs);
  const employee = getEmployee(incident.incident_employee);
  const reportedByUser = getReportedByUser(incident.reported_by_user);
  const reportedByEmployee = getReportedByEmployee(incident.reported_by_employee);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold capitalize">{formatLabel(incident.incident_type)}</h1>
            <p className="mt-2 text-zinc-600">{formatDateOnly(incident.incident_date)}</p>
          </div>
          <div className="flex gap-3">
            <Link href={`/dashboard/incidents/${incident.id}/edit`} className="rounded-xl border px-4 py-2 text-sm">
              Edit Incident
            </Link>
            {job ? (
              <Link href={`/dashboard/jobs/${job.id}`} className="rounded-xl border px-4 py-2 text-sm">
                Open Job
              </Link>
            ) : null}
            <Link href="/dashboard/incidents" className="rounded-xl border px-4 py-2 text-sm">
              Back to Incidents
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Job</h2>
          <p className="mt-2">{job ? `${job.job_number} · ${job.name}` : "—"}</p>
        </section>

        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Status</h2>
          <p className="mt-2 capitalize">{formatLabel(incident.status)}</p>
        </section>

        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Employee Involved</h2>
          <p className="mt-2">{employee?.full_name || "—"}</p>
          <p className="mt-1 text-sm text-zinc-600">
            {[employee?.job_title, employee?.crew_name].filter(Boolean).join(" · ") || "No employee linked"}
          </p>
        </section>

        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Reported By</h2>
          <p className="mt-2">{reportedByUser?.full_name || "—"}</p>
          <p className="mt-1 text-sm text-zinc-600">
            {[reportedByEmployee?.job_title, reportedByEmployee?.crew_name].filter(Boolean).join(" · ") || reportedByEmployee?.full_name || "No reporting employee linked"}
          </p>
        </section>
      </div>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Description</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{incident.description}</p>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Corrective Action</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{incident.corrective_action || "—"}</p>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Documents</h2>
            <p className="mt-1 text-sm text-zinc-600">Shared uploads linked to this incident.</p>
          </div>
        </div>
        <div className="mt-4">
          <DocumentList documents={documents ?? []} emptyMessage="No documents linked to this incident yet." />
        </div>
      </section>
    </div>
  );
}
