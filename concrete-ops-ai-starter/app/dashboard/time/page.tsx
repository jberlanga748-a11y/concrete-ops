import { AdminLaborTable } from "@/components/time/AdminLaborTable";
import { EmployeeClockCard } from "@/components/time/EmployeeClockCard";
import { ErrorPanel } from "@/components/ui/feedback";
import { getTimeEntries, getTimeFilterOptions, type TimeOption } from "@/lib/db/queries";
import Link from "next/link";

function formatHours(value: number) {
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: value > 0 && value < 10 && value % 1 !== 0 ? 1 : 0,
    maximumFractionDigits: 1,
  }).format(value)} hrs`;
}

function getOptionLabel(options: TimeOption[], id: string) {
  return options.find((option) => option.id === id)?.label ?? null;
}

function HeroMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-300">{detail}</p>
    </article>
  );
}

function FilterField({
  label,
  name,
  defaultValue,
  options,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: TimeOption[];
  placeholder: string;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-[20px] border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

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
  const hasFilters = Boolean(selectedJobId || selectedEmployeeId);
  const selectedJobLabel = selectedJobId ? getOptionLabel(jobOptions, selectedJobId) : null;
  const selectedEmployeeLabel = selectedEmployeeId ? getOptionLabel(employeeOptions, selectedEmployeeId) : null;
  const openEntries = timeEntries.filter((entry) => !entry.clock_out_at).length;
  const onBreakEntries = timeEntries.filter((entry) => entry.status === "on_break").length;
  const loggedHours = timeEntries.reduce((total, entry) => total + (entry.total_hours ?? 0), 0);
  const trackedEmployees = new Set(timeEntries.map((entry) => entry.employee_id).filter(Boolean)).size;
  const trackedJobs = new Set(timeEntries.map((entry) => entry.job_id).filter(Boolean)).size;
  const latestActivity =
    timeEntries.length === 0
      ? "Ready for the first shift"
      : timeEntries[0]?.clock_out_at
        ? "Recent clock-out recorded on this board"
        : "Open shift recently started on this board";
  const resultCountLabel = `${timeEntries.length} entr${timeEntries.length === 1 ? "y" : "ies"}`;
  const scopeChips = [
    hasFilters ? "Filtered live board" : "All crews in view",
    selectedJobLabel ? `Job · ${selectedJobLabel}` : null,
    selectedEmployeeLabel ? `Crew · ${selectedEmployeeLabel}` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-[36px] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.2),transparent_34%),linear-gradient(135deg,#181c19_0%,#242826_48%,#0f1110_100%)] px-6 py-6 text-white shadow-[0_28px_80px_rgba(15,23,42,0.24)] sm:px-8 sm:py-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 border-l border-white/5 bg-[linear-gradient(150deg,rgba(255,255,255,0.06),transparent_42%,rgba(251,191,36,0.12))] lg:block" />
        <div className="absolute -left-12 top-16 h-40 w-40 rounded-full bg-amber-300/[0.15] blur-3xl" />
        <div className="absolute bottom-0 right-10 h-36 w-36 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex rounded-full border border-white/[0.12] bg-white/[0.08] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-200">
                Field Ops Control
              </span>
              {scopeChips.map((chip) => (
                <span
                  key={chip}
                  className="inline-flex rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs font-medium text-zinc-200"
                >
                  {chip}
                </span>
              ))}
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-[3.1rem]">
              Time &amp; Labor built like a field control room, not a spreadsheet.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
              Clock crews in fast, keep open shifts visible, and review the live labor ledger with the polished feel of a
              premium industrial workspace.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard/jobs"
                className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-5 py-3 text-sm font-semibold text-zinc-950 shadow-[0_18px_44px_rgba(245,158,11,0.28)] transition hover:bg-amber-300"
              >
                Open jobs
              </Link>
              {hasFilters ? (
                <Link
                  href="/dashboard/time"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Reset filters
                </Link>
              ) : null}
              <p className="inline-flex items-center rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-zinc-200">
                Latest movement
                <span className="ml-2 font-semibold text-white">{latestActivity}</span>
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[480px]">
            <HeroMetric
              label="Open Shifts"
              value={openEntries.toString()}
              detail={onBreakEntries > 0 ? `${onBreakEntries} entries are paused or on break` : "No breaks flagged in this view"}
            />
            <HeroMetric
              label="Logged Hours"
              value={formatHours(loggedHours)}
              detail={`${resultCountLabel} are currently visible in the labor board`}
            />
            <HeroMetric
              label="Crew In View"
              value={trackedEmployees.toString()}
              detail={selectedEmployeeLabel ? "Focused on a single employee selection" : "Cross-crew visibility stays intact"}
            />
            <HeroMetric
              label="Jobs In View"
              value={trackedJobs.toString()}
              detail={selectedJobLabel ? "Labor ledger tightened around one assignment" : "Labor remains readable across active jobs"}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.96fr)_minmax(0,1.3fr)]">
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
              <div className="space-y-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-600">Labor Board</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                      Live labor ledger with fast assignment filters.
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                      Keep the labor board readable for supervisors, operations, and payroll by focusing on exactly the crew
                      member or job you need.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                      {resultCountLabel}
                    </span>
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                      {openEntries} open
                    </span>
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                      {formatHours(loggedHours)}
                    </span>
                  </div>
                </div>

                <form
                  method="get"
                  className="grid gap-3 rounded-[28px] border border-zinc-200 bg-[linear-gradient(180deg,rgba(250,250,249,1)_0%,rgba(245,245,244,0.92)_100%)] p-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]"
                >
                  <FilterField
                    label="Filter by job"
                    name="jobId"
                    defaultValue={selectedJobId}
                    options={jobOptions}
                    placeholder="All jobs"
                  />
                  <FilterField
                    label="Filter by employee"
                    name="employeeId"
                    defaultValue={selectedEmployeeId}
                    options={employeeOptions}
                    placeholder="All employees"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center self-end rounded-[20px] bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                  >
                    Apply filters
                  </button>
                  <Link
                    href="/dashboard/time"
                    className="inline-flex items-center justify-center self-end rounded-[20px] border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
                  >
                    Reset view
                  </Link>
                </form>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
