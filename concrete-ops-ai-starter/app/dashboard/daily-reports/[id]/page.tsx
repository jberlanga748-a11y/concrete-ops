import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentList } from "@/components/documents/DocumentList";
import { RecordDeliveryCard } from "@/components/exports/RecordDeliveryCard";
import { ViewerDateTime } from "@/components/time/ViewerDateTime";
import { EmptyState } from "@/components/ui/feedback";
import {
  getDailyReportById,
  getDailyReportCrewEntries,
  getDocumentsForEntity,
  type DailyReportCrewEntryRow,
  type DailyReportDetailRow,
} from "@/lib/db/queries";
import { formatDateOnly } from "@/lib/time/formatting";

function getJobLabel(jobs: DailyReportDetailRow["jobs"]) {
  if (!jobs) return "—";
  if (Array.isArray(jobs)) {
    const job = jobs[0];
    return job ? `${job.job_number} · ${job.name}` : "—";
  }

  return `${jobs.job_number} · ${jobs.name}`;
}

function getSubmitter(users: DailyReportDetailRow["users"]) {
  if (!users) return "—";
  if (Array.isArray(users)) return users[0]?.full_name ?? "—";
  return users.full_name;
}

function getCrewEmployee(entry: DailyReportCrewEntryRow["employees"]) {
  if (!entry) return null;
  if (Array.isArray(entry)) return entry[0] ?? null;
  return entry;
}

export default async function DailyReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ data: report }, { data: crewEntries }, { data: documents }] = await Promise.all([
    getDailyReportById(id),
    getDailyReportCrewEntries(id),
    getDocumentsForEntity("daily_report", id),
  ]);

  if (!report) notFound();

  const jobLabel = getJobLabel(report.jobs);
  const submitter = getSubmitter(report.users);
  const allCrewEntries = crewEntries ?? [];
  const allDocuments = documents ?? [];
  const totalCrewHours = allCrewEntries.reduce((sum, entry) => sum + (Number(entry.hours) || 0), 0);
  const overviewCards = [
    {
      label: "Filed by",
      value: submitter,
      detail: `Report date ${formatDateOnly(report.report_date)}`,
    },
    {
      label: "Crew rows",
      value: String(allCrewEntries.length),
      detail: `${totalCrewHours.toFixed(2)} hrs logged across the report.`,
    },
    {
      label: "Documents",
      value: String(allDocuments.length),
      detail: allDocuments.length > 0 ? "Photos and files are linked to this report." : "No files linked yet.",
    },
    {
      label: "Last update",
      value: <ViewerDateTime value={report.updated_at || report.created_at} />,
      detail: "Most recent record activity captured on this report.",
    },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="rounded-[32px] border border-zinc-900 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 p-6 text-white shadow-[0_30px_90px_rgba(24,24,27,0.28)] sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <Link
              href="/dashboard/daily-reports"
              className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-orange-300 transition hover:text-orange-200"
            >
              Back to daily reports
            </Link>
            <p className="mt-4 font-app-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Daily report record</p>
            <h1 className="mt-3 text-[clamp(2rem,3vw,3.25rem)] font-semibold tracking-[-0.06em] text-white">
              {formatDateOnly(report.report_date)}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
              {jobLabel}. Filed by {submitter} and kept here as the shared record for production notes, crew context, and downstream follow-up.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
            <Link
              href={`/dashboard/jobs/${report.job_id}`}
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-700 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/10"
            >
              Open job hub
            </Link>
            <Link
              href="/dashboard/daily-reports"
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-700 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/10"
            >
              Back to reports
            </Link>
            <Link
              href={`/dashboard/daily-reports/${report.id}/edit`}
              className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(249,115,22,0.34)] transition hover:bg-orange-400"
            >
              Edit report
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {overviewCards.map((card) => (
          <article
            key={card.label}
            className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)]"
          >
            <p className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">{card.label}</p>
            <p className="mt-4 text-lg font-semibold tracking-[-0.04em] text-zinc-950">{card.value}</p>
            <p className="mt-3 text-sm leading-6 text-zinc-600">{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr,0.75fr]">
        <article className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-6">
          <div>
            <p className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">Work narrative</p>
            <h2 className="mt-3 text-[1.35rem] font-semibold tracking-[-0.04em] text-[#101828]">What moved on site</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              The core production summary this record carries into handoff, coordination, and reporting.
            </p>
          </div>

          <div className="mt-5 rounded-[24px] border border-zinc-200 bg-zinc-50/80 p-5">
            <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-700">{report.work_completed}</p>
          </div>
        </article>

        <div className="space-y-6">
          <article className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-6">
            <p className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">Record overview</p>
            <div className="mt-5 space-y-3">
              <div className="rounded-[20px] border border-zinc-200 bg-zinc-50/80 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Job</p>
                <p className="mt-2 text-sm font-semibold text-zinc-950">{jobLabel}</p>
              </div>
              <div className="rounded-[20px] border border-zinc-200 bg-zinc-50/80 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Report date</p>
                <p className="mt-2 text-sm font-semibold text-zinc-950">{formatDateOnly(report.report_date)}</p>
              </div>
              <div className="rounded-[20px] border border-zinc-200 bg-zinc-50/80 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Submitted by</p>
                <p className="mt-2 text-sm font-semibold text-zinc-950">{submitter}</p>
              </div>
            </div>
          </article>

          <RecordDeliveryCard
            title="PDF + Email"
            description="Open a field-ready daily report PDF or send or resend it by email."
            recordType="daily_report"
            recordId={report.id}
            pdfUrl={`/api/daily-reports/${report.id}/pdf`}
            defaultSubject={`Daily report ${report.report_date}`}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          {
            label: "Delays / issues",
            value: report.delays_issues || "No delays or issues were recorded for this report.",
          },
          {
            label: "Materials / deliveries",
            value: report.materials_deliveries || "No materials or delivery notes were recorded for this report.",
          },
          {
            label: "Safety notes",
            value: report.safety_notes || "No safety notes were recorded for this report.",
          },
        ].map((section) => (
          <article
            key={section.label}
            className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)]"
          >
            <p className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">{section.label}</p>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-700">{section.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <article className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">Crew log</p>
              <h2 className="mt-2 text-[1.35rem] font-semibold tracking-[-0.04em] text-[#101828]">Crew entries tied to this report</h2>
            </div>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
              {totalCrewHours.toFixed(2)} hrs total
            </span>
          </div>

          <ul className="mt-5 grid gap-3 lg:grid-cols-2">
            {allCrewEntries.map((entry) => {
              const employee = getCrewEmployee(entry.employees);
              return (
                <li key={entry.id} className="rounded-[24px] border border-zinc-200 bg-zinc-50/80 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-zinc-950">{employee?.full_name || "Employee"}</p>
                      <p className="mt-2 text-sm text-zinc-600">
                        {[employee?.job_title, employee?.crew_name].filter(Boolean).join(" · ") || "No role or crew context on file."}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600 shadow-sm">
                      {entry.hours} hrs
                    </span>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{entry.notes || "No crew note was captured for this entry."}</p>
                </li>
              );
            })}

            {allCrewEntries.length === 0 ? (
              <li className="lg:col-span-2">
                <EmptyState
                  icon="users"
                  title="No crew rows on this report"
                  description="Crew rows are optional, but they make the report more useful for payroll, staffing questions, and field follow-up."
                  actionHref={`/dashboard/daily-reports/${report.id}/edit`}
                  actionLabel="Add crew rows"
                />
              </li>
            ) : null}
          </ul>
        </article>

        <article className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">Documents</p>
              <h2 className="mt-2 text-[1.35rem] font-semibold tracking-[-0.04em] text-[#101828]">Photos and supporting files</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">Keep uploads and report context tied together for easier team follow-up.</p>
            </div>
            <Link
              href={`/dashboard/uploads?dailyReportId=${report.id}`}
              className="inline-flex items-center justify-center rounded-[20px] border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
            >
              View uploads
            </Link>
          </div>
          <div className="mt-5">
            <DocumentList documents={allDocuments} emptyMessage="No documents linked to this daily report yet." />
          </div>
        </article>
      </section>
    </div>
  );
}
