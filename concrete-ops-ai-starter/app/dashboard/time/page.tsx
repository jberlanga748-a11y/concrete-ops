import { EmployeeClockCard } from "@/components/time/EmployeeClockCard";
import { AdminLaborTable } from "@/components/time/AdminLaborTable";
import { getTimeEntries, getTimeFilterOptions } from "@/lib/db/queries";
import { PageHeader, selectClassName, primaryButtonClassName, SectionCard } from "@/components/ui/primitives";

export default async function TimePage({
  searchParams,
}: {
  searchParams?: { jobId?: string; employeeId?: string };
}) {
  const selectedJobId =
    typeof searchParams?.jobId === "string" ? searchParams.jobId.trim() : "";
  const selectedEmployeeId =
    typeof searchParams?.employeeId === "string" ? searchParams.employeeId.trim() : "";

  const [{ data: entries }, { jobOptions, employeeOptions, phaseOptions }] = await Promise.all([
    getTimeEntries({
      jobId: selectedJobId || undefined,
      employeeId: selectedEmployeeId || undefined,
    }),
    getTimeFilterOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Time & Labor"
        description="Employee clock in/out writes live time entries, and admin reads the same records below."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <EmployeeClockCard
          employeeOptions={employeeOptions}
          jobOptions={jobOptions}
          phaseOptions={phaseOptions}
        />

        <SectionCard title="Admin Labor" description="Filter the live time table by job or employee.">
          <form className="flex flex-wrap gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4" method="get">
            <select
              name="jobId"
              defaultValue={selectedJobId}
              className={selectClassName}
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
              className={selectClassName}
            >
              <option value="">All employees</option>
              {employeeOptions.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.label}
                </option>
              ))}
            </select>

            <button type="submit" className={primaryButtonClassName}>
              Apply filters
            </button>
          </form>

          <AdminLaborTable entries={entries ?? []} />
        </SectionCard>
      </div>
    </div>
  );
}
