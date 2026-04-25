import Link from "next/link";
import { AdminLaborTable } from "@/components/time/AdminLaborTable";
import { EmployeeClockCard } from "@/components/time/EmployeeClockCard";
import { ErrorPanel } from "@/components/ui/feedback";
import { FilterBar, PageHeader, RecordPreview } from "@/components/ui/page-primitives";
import { TableToolbar } from "@/components/ui/table";
import { getTimeEntries, getTimeFilterOptions, type TimeOption } from "@/lib/db/queries";

function formatHours(value: number) {
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: value > 0 && value < 10 && value % 1 !== 0 ? 1 : 0,
    maximumFractionDigits: 1,
  }).format(value)} hrs`;
}

function getOptionLabel(options: TimeOption[], id: string) {
  return options.find((option) => option.id === id)?.label ?? null;
}

export default async function TimePage({
  searchParams,
}: {
  searchParams?: { jobId?: string; employeeId?: string };
} = {}) {
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
  const hasFilters = Boolean(selectedJobId || selectedEmployeeId);
  const selectedJobLabel = selectedJobId ? getOptionLabel(jobOptions, selectedJobId) : null;
  const selectedEmployeeLabel = selectedEmployeeId ? getOptionLabel(employeeOptions, selectedEmployeeId) : null;
  const openEntries = timeEntries.filter((entry) => !entry.clock_out_at).length;
  const loggedHours = timeEntries.reduce((total, entry) => total + (entry.total_hours ?? 0), 0);
  const latestEntry = timeEntries[0] ?? null;

  return (
    <div>
      <PageHeader
        eyebrow="Field Ops"
        title="Time"
        description="Clock crews in, keep open shifts visible, and review the labor ledger from one dense operational board."
        actions={
          <Link href="/dashboard/jobs" className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-blue-50">
            Open Jobs
          </Link>
        }
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8 xl:grid-cols-[360px_1fr_360px]">
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
            emptyState={
              hasFilters
                ? {
                    title: "No time entries match this filtered view",
                    description: "Clear the filters or widen the selection to bring matching labor activity back into view.",
                    actionHref: "/dashboard/time",
                    actionLabel: "Clear filters",
                  }
                : {
                    title: "No time entries are on the board yet",
                    description: "Clock the crew in above to start building the live labor board for this period.",
                  }
            }
            toolbar={
              <TableToolbar
                title="Labor board"
                description="Filter by crew member or job while keeping the live labor ledger attached to the controls."
                countLabel={`${timeEntries.length} entr${timeEntries.length === 1 ? "y" : "ies"}`}
              />
            }
            filters={
              <FilterBar>
                <form method="get" className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] md:items-center">
                  <select name="jobId" defaultValue={selectedJobId} aria-label="Job" className="h-10 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500">
                    <option value="">All jobs</option>
                    {jobOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select name="employeeId" defaultValue={selectedEmployeeId} aria-label="Employee" className="h-10 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500">
                    <option value="">All employees</option>
                    {employeeOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="h-10 rounded-xl bg-blue-700 px-4 text-sm font-black text-white hover:bg-blue-800">
                    Apply
                  </button>
                  <Link href="/dashboard/time" className="inline-flex h-10 items-center justify-center rounded-xl border border-blue-100 bg-white px-4 text-sm font-black text-slate-700 hover:bg-blue-50">
                    Reset
                  </Link>
                </form>
              </FilterBar>
            }
          />
        )}

        <RecordPreview
          title={latestEntry ? "Labor Snapshot" : undefined}
          rows={[
            ["Job", selectedJobLabel ?? "All jobs"],
            ["Crew", selectedEmployeeLabel ?? "All employees"],
            ["Open", openEntries.toString()],
            ["Hours", formatHours(loggedHours)],
          ]}
        />
      </div>
    </div>
  );
}
