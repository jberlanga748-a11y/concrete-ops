import Link from "next/link";
import { JobList } from "@/components/jobs/JobList";
import { ErrorPanel } from "@/components/ui/feedback";
import { TableToolbar } from "@/components/ui/table";
import { getJobs } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";

function getCustomerName(customers: { name: string }[] | { name: string } | null) {
  if (!customers) return null;
  if (Array.isArray(customers)) return customers[0]?.name ?? null;
  return customers.name;
}

export default async function JobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: appUser } = user
    ? await supabase.from("users").select("role").eq("auth_user_id", user.id).maybeSingle()
    : { data: null };
  const isForeman = appUser?.role === "foreman";
  const { data, error } = await getJobs();
  const jobs = data ?? [];
  const liveJobs = jobs.filter((job) => !["completed", "archived"].includes(job.status)).length;
  const onHoldJobs = jobs.filter((job) => job.status === "on_hold").length;
  const customerCount = new Set(jobs.map((job) => getCustomerName(job.customers)).filter(Boolean)).size;

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-zinc-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(245,247,248,0.92))] p-6 shadow-[0_20px_48px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.4fr,0.95fr] xl:items-start">
          <div>
            <p className="font-app-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Jobs Workflow</p>
            <h1 className="mt-4 text-[clamp(2rem,3vw,3.5rem)] font-semibold tracking-[-0.06em] text-[#101828]">Run project setup and handoff from a cleaner job board.</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-600 sm:text-base">
              Keep planning details, assigned ownership, and schedule visibility tight before teams move into the Job Hub for daily execution.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {!isForeman ? (
                <Link
                  href="/dashboard/jobs/new"
                  className="inline-flex items-center justify-center rounded-[22px] bg-[#101828] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1b2432]"
                >
                  Create job
                </Link>
              ) : null}
              <Link
                href="/dashboard/uploads"
                className="inline-flex items-center justify-center rounded-[22px] border border-zinc-200 bg-white px-5 py-3.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
              >
                Review uploads
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#18232d] bg-[#0f1820] p-5 text-zinc-100 shadow-[0_24px_60px_rgba(15,23,42,0.2)] sm:p-6">
            <p className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">Board Snapshot</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Jobs on board</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">{jobs.length}</p>
                <p className="mt-1 text-sm text-zinc-300">Total project records in this workspace.</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Live planning</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">{liveJobs}</p>
                <p className="mt-1 text-sm text-zinc-300">Jobs still moving through active planning or execution.</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Needs attention</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">{onHoldJobs}</p>
                <p className="mt-1 text-sm text-zinc-300">{customerCount} customers represented across the board.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <ErrorPanel
          title="We couldn’t load jobs right now"
          description="The job board didn’t come back cleanly. Try refreshing the page or come back in a moment."
          actionHref="/dashboard/jobs"
          actionLabel="Try again"
        />
      ) : (
        <JobList
          jobs={jobs}
          canManage={!isForeman}
          toolbar={
            <TableToolbar
              title="Project board"
              description="Open a job to manage field activity, documents, assignments, and the planning details that keep office and field teams aligned."
              countLabel={`${jobs.length} job${jobs.length === 1 ? "" : "s"}`}
              actions={
                !isForeman ? (
                  <Link
                    href="/dashboard/jobs/new"
                    className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:border-orange-300 hover:bg-orange-50"
                  >
                    Add job
                  </Link>
                ) : null
              }
            >
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-[20px] border border-white bg-white/80 px-4 py-3">
                  <p className="font-app-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Active jobs</p>
                  <p className="mt-2 text-lg font-semibold tracking-[-0.04em] text-zinc-950">{liveJobs}</p>
                </div>
                <div className="rounded-[20px] border border-white bg-white/80 px-4 py-3">
                  <p className="font-app-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">On hold</p>
                  <p className="mt-2 text-lg font-semibold tracking-[-0.04em] text-zinc-950">{onHoldJobs}</p>
                </div>
                <div className="rounded-[20px] border border-white bg-white/80 px-4 py-3">
                  <p className="font-app-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Customers</p>
                  <p className="mt-2 text-lg font-semibold tracking-[-0.04em] text-zinc-950">{customerCount}</p>
                </div>
              </div>
            </TableToolbar>
          }
        />
      )}
    </div>
  );
}
