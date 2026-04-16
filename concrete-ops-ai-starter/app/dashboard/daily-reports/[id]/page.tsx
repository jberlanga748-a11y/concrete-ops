import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentList } from "@/components/documents/DocumentList";
import { RecordDeliveryCard } from "@/components/exports/RecordDeliveryCard";
import { EmptyState } from "@/components/ui/feedback";
import { getDailyReportById, getDailyReportCrewEntries, getDocumentsForEntity, type DailyReportCrewEntryRow, type DailyReportDetailRow } from "@/lib/db/queries";

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

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
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

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Daily Report</h1>
            <p className="mt-2 text-zinc-600">{getJobLabel(report.jobs)}</p>
          </div>
          <div className="flex gap-3">
            <Link href={`/dashboard/daily-reports/${report.id}/edit`} className="rounded-xl border px-4 py-2 text-sm hover:bg-zinc-50">
              Edit Report
            </Link>
            <Link href="/dashboard/daily-reports" className="rounded-xl border px-4 py-2 text-sm hover:bg-zinc-50">
              Back to Reports
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Summary</h2>
          <p className="mt-2 text-sm text-zinc-700">Report Date: {formatDate(report.report_date)}</p>
          <p className="mt-1 text-sm text-zinc-700">Submitted By: {getSubmitter(report.users)}</p>
        </section>

        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Crew</h2>
          <p className="mt-2 text-sm text-zinc-700">{(crewEntries ?? []).length} crew row{(crewEntries ?? []).length === 1 ? "" : "s"}</p>
        </section>
      </div>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Work Completed</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{report.work_completed}</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Delays / Issues</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{report.delays_issues || "—"}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Materials / Deliveries</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{report.materials_deliveries || "—"}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Safety Notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{report.safety_notes || "—"}</p>
        </div>
      </section>

      <RecordDeliveryCard
        title="PDF + Email"
        description="Open a field-ready daily report PDF or send/resend it by email."
        recordType="daily_report"
        recordId={report.id}
        pdfUrl={`/api/daily-reports/${report.id}/pdf`}
        defaultSubject={`Daily report ${report.report_date}`}
      />

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Crew Entries</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {(crewEntries ?? []).map((entry) => {
            const employee = getCrewEmployee(entry.employees);
            return (
              <li key={entry.id} className="rounded-2xl border p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{employee?.full_name || "Employee"}</p>
                    <p className="mt-1 text-zinc-600">{[employee?.job_title, employee?.crew_name].filter(Boolean).join(" · ") || "—"}</p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs uppercase tracking-wide text-zinc-600">
                    {entry.hours} hrs
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-zinc-700">{entry.notes || "—"}</p>
              </li>
            );
          })}
          {(crewEntries ?? []).length === 0 ? (
            <li>
              <EmptyState
                icon="users"
                title="No crew rows on this report"
                description="Crew rows are optional, but they help the office understand who was on site and how many hours were worked."
                actionHref={`/dashboard/daily-reports/${report.id}/edit`}
                actionLabel="Add crew rows"
              />
            </li>
          ) : null}
        </ul>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Documents</h2>
            <p className="mt-1 text-sm text-zinc-600">Photos and files linked to this report.</p>
          </div>
          <Link href={`/dashboard/uploads?dailyReportId=${report.id}`} className="rounded-xl border px-4 py-2 text-sm hover:bg-zinc-50">
            View Uploads
          </Link>
        </div>
        <div className="mt-4">
          <DocumentList documents={documents ?? []} emptyMessage="No documents linked to this daily report yet." />
        </div>
      </section>
    </div>
  );
}
