"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { JobTimeEntryRow } from "@/lib/db/queries";
import { EmptyState } from "@/components/ui/feedback";
import { ZonedDateTime } from "@/components/time/ZonedDateTime";
import { getViewerTimeZone } from "@/lib/time/formatting";

function getEmployeeName(employees: JobTimeEntryRow["employees"]) {
  if (!employees) return "—";
  if (Array.isArray(employees)) return employees[0]?.full_name ?? "—";
  return employees.full_name;
}

function getPhaseName(jobPhases: JobTimeEntryRow["job_phases"]) {
  if (!jobPhases) return "—";
  if (Array.isArray(jobPhases)) return jobPhases[0]?.name ?? "—";
  return jobPhases.name;
}

function getJobLabel(jobs: JobTimeEntryRow["jobs"]) {
  if (!jobs) return "—";
  if (Array.isArray(jobs)) {
    const job = jobs[0];
    return job ? `${job.job_number} · ${job.name}` : "—";
  }

  return `${jobs.job_number} · ${jobs.name}`;
}

function formatHours(value: number | null | undefined) {
  if (value == null) return "—";

  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: value > 0 && value < 10 && value % 1 !== 0 ? 1 : 0,
    maximumFractionDigits: 2,
  }).format(value)} h`;
}

function getStatusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function getStatusClasses(status: string) {
  if (status === "clocked_in") return "border-sky-200 bg-sky-50 text-sky-800";
  if (status === "on_break") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-zinc-200 bg-zinc-100 text-zinc-700";
}

function SummaryTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: ReactNode;
  detail: string;
}) {
  return (
    <article className="rounded-[24px] border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-3 text-xl font-semibold tracking-tight text-zinc-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{detail}</p>
    </article>
  );
}

function DetailPair({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{label}</dt>
      <dd className="text-sm font-medium text-zinc-900">{value}</dd>
    </div>
  );
}

export function AdminLaborTable({
  entries,
  toolbar,
}: {
  entries: JobTimeEntryRow[];
  toolbar?: ReactNode;
}) {
  const [timeZone, setTimeZone] = useState("UTC");

  useEffect(() => {
    setTimeZone(getViewerTimeZone());
  }, []);

  const openEntries = entries.filter((entry) => !entry.clock_out_at).length;
  const onBreakEntries = entries.filter((entry) => entry.status === "on_break").length;
  const loggedHours = entries.reduce((total, entry) => total + (entry.total_hours ?? 0), 0);

  return (
    <section className="overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.08)]">
      {toolbar ? <div className="border-b border-zinc-200 px-5 py-5 sm:px-6">{toolbar}</div> : null}

      {entries.length === 0 ? (
        <div className="p-5 sm:p-6">
          <EmptyState
            icon="clock"
            title="No time entries match this view"
            description="Adjust the filters or add a new clock entry above to start building the labor log for this period."
            actionHref="/dashboard/time"
            actionLabel="Clear filters"
          />
        </div>
      ) : (
        <>
          <div className="border-b border-zinc-200 bg-[linear-gradient(180deg,rgba(250,250,249,1)_0%,rgba(245,245,244,0.94)_100%)] px-5 py-4 sm:px-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Browser timezone · {timeZone}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryTile
                label="Open Shifts"
                value={openEntries.toString()}
                detail={onBreakEntries > 0 ? `${onBreakEntries} entries are paused or on break` : "No breaks flagged in this view"}
              />
              <SummaryTile label="Logged Hours" value={formatHours(loggedHours)} detail="Recorded totals from the entries in view" />
              <SummaryTile
                label="Latest Movement"
                value={<ZonedDateTime value={entries[0]?.clock_out_at ?? entries[0]?.clock_in_at} timeZone={timeZone} />}
                detail="Most recent clock activity on this board"
              />
            </div>
          </div>

          <div className="space-y-3 p-4 md:hidden">
            {entries.map((entry) => {
              const employeeName = getEmployeeName(entry.employees);
              const jobLabel = getJobLabel(entry.jobs);
              const phaseName = getPhaseName(entry.job_phases);

              return (
                <article key={entry.id} className="rounded-[26px] border border-zinc-200 bg-zinc-50/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Crew Member</p>
                      <h3 className="mt-2 text-base font-semibold tracking-tight text-zinc-950">{employeeName}</h3>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusClasses(entry.status)}`}
                    >
                      {getStatusLabel(entry.status)}
                    </span>
                  </div>

                  <div className="mt-4 rounded-[22px] border border-zinc-200 bg-white p-4">
                    <p className="text-sm font-semibold text-zinc-950">{jobLabel}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">
                      {phaseName === "—" ? "No phase tagged" : `Phase · ${phaseName}`}
                    </p>

                    <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                      <DetailPair label="Clock in" value={<ZonedDateTime value={entry.clock_in_at} timeZone={timeZone} />} />
                      <DetailPair
                        label="Clock out"
                        value={<ZonedDateTime value={entry.clock_out_at} timeZone={timeZone} emptyLabel="Still open" />}
                      />
                      <DetailPair label="Hours" value={entry.clock_out_at ? formatHours(entry.total_hours) : "In progress"} />
                    </dl>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-950 text-white">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300">Crew Member</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300">Assignment</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300">Clock In</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300">Clock Out</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300">Hours</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {entries.map((entry) => {
                  const employeeName = getEmployeeName(entry.employees);
                  const jobLabel = getJobLabel(entry.jobs);
                  const phaseName = getPhaseName(entry.job_phases);

                  return (
                    <tr key={entry.id} className="transition hover:bg-amber-50/40">
                      <td className="px-5 py-4 align-top">
                        <p className="font-semibold text-zinc-950">{employeeName}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-500">
                          {entry.clock_out_at ? "Recorded shift" : "Active shift"}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <p className="font-medium text-zinc-950">{jobLabel}</p>
                        <p className="mt-1 text-sm leading-6 text-zinc-600">
                          {phaseName === "—" ? "No phase tagged" : `Phase · ${phaseName}`}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top text-zinc-700">
                        <ZonedDateTime value={entry.clock_in_at} timeZone={timeZone} />
                      </td>
                      <td className="px-5 py-4 align-top text-zinc-700">
                        <ZonedDateTime value={entry.clock_out_at} timeZone={timeZone} emptyLabel="Still open" />
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span className="font-semibold text-zinc-950">
                          {entry.clock_out_at ? formatHours(entry.total_hours) : "In progress"}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusClasses(entry.status)}`}
                        >
                          {getStatusLabel(entry.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
