import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Job } from "@/lib/db/schema";
import { EmptyState, PageActionLink, PageHeader, SectionCard, surfaceClassName } from "@/components/ui/primitives";

function getJobLabel(jobs: Pick<Job, "job_number" | "name">[] | Pick<Job, "job_number" | "name"> | null) {
  if (!jobs) return "—";
  if (Array.isArray(jobs)) {
    const job = jobs[0];
    return job ? `${job.job_number} · ${job.name}` : "—";
  }

  return `${jobs.job_number} · ${jobs.name}`;
}

export default async function EmployeeHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/employee");
  }

  const { data: appUser } = await supabase.from("users").select("id").eq("auth_user_id", user.id).maybeSingle();

  if (!appUser) {
    redirect("/login");
  }

  const { data: employee } = await supabase.from("employees").select("id").eq("user_id", appUser.id).maybeSingle();

  const [{ data: openEntry }, { data: uploads }] = await Promise.all([
    employee
      ? supabase
          .from("time_entries")
          .select("id, clock_in_at, status")
          .eq("employee_id", employee.id)
          .is("clock_out_at", null)
          .in("status", ["clocked_in", "on_break"])
          .order("clock_in_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("job_files")
      .select("id, file_name, tag, note, created_at, jobs(job_number, name)")
      .eq("uploaded_by_user_id", appUser.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const isClockedIn = Boolean(openEntry);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Personal Workspace"
        title="Employee Home"
        description="Check your current shift, jump into everyday tasks, and keep your recent field uploads close at hand."
        action={<PageActionLink href="/employee/time">Open Time</PageActionLink>}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className={`${surfaceClassName} rounded-2xl p-4`}>
          <p className="text-sm text-zinc-500">Current Clock Status</p>
          <p className="mt-2 text-2xl font-semibold">{isClockedIn ? "Clocked In" : "Not Clocked In"}</p>
          <p className="mt-1 text-sm text-zinc-600">{openEntry ? `Since ${openEntry.clock_in_at}` : "No active shift."}</p>
          <Link href="/employee/time" className="mt-4 inline-block rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white">
            Go to Time Entry
          </Link>
        </div>

        <div className={`${surfaceClassName} rounded-2xl p-4`}>
          <h2 className="text-lg font-semibold">Quick Links</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/employee/time" className="rounded-xl border px-4 py-2 text-sm">Time</Link>
            <Link href="/employee/policies" className="rounded-xl border px-4 py-2 text-sm">Policies</Link>
            <Link href="/employee/ppe" className="rounded-xl border px-4 py-2 text-sm">PPE</Link>
            <Link href="/employee/uploads" className="rounded-xl border px-4 py-2 text-sm">Uploads</Link>
          </div>
        </div>
      </div>

      <SectionCard title="My Recent Uploads" description="Your latest photos and supporting documents live here.">
        <ul className="mt-3 space-y-3 text-sm">
          {(uploads ?? []).map((upload) => (
            <li key={upload.id} className="rounded-xl border p-3">
              <p className="font-medium">{upload.file_name}</p>
              <p className="text-zinc-600">{getJobLabel(upload.jobs as Pick<Job, "job_number" | "name">[] | Pick<Job, "job_number" | "name"> | null)}</p>
              <p className="text-zinc-600">Tag: {upload.tag}</p>
              <p className="text-zinc-600">{upload.note || "—"}</p>
              <p className="text-zinc-500">{upload.created_at}</p>
            </li>
          ))}
          {(uploads ?? []).length === 0 ? (
            <li>
              <EmptyState
                title="No uploads yet"
                description="Add your first photo or document from the employee uploads page."
                action={<PageActionLink href="/employee/uploads">Open Uploads</PageActionLink>}
              />
            </li>
          ) : null}
        </ul>
      </SectionCard>
    </div>
  );
}
