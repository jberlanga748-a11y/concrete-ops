import { JobList } from "@/components/jobs/JobList";
import { getJobs } from "@/lib/db/queries";

export default async function JobsPage() {
  const { data, error } = await getJobs();
  const jobs = data ?? [];

  const totalJobs = jobs.length;
  const inProgressJobs = jobs.filter((job) => job.status === "in_progress").length;
  const scheduledJobs = jobs.filter((job) => job.status === "scheduled").length;
  const completedJobs = jobs.filter((job) => job.status === "completed").length;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Project Control</p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 sm:text-3xl">Jobs</h1>
        <p className="mt-2 text-sm text-zinc-600 sm:text-base">
          Open each job to manage field activity, reports, uploads, and change orders.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Total Jobs</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">{totalJobs}</p>
          <p className="mt-1 text-xs text-zinc-500">All active and historical jobs</p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">In Progress</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">{inProgressJobs}</p>
          <p className="mt-1 text-xs text-zinc-500">Jobs currently being worked</p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Scheduled</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">{scheduledJobs}</p>
          <p className="mt-1 text-xs text-zinc-500">Ready to start soon</p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Completed</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">{completedJobs}</p>
          <p className="mt-1 text-xs text-zinc-500">Finished jobs on record</p>
        </div>
      </section>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error.message}
        </div>
      ) : (
        <JobList jobs={jobs} />
      )}
    </div>
  );
}
