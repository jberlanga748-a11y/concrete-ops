import Link from "next/link";
import type { JobListRow } from "@/lib/db/queries";

function getCustomerName(customers: JobListRow["customers"]) {
  if (!customers) return "—";
  if (Array.isArray(customers)) return customers[0]?.name ?? "—";
  return customers.name;
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusClasses(status: string) {
  switch (status) {
    case "in_progress":
      return "bg-emerald-100 text-emerald-700";
    case "scheduled":
      return "bg-blue-100 text-blue-700";
    case "completed":
      return "bg-zinc-900 text-white";
    case "on_hold":
      return "bg-amber-100 text-amber-700";
    case "archived":
      return "bg-zinc-200 text-zinc-700";
    default:
      return "bg-zinc-100 text-zinc-700";
  }
}

export function JobList({ jobs }: { jobs: JobListRow[] }) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-3xl border bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">No jobs yet</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Once jobs are added, they will show up here for your team to manage.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {jobs.map((job) => (
          <Link
            key={job.id}
            href={`/dashboard/jobs/${job.id}`}
            className="block rounded-2xl border bg-white p-4 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  {job.job_number}
                </p>
                <h3 className="mt-1 truncate text-base font-semibold text-zinc-900">
                  {job.name}
                </h3>
              </div>

              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                  job.status,
                )}`}
              >
                {formatStatus(job.status)}
              </span>
            </div>

            <div className="mt-4 rounded-xl border bg-zinc-50 p-3">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Customer</p>
              <p className="mt-1 text-sm font-medium text-zinc-800">
                {getCustomerName(job.customers)}
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-zinc-500">Open job hub</span>
              <span className="font-medium text-zinc-900">View</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-3xl border bg-white shadow-sm lg:block">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-700">Job</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-700">Customer</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-700">Status</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-700">Open</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-t">
                <td className="px-4 py-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                      {job.job_number}
                    </p>
                    <p className="mt-1 font-medium text-zinc-900">{job.name}</p>
                  </div>
                </td>
                <td className="px-4 py-4 text-zinc-700">{getCustomerName(job.customers)}</td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                      job.status,
                    )}`}
                  >
                    {formatStatus(job.status)}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <Link
                    href={`/dashboard/jobs/${job.id}`}
                    className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-zinc-50"
                  >
                    View Job
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
