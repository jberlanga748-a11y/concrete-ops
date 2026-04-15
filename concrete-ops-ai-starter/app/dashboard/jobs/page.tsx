import { JobList } from "@/components/jobs/JobList";
import { getJobs } from "@/lib/db/queries";

export default async function JobsPage() {
  const { data, error } = await getJobs();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">Jobs</h1>
        <p className="mt-3 text-zinc-600">Browse all jobs and open the Job Hub for full project activity, reports, uploads, and change orders.</p>
      </div>
      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-700">{error.message}</div>
      ) : (
        <JobList jobs={data ?? []} />
      )}
    </div>
  );
}
