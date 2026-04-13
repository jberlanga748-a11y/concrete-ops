import { JobDetailHeader } from "@/components/jobs/JobDetailHeader";
import { getJobTimeEntries } from "@/lib/db/queries";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await getJobTimeEntries(id);

  return (
    <div className="space-y-6">
      <JobDetailHeader id={id} />
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Time entries</h2>
        <pre className="mt-4 overflow-auto rounded-2xl bg-zinc-100 p-4 text-xs">{JSON.stringify(data ?? [], null, 2)}</pre>
      </div>
    </div>
  );
}
