import Link from "next/link";
import type { JobListRow } from "@/lib/db/queries";
import {
  DataTable,
  EmptyState,
  StatusPill,
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
            <Link key={job.id} href={`/dashboard/jobs/${job.id}`} className="block rounded-[28px] border border-zinc-200/80 bg-white/95 p-4 shadow-[0_16px_36px_rgba(24,24,27,0.08)] transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_20px_42px_rgba(24,24,27,0.12)]">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{job.job_number}</p>
              <p className="mt-2 text-lg font-semibold text-zinc-950">{job.name}</p>
              <p className="mt-2 text-sm text-zinc-600">{getCustomerName(job.customers)}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <StatusPill tone="warning">{job.status}</StatusPill>
                <span className="text-sm font-medium text-orange-600">Open Job Hub</span>
              </div>
            </Link>
          ))}
        </div>
      }
    >
      {jobs.map((job) => (
            <tr key={job.id} className="border-t border-zinc-200 transition hover:bg-orange-50/50">
              <td className={tableCellClassName}>
                <Link href={`/dashboard/jobs/${job.id}`} className="font-medium text-zinc-900 hover:text-orange-600 hover:underline">
                  {job.job_number} · {job.name}
                </Link>
              </td>
              <td className={tableCellClassName}>{getCustomerName(job.customers)}</td>
              <td className={tableCellClassName}>
                <StatusPill tone="warning">{job.status}</StatusPill>
              </td>
            </tr>
      ))}
    </DataTable>
  );
}
