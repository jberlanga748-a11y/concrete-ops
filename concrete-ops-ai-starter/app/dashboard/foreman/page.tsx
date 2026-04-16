import Link from "next/link";
import { getJobs } from "@/lib/db/queries";

export default async function ForemanHomePage() {
  const { data: jobs } = await getJobs();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">Foreman</h1>
        <p className="mt-2 text-zinc-600">Field ops dashboard.</p>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">All Jobs</h2>
          <Link href="/dashboard/jobs" className="text-sm underline">
            Open full list
          </Link>
        </div>

        <ul className="mt-3 space-y-2 text-sm">
          {(jobs ?? []).slice(0, 15).map((job) => (
            <li
              key={job.id}
              className="rounded-xl border p-3 flex items-center justify-between"
            >
              <div>
                <p className="font-medium">
                  {job.job_number} · {job.name}
                </p>
                <p className="text-zinc-600">Status: {job.status}</p>
              </div>
              <Link
                className="rounded-xl bg-zinc-900 px-4 py-2 text-white text-sm"
                href={`/dashboard/jobs/${job.id}`}
              >
                Job Hub
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}