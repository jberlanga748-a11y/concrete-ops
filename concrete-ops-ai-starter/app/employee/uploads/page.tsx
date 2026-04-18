import { EmployeeAssignmentsState, EmployeeSetupState } from "@/components/employee/EmployeePortalStates";
import { EmployeeUploadForm } from "@/components/uploads/EmployeeUploadForm";
import { ErrorPanel } from "@/components/ui/feedback";
import type { DailyReportOption, TimeOption } from "@/lib/db/queries";
import type { Job } from "@/lib/db/schema";
import { getEmployeePortalContext } from "@/lib/employee/portal";

export default async function EmployeeUploadsPage() {
  const { supabase, appUser, employee, assignedJobIds, contextError } = await getEmployeePortalContext("/employee/uploads");

  if (!employee) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold">Employee Uploads</h1>
          <p className="mt-3 text-zinc-600">Upload progress photos or supporting documents.</p>
        </div>

        {contextError ? (
          <ErrorPanel
            title="We couldn’t load your employee setup"
            description="Your upload workspace could not confirm the employee record linked to this login right now. Try again, and if it keeps happening, let the office know."
            actionHref="/employee/uploads"
            actionLabel="Try again"
          />
        ) : (
          <EmployeeSetupState actionHref="/employee" actionLabel="Back to portal home" />
        )}
      </div>
    );
  }

  if (assignedJobIds.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold">Employee Uploads</h1>
          <p className="mt-3 text-zinc-600">Upload progress photos or supporting documents.</p>
        </div>

        <EmployeeAssignmentsState
          title="No active job assignments are ready for uploads"
          description="Uploads stay tied to your active job assignments. Once you are assigned to a live job, you will be able to attach photos and documents here."
          actionHref="/employee"
          actionLabel="Back to portal home"
        />
      </div>
    );
  }

  const [{ data: jobs, error: jobsError }, { data: reports, error: reportsError }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, job_number, name")
      .eq("company_id", appUser.companyId)
      .in("id", assignedJobIds)
      .order("job_number", { ascending: true }),
    supabase
      .from("daily_reports")
      .select("id, job_id, report_date, jobs(job_number, name)")
      .eq("company_id", appUser.companyId)
      .in("job_id", assignedJobIds)
      .order("report_date", { ascending: false })
      .limit(100),
  ]);

  const jobOptions = (jobs ?? []).map((job: Pick<Job, "id" | "job_number" | "name">) => ({
    id: job.id,
    label: `${job.job_number} · ${job.name}`,
  })) satisfies TimeOption[];

  const dailyReportOptions = (reports ?? []).map((report: {
    id: string;
    job_id: string;
    report_date: string;
    jobs: Pick<Job, "job_number" | "name">[] | Pick<Job, "job_number" | "name"> | null;
  }) => {
    const job = Array.isArray(report.jobs) ? report.jobs[0] : report.jobs;
    const jobLabel = job ? `${job.job_number} · ${job.name}` : "Job";
    return {
      id: report.id,
      label: `${report.report_date} · ${jobLabel}`,
      jobId: report.job_id,
    };
  }) satisfies DailyReportOption[];

  const pageError = contextError || jobsError?.message || reportsError?.message || null;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">Employee Uploads</h1>
        <p className="mt-3 text-zinc-600">
          Upload progress photos or supporting documents. You can currently file uploads against {jobOptions.length} active job
          assignment{jobOptions.length === 1 ? "" : "s"}.
        </p>
      </div>

      {pageError ? (
        <ErrorPanel
          title="We couldn’t fully load your upload workspace"
          description="Assigned jobs or daily reports are unavailable right now. Try refreshing this page, and if the issue keeps showing up, let the office know."
          actionHref="/employee/uploads"
          actionLabel="Try again"
        />
      ) : null}

      <EmployeeUploadForm jobOptions={jobOptions} dailyReportOptions={dailyReportOptions} />
    </div>
  );
}
