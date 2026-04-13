import Link from "next/link";

type JobRow = {
  id: string;
  job_number: string;
  name: string;
  status: string;
  customers?: { name: string } | null;
};

export function JobList({ jobs }: { jobs: JobRow[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-zinc-100">
          <tr>
            <th className="px-4 py-3 text-left">Job</th>
            <th className="px-4 py-3 text-left">Customer</th>
            <th className="px-4 py-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-t">
              <td className="px-4 py-4">
                <Link href={`/jobs/${job.id}`} className="font-medium hover:underline">
                  {job.job_number} · {job.name}
                </Link>
              </td>
              <td className="px-4 py-4">{job.customers?.name ?? "—"}</td>
              <td className="px-4 py-4">{job.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
