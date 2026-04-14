import { AdminLaborTable } from "@/components/time/AdminLaborTable";
import { getTimeEntries, getTimeFilterOptions } from "@/lib/db/queries";

export default async function TimePage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string; employeeId?: string }>;
}) {
  const params = await searchParams;
  const selectedJobId = params.jobId?.trim() || "";
  const selectedEmployeeId = params.employeeId?.trim() || "";

  const [{ data: entries }, { jobOptions, employeeOptions }] = await Promise.all([
    getTimeEntries({
      jobId: selectedJobId || undefined,
      employeeId: selectedEmployeeId || undefined,
    }),
    getTimeFilterOptions(),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">Time & Labor</h1>
        <p className="mt-3 text-zinc-600">
          Admin view for reviewing labor activity, filtering time entries, and tracking crew status.
          Employees should clock in and out from the employee portal.
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Admin Labor</h2>
              <p className="mt-2 text-sm text-zinc-600">
                Review time entries by job and employee. Employee clock actions live at
                <span className="ml-1 font-medium text-zinc-900">/employee/time</span>.
              </p>
            </div>
          </div>

          <form className="mt-6 flex flex-wrap gap-3" method="get">
            <select
              name="jobId"
              defaultValue={selectedJobId}
              className="rounded-xl border px-3 py-2 text-sm"
            >
              <option value="">All jobs</option>
              {jobOptions.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.label}
                </option>
              ))}
            </select>

            <select
              name="employeeId"
              defaultValue={selectedEmployeeId}
              className="rounded-xl border px-3 py-2 text-sm"
            >
              <option value="">All employees</option>
              {employeeOptions.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white"
            >
              Apply filters
            </button>
          </form>
        </div>

        <AdminLaborTable entries={entries ?? []} />
      </div>
    </div>
  );
}
