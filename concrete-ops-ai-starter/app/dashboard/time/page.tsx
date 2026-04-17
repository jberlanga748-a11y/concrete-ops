import { AdminLaborTable } from "@/components/time/AdminLaborTable";
import { EmployeeClockCard } from "@/components/time/EmployeeClockCard";
import { ErrorPanel } from "@/components/ui/feedback";
import { TableToolbar } from "@/components/ui/table";
import { getTimeEntries, getTimeFilterOptions } from "@/lib/db/queries";
import Link from "next/link";

export default async function TimePage({
  searchParams,
}: {
  searchParams?: { jobId?: string; employeeId?: string };
}) {
  const selectedJobId = typeof searchParams?.jobId === "string" ? searchParams.jobId.trim() : "";
  const selectedEmployeeId = typeof searchParams?.employeeId === "string" ? searchParams.employeeId.trim() : "";

  const [{ data: entries, error }, { jobOptions, employeeOptions, phaseOptions }] = await Promise.all([
    getTimeEntries({
      jobId: selectedJobId || undefined,
      employeeId: selectedEmployeeId || undefined,
    }),
    getTimeFilterOptions(),
  ]);

  const timeEntries = entries ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Field Ops</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">Time &amp; Labor</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600">
              Clock field time, review labor activity, and filter the live labor log without leaving the same workspace.
            </p>
          </div>
          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
          >
            Open jobs
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.96fr,1.3fr]">
        <EmployeeClockCard employeeOptions={employeeOptions} jobOptions={jobOptions} phaseOptions={phaseOptions} />

        {error ? (
          <ErrorPanel
            title="We couldn’t load labor entries right now"
            description="The labor log is temporarily unavailable. Try refreshing the page or come back in a moment."
            actionHref="/dashboard/time"
            actionLabel="Try again"
          />
        ) : (
          <AdminLaborTable
            entries={timeEntries}
            toolbar={
              <TableToolbar
                title="Admin labor log"
                description="Filter by job or employee to find the time entries you need without digging through the full board."
                countLabel={`${timeEntries.length} entr${timeEntries.length === 1 ? "y" : "ies"}`}
              >
                <form method="get" className="flex flex-wrap items-end gap-3">
                  <div className="min-w-[220px] flex-1">
                    <label className="mb-2 block text-sm font-medium text-zinc-700">Job</label>
                    <select
                      name="jobId"
                      defaultValue={selectedJobId}
                      className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm"
                    >
                      <option value="">All jobs</option>
                      {jobOptions.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="min-w-[220px] flex-1">
                    <label className="mb-2 block text-sm font-medium text-zinc-700">Employee</label>
                    <select
                      name="employeeId"
                      defaultValue={selectedEmployeeId}
                      className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm"
                    >
                      <option value="">All employees</option>
                      {employeeOptions.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                  >
                    Apply filters
                  </button>
                  <Link
                    href="/dashboard/time"
                    className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
                  >
                    Reset
                  </Link>
                </form>
              </TableToolbar>
            }
          />
        )}
      </div>
    </div>
  );
}
