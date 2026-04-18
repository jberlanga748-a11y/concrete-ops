import Link from "next/link";
import { IncidentForm } from "@/components/incidents/IncidentForm";
import { getDailyReportJobOptions, getEmployeeOptions } from "@/lib/db/queries";

export default async function NewIncidentPage({
  searchParams,
}: {
  searchParams?: Promise<{ jobId?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const initialJobId = params.jobId?.trim() || "";
  const [jobOptions, employeeOptions] = await Promise.all([getDailyReportJobOptions(), getEmployeeOptions()]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">New Incident</h1>
            <p className="mt-2 text-zinc-600">Capture the key facts quickly so the team can follow up without slowing down the field workflow.</p>
          </div>
          <Link href="/dashboard/incidents" className="rounded-xl border px-4 py-2 text-sm">
            Back to Incidents
          </Link>
        </div>
      </div>

      <IncidentForm jobOptions={jobOptions} employeeOptions={employeeOptions} initialJobId={initialJobId} />
    </div>
  );
}
