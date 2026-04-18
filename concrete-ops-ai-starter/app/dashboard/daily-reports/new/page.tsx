import Link from "next/link";
import { DailyReportForm } from "@/components/daily-reports/DailyReportForm";
import { getActiveJobAssignmentOptions, getDailyReportJobOptions } from "@/lib/db/queries";

export default async function NewDailyReportPage() {
  const [jobOptions, assignmentOptions] = await Promise.all([
    getDailyReportJobOptions(),
    getActiveJobAssignmentOptions(),
  ]);

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-zinc-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(245,247,248,0.92))] p-6 shadow-[0_20px_48px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.35fr,0.95fr] xl:items-start">
          <div>
            <Link
              href="/dashboard/daily-reports"
              className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500 transition hover:text-zinc-900"
            >
              Back to daily reports
            </Link>
            <p className="mt-4 font-app-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Daily reports workflow</p>
            <h1 className="mt-3 text-[clamp(2rem,3vw,3.4rem)] font-semibold tracking-[-0.06em] text-[#101828]">
              Capture a daily record the office can trust without a cleanup pass later.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-600 sm:text-base">
              Start with the job, date, and production notes that matter most. This pass keeps the reporting workflow focused on readable field records, cleaner crew context, and faster office review.
            </p>
          </div>

          <div className="rounded-[28px] border border-[#18232d] bg-[#0f1820] p-5 text-zinc-100 shadow-[0_20px_48px_rgba(15,23,42,0.18)] sm:p-6">
            <p className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">Submission inputs</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Available jobs</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">{jobOptions.length}</p>
                <p className="mt-1 text-sm text-zinc-300">Projects ready to receive a new report.</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Active crew options</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">{assignmentOptions.length}</p>
                <p className="mt-1 text-sm text-zinc-300">Scoped employee assignments available for crew rows.</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Required inputs</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">3</p>
                <p className="mt-1 text-sm text-zinc-300">Job, report date, and work completed are required.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <DailyReportForm jobOptions={jobOptions} assignmentOptions={assignmentOptions} />
    </div>
  );
}
