import { EmployeeClockCard } from "@/components/time/EmployeeClockCard";
import { AdminLaborTable } from "@/components/time/AdminLaborTable";
import { AppIcon } from "@/components/ui/icons";
import {
  PageHeader,
  Section,
  StatCard,
  StatusPill,
  primaryButtonClassName,
  selectClassName,
} from "@/components/ui/primitives";
import { getTimeEntries, getTimeFilterOptions } from "@/lib/db/queries";

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

  const timeEntries = entries ?? [];
  const activeEntries = timeEntries.filter((entry) => entry.status === "clocked_in").length;
  const completedEntries = timeEntries.filter((entry) => entry.status !== "clocked_in").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Field Ops"
        title="Time & Labor"
        description="Run live clock-in workflows, review crew time with cleaner filters, and keep payroll-facing labor records readable on desktop and mobile."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Filtered Entries" value={timeEntries.length} hint="Live results after your current filters." icon="clock" tone="warning" />
        <StatCard label="Clocked In" value={activeEntries} hint="Crew members with an active entry right now." icon="users" tone="success" />
        <StatCard label="Closed Entries" value={completedEntries} hint="Completed labor entries already captured." icon="check" tone="info" />
        <StatCard label="Available Jobs" value={jobOptions.length} hint="Jobs ready for labor tracking." icon="hammer" tone="neutral" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <EmployeeClockCard
          employeeOptions={employeeOptions}
          jobOptions={jobOptions}
          phaseOptions={phaseOptions}
        />

        <Section title="Admin Labor" description="Filter the live time table by job or employee and keep the field picture easy to scan.">
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-orange-100 p-3 text-orange-600">
                  <AppIcon icon="truck" className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-zinc-900">Field-first workflow</p>
                  <p className="mt-1 text-sm text-zinc-600">Clock tools stay simple while office filters stay useful.</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
              <StatusPill tone="info">Live sync</StatusPill>
              <p className="mt-3 text-sm text-zinc-600">Employee and admin time tools update the same records.</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
              <StatusPill tone="warning">Mobile ready</StatusPill>
              <p className="mt-3 text-sm text-zinc-600">Labor tables collapse into cards so review still works in the field.</p>
            </div>
          </div>

          <form className="flex flex-wrap gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4" method="get">
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

          <div className="mt-4">
            <AdminLaborTable entries={timeEntries} />
          </div>
        </Section>
      </div>
    </div>
  );
}
