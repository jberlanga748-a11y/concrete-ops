import Link from "next/link";
import { notFound } from "next/navigation";
import { getDailyReportById, type DailyReportDetailRow } from "@/lib/db/queries";

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

export default async function DailyReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: report } = await getDailyReportById(id);

  if (!report) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Daily Report Details</h1>
            <p className="mt-2 text-zinc-600">{getJobLabel(report.jobs)}</p>
          </div>
          <Link href="/dashboard/daily-reports" className="rounded-xl border px-4 py-2 text-sm">
            Back to Reports
          </Link>
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border bg-white p-6 shadow-sm">
        <p>
          <span className="font-medium">Report date:</span> {report.report_date}
        </p>
        <p>
          <span className="font-medium">Submitted by:</span> {getSubmitter(report.users)}
        </p>
        <div>
          <p className="font-medium">Work completed</p>
          <p className="mt-1 whitespace-pre-wrap text-zinc-700">{report.work_completed}</p>
        </div>
        <div>
          <p className="font-medium">Delays / issues</p>
          <p className="mt-1 whitespace-pre-wrap text-zinc-700">{report.delays_issues || "—"}</p>
        </div>
        <div>
          <p className="font-medium">Materials / deliveries</p>
          <p className="mt-1 whitespace-pre-wrap text-zinc-700">{report.materials_deliveries || "—"}</p>
        </div>
        <div>
          <p className="font-medium">Safety notes</p>
          <p className="mt-1 whitespace-pre-wrap text-zinc-700">{report.safety_notes || "—"}</p>
        </div>
      </div>
    </div>
  );
}
