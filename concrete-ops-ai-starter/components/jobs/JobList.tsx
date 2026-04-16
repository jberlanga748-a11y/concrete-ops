import Link from "next/link";
import type { JobListRow } from "@/lib/db/queries";
import {
  DataTable,
  EmptyState,
  tableCellClassName,
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
      />
    );
  }

  return (
    <DataTable
      headers={["Job", "Customer", "Status"]}
      emptyState={null}
      mobileCards={
        <div className="space-y-3">
          {jobs.map((job) => (
            <Link key={job.id} href={`/dashboard/jobs/${job.id}`} className="block rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{job.job_number}</p>
              <p className="mt-2 text-lg font-semibold text-zinc-950">{job.name}</p>
              <p className="mt-2 text-sm text-zinc-600">{getCustomerName(job.customers)}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-700">{job.status}</span>
                <span className="text-sm font-medium text-zinc-700">Open Job Hub</span>
              </div>
            </Link>
          ))}
        </div>
      }
    >
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
    </DataTable>
  );
}
