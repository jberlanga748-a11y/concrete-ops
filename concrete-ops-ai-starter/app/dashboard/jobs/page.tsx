import { JobList } from "@/components/jobs/JobList";
import Link from "next/link";
import { InlineNotice, PageActionLink, PageHeader } from "@/components/ui/primitives";
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
      <PageHeader
        title="Jobs"
        description="Browse all jobs and open the Job Hub for project activity, reports, uploads, and change orders."
        action={!isForeman ? <PageActionLink href="/dashboard/jobs/new">New Job</PageActionLink> : undefined}
      />
      {error ? (
        <InlineNotice tone="error">We couldn’t load jobs right now. Please refresh and try again.</InlineNotice>
      ) : (
        <JobList jobs={data ?? []} />
      )}
    </div>
  );
}
