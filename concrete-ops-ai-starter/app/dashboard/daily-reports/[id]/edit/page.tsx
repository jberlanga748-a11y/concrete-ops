import Link from "next/link";
import { notFound } from "next/navigation";
import { DailyReportForm } from "@/components/daily-reports/DailyReportForm";
import { PageHeader, Section, StatCard, secondaryButtonClassName } from "@/components/ui/primitives";
import {
  getActiveJobAssignmentOptions,
  getDailyReportById,
  getDailyReportCrewEntries,
  getDailyReportJobOptions,
} from "@/lib/db/queries";

export default async function EditDailyReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ data: report }, { data: crewEntries }, jobOptions, assignmentOptions] = await Promise.all([
    getDailyReportById(id),
    getDailyReportCrewEntries(id),
    getDailyReportJobOptions(),
    getActiveJobAssignmentOptions(),
  ]);

  if (!report) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Daily Reports"
        title="Edit Daily Report"
        description="Update field notes and crew rows without changing the existing reporting workflow."
        action={
          <Link href={`/dashboard/daily-reports/${report.id}`} className={secondaryButtonClassName}>
            Back to Report
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Job Options" value={jobOptions.length} hint="Available jobs for report editing." icon="hammer" tone="warning" />
        <StatCard label="Crew Options" value={assignmentOptions.length} hint="Assigned crew available for crew rows." icon="users" tone="info" />
        <StatCard label="Crew Rows" value={(crewEntries ?? []).length} hint="Existing rows already tied to this report." icon="check" tone="success" />
        <StatCard label="Edit Goal" value="Keep it simple" hint="The form stays field-friendly on mobile and desktop." icon="truck" tone="neutral" />
      </div>

      <Section title="Update the field story" description="Keep notes, materials, safety items, and crew hours aligned before saving the report.">
        <DailyReportForm
          reportId={report.id}
          jobOptions={jobOptions}
          assignmentOptions={assignmentOptions}
          initialValues={{
            jobId: report.job_id,
            reportDate: report.report_date,
            workCompleted: report.work_completed,
            delaysIssues: report.delays_issues,
            materialsDeliveries: report.materials_deliveries,
            safetyNotes: report.safety_notes,
            crewEntries: (crewEntries ?? []).map((entry) => ({
              employeeId: entry.employee_id,
              hours: entry.hours,
              notes: entry.notes,
            })),
          }}
        />
      </Section>
    </div>
  );
}
