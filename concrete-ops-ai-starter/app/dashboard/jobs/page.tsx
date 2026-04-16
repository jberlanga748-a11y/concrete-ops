import Link from "next/link";
import { JobList } from "@/components/jobs/JobList";
import { ErrorPanel } from "@/components/ui/feedback";
import { TableToolbar } from "@/components/ui/table";
import { getJobs } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Field Ops</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">Jobs</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600">
              Browse every active project and jump straight into the Job Hub for crew activity, documents, assignments, and field follow-up.
            </p>
          </div>
          {!isForeman ? (
            <Link
              href="/dashboard/jobs/new"
              className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(249,115,22,0.28)] transition hover:bg-orange-400"
            >
              New Job
            </Link>
          ) : null}
        </div>
      </div>

      {error ? (
        <ErrorPanel
          title="We couldn’t load jobs right now"
          description="The job board didn’t come back cleanly. Try refreshing the page or come back in a moment."
          actionHref="/dashboard/jobs"
          actionLabel="Try again"
        />
      ) : (
        <JobList
          jobs={data ?? []}
          canManage={!isForeman}
          toolbar={
            <TableToolbar
              title="Project board"
              description="Open a job to manage field activity, documents, assignments, and project-level actions."
              countLabel={`${(data ?? []).length} job${(data ?? []).length === 1 ? "" : "s"}`}
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
            />
          }
        />
      )}
    </div>
  );
}
