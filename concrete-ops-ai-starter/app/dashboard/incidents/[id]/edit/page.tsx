import Link from "next/link";
import { notFound } from "next/navigation";
import { IncidentForm } from "@/components/incidents/IncidentForm";
import { getDailyReportJobOptions, getEmployeeOptions, getIncidentById } from "@/lib/db/queries";

export default async function EditIncidentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ data: incident }, jobOptions, employeeOptions] = await Promise.all([
    getIncidentById(id),
    getDailyReportJobOptions(),
    getEmployeeOptions(true),
  ]);

  if (!incident) notFound();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Update Incident</h1>
            <p className="mt-2 text-zinc-600">Adjust incident facts and status without losing the original reporter trail.</p>
          </div>
          <Link href={`/dashboard/incidents/${incident.id}`} className="rounded-xl border px-4 py-2 text-sm">
            Back to Incident
          </Link>
        </div>
      </div>

      <IncidentForm
        incidentId={incident.id}
        jobOptions={jobOptions}
        employeeOptions={employeeOptions}
        initialValues={incident}
      />
    </div>
  );
}
