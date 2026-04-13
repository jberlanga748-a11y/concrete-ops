import { EmployeeClockCard } from "@/components/time/EmployeeClockCard";
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

  const [{ data: entries }, { jobOptions, employeeOptions, phaseOptions }] = await Promise.all([
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
          Employee clock in/out writes live time entries, and admin reads the same records below.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <EmployeeClockCard
          employeeOptions={employeeOptions}
          jobOptions={jobOptions}
          phaseOptions={phaseOptions}
        />

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Admin Labor</h2>

          <form className="flex flex-wrap gap-3 rounded-2xl border bg-white p-4" method="get">
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

            <button type="submit" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white">
              Apply filters
            </button>
          </form>

          <AdminLaborTable entries={entries ?? []} />
        </div>
      </div>
    </div>
  );