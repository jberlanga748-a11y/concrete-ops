import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentList } from "@/components/documents/DocumentList";
import { RecordDeliveryCard } from "@/components/exports/RecordDeliveryCard";
import { ViewerDateTime } from "@/components/time/ViewerDateTime";
import { EmptyState, StatusChip } from "@/components/ui/feedback";
import { OperationalCard, PageHeader, RecordPreview, SectionHeader } from "@/components/ui/page-primitives";
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
  const followUpSections = [
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
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Daily Report"
        title={formatDateOnly(report.report_date)}
        description={`${jobLabel}. Filed by ${submitter} and kept here as the shared record for production notes, crew context, and downstream follow-up.`}
        actions={
          <>
            <Link href={`/dashboard/jobs/${report.job_id}`} className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-blue-50">
              Open job hub
            </Link>
            <Link href="/dashboard/daily-reports" className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-blue-50">
              Back to reports
            </Link>
            <Link href={`/dashboard/daily-reports/${report.id}/edit`} className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800">
              Edit report
            </Link>
          </>
        }
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card) => (
          <OperationalCard key={card.label} className="p-4">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">{card.label}</p>
            <p className="mt-2 text-xl font-black text-slate-950">{card.value}</p>
            <p className="mt-1 text-sm font-bold leading-6 text-slate-500">{card.detail}</p>
          </OperationalCard>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <OperationalCard className="p-4">
          <SectionHeader
            title="What moved on site"
            description="The core production summary this record carries into handoff, coordination, and reporting."
          />
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <p className="whitespace-pre-wrap text-sm font-medium leading-7 text-slate-700">{report.work_completed}</p>
          </div>
        </OperationalCard>

        <div className="space-y-4">
          <RecordPreview
            title={formatDateOnly(report.report_date)}
            rows={[
              ["Job", jobLabel],
              ["Date", formatDateOnly(report.report_date)],
              ["Submitter", submitter],
            ]}
          />

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
        {followUpSections.map((section) => (
          <OperationalCard key={section.label} className="p-4">
            <SectionHeader title={section.label} />
            <p className="whitespace-pre-wrap text-sm font-medium leading-7 text-slate-700">{section.value}</p>
          </OperationalCard>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <OperationalCard className="p-4">
          <SectionHeader
            title="Crew entries tied to this report"
            description="Crew context attached to this field record."
            action={<StatusChip tone="info">{totalCrewHours.toFixed(2)} hrs total</StatusChip>}
          />

          <ul className="grid gap-3 lg:grid-cols-2">
            {allCrewEntries.map((entry) => {
              const employee = getCrewEmployee(entry.employees);
              return (
                <li key={entry.id} className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-black text-slate-950">{employee?.full_name || "Employee"}</p>
                      <p className="mt-2 text-sm font-bold text-slate-500">
                        {[employee?.job_title, employee?.crew_name].filter(Boolean).join(" · ") || "No role or crew context on file."}
                      </p>
                    </div>
                    <StatusChip>{entry.hours} hrs</StatusChip>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">{entry.notes || "No crew note was captured for this entry."}</p>
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
        </OperationalCard>

        <OperationalCard className="p-4">
          <SectionHeader
            title="Photos and supporting files"
            description="Keep uploads and report context tied together for easier team follow-up."
            action={
            <Link
              href={`/dashboard/uploads?dailyReportId=${report.id}`}
              className="inline-flex items-center justify-center rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-blue-50"
            >
              View uploads
            </Link>
            }
          />
          <div className="mt-4">
            <DocumentList documents={allDocuments} emptyMessage="No documents linked to this daily report yet." />
          </div>
        </OperationalCard>
      </section>
      </div>
    </div>
  );
}
