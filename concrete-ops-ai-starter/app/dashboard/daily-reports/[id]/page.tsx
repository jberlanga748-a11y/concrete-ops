import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentList } from "@/components/documents/DocumentList";
import { RecordDeliveryCard } from "@/components/exports/RecordDeliveryCard";
import { AppIcon } from "@/components/ui/icons";
import {
  PageHeader,
  Section,
  StatCard,
  StatusPill,
  secondaryButtonClassName,
} from "@/components/ui/primitives";
import {
  getDailyReportById,
  getDailyReportCrewEntries,
  getDocumentsForEntity,
  type DailyReportCrewEntryRow,
  type DailyReportDetailRow,
} from "@/lib/db/queries";

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

  const reportCrewEntries = crewEntries ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Daily Reports"
        title={getJobLabel(report.jobs)}
        description={`Field report for ${formatDate(report.report_date)} submitted by ${getSubmitter(report.users)}.`}
        action={
          <div className="flex flex-wrap gap-3">
            <Link href={`/dashboard/daily-reports/${report.id}/edit`} className={secondaryButtonClassName}>
              Edit Report
            </Link>
            <Link href="/dashboard/daily-reports" className={secondaryButtonClassName}>
              Back to Reports
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Report Date" value={formatDate(report.report_date)} hint="Field activity for this day." icon="clipboard" tone="warning" />
        <StatCard label="Submitted By" value={getSubmitter(report.users)} hint="Recorded from the field workflow." icon="users" tone="info" />
        <StatCard label="Crew Rows" value={reportCrewEntries.length} hint="Crew members and hours captured here." icon="check" tone="success" />
        <StatCard label="Documents" value={documents?.length ?? 0} hint="Linked photos and files for this report." icon="upload" tone="neutral" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr,0.7fr]">
        <Section title="Work Completed" description="Primary field summary for the day.">
          <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-700">{report.work_completed}</p>
        </Section>

        <Section title="Summary" description="Key report metadata at a glance.">
          <div className="space-y-3 text-sm text-zinc-700">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3">
              <span>Job</span>
              <span className="font-medium text-zinc-900">{getJobLabel(report.jobs)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3">
              <span>Submitted By</span>
              <span className="font-medium text-zinc-900">{getSubmitter(report.users)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3">
              <span>Crew Count</span>
              <StatusPill tone="success">{reportCrewEntries.length} rows</StatusPill>
            </div>
          </div>
        </Section>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <Section title="Delays / Issues">
          <p className="whitespace-pre-wrap text-sm text-zinc-700">{report.delays_issues || "—"}</p>
        </Section>
        <Section title="Materials / Deliveries">
          <p className="whitespace-pre-wrap text-sm text-zinc-700">{report.materials_deliveries || "—"}</p>
        </Section>
        <Section title="Safety Notes">
          <p className="whitespace-pre-wrap text-sm text-zinc-700">{report.safety_notes || "—"}</p>
        </Section>
      </section>

      <RecordDeliveryCard
        title="PDF + Email"
        description="Open a field-ready daily report PDF or send/resend it by email."
        recordType="daily_report"
        recordId={report.id}
        pdfUrl={`/api/daily-reports/${report.id}/pdf`}
        defaultSubject={`Daily report ${report.report_date}`}
      />

      <Section title="Crew Entries" description="Crew hours and notes tied to this report.">
        <ul className="space-y-3 text-sm">
          {reportCrewEntries.map((entry) => {
            const employee = getCrewEmployee(entry.employees);
            return (
              <li key={entry.id} className="rounded-[24px] border border-zinc-200 bg-zinc-50/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-zinc-900">{employee?.full_name || "Employee"}</p>
                    <p className="mt-1 text-zinc-600">
                      {[employee?.job_title, employee?.crew_name].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <StatusPill tone="info">{entry.hours} hrs</StatusPill>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-zinc-700">{entry.notes || "—"}</p>
              </li>
            );
          })}
          {reportCrewEntries.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-zinc-200 px-4 py-6 text-zinc-600">
              No crew rows added to this report yet.
            </li>
          ) : null}
        </ul>
      </Section>

      <Section
        title="Documents"
        description="Photos and files linked to this report."
        action={
          <Link href={`/dashboard/uploads?dailyReportId=${report.id}`} className={secondaryButtonClassName}>
            View Uploads
          </Link>
        }
      >
        <DocumentList documents={documents ?? []} emptyMessage="No documents linked to this daily report yet." />
      </Section>

      <Section title="Recent activity" description="The report now lives alongside PDF delivery, linked files, and crew hours.">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 text-sm text-zinc-700">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
              <AppIcon icon="document" className="h-4 w-4" />
            </div>
            Open the PDF card to share or resend a report from the same screen.
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 text-sm text-zinc-700">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <AppIcon icon="upload" className="h-4 w-4" />
            </div>
            Linked documents stay visible here so the field story is easy to review.
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 text-sm text-zinc-700">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <AppIcon icon="users" className="h-4 w-4" />
            </div>
            Crew rows stay readable on mobile instead of falling into a dense table layout.
          </div>
        </div>
      </Section>
    </div>
  );
}
