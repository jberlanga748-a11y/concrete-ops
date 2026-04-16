import { JobList } from "@/components/jobs/JobList";
import Link from "next/link";
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
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Jobs</h1>
            <p className="mt-3 text-zinc-600">Browse all jobs and open the Job Hub for full project activity, reports, uploads, and change orders.</p>
          </div>
          {!isForeman ? (
            <Link href="/dashboard/jobs/new" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white">
              New Job
            </Link>
          ) : null}
        </div>
      </div>
      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-700">{error.message}</div>
      ) : (
        <JobList jobs={data ?? []} />
      )}
    </div>
  );
}
