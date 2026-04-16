import Link from "next/link";
import type { JobListRow } from "@/lib/db/queries";
import {
  EmptyState,
  tableCellClassName,
  tableHeaderClassName,
  tableShellClassName,
} from "@/components/ui/primitives";

function getCustomerName(customers: JobListRow["customers"]) {
  if (!customers) return "—";
  if (Array.isArray(customers)) return customers[0]?.name ?? "—";
  return customers.name;
}

export function JobList({ jobs }: { jobs: JobListRow[] }) {
  if (jobs.length === 0) {
    return (
      <EmptyState
        title="No jobs yet"
        description="Create the first job to start assigning crews, collecting reports, and tracking field activity."
        action={<Link href="/dashboard/jobs/new" className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white">New Job</Link>}
      />
    );
  }

  return (
    <div className={tableShellClassName}>
      <table className="w-full text-sm">
        <thead className={tableHeaderClassName}>
          <tr>
            <th className="px-4 py-3 text-left">Job</th>
            <th className="px-4 py-3 text-left">Customer</th>
            <th className="px-4 py-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-t border-zinc-200 transition hover:bg-zinc-50">
              <td className={tableCellClassName}>
                <Link href={`/dashboard/jobs/${job.id}`} className="font-medium hover:underline">
                  {job.job_number} · {job.name}
                </Link>
              </td>
              <td className={tableCellClassName}>{getCustomerName(job.customers)}</td>
              <td className={tableCellClassName}>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-700">{job.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
