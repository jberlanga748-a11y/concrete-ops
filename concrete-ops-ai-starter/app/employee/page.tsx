import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Job } from "@/lib/db/schema";
import { EmptyState, PageActionLink, PageHeader, Section, StatCard, surfaceClassName } from "@/components/ui/primitives";
import { AppIcon } from "@/components/ui/icons";

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
  const uploadCount = (uploads ?? []).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Personal Workspace"
        title="Employee Home"
        description="Check your shift status, jump into the day’s tasks, and keep uploads and compliance work close at hand."
        action={
          <div className="flex flex-wrap gap-3">
            <PageActionLink href="/employee/time">Open Time</PageActionLink>
            <Link href="/employee/uploads" className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100">
              Add Upload
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Shift Status" value={isClockedIn ? "Clocked In" : "Not Clocked In"} hint={openEntry ? `Since ${openEntry.clock_in_at}` : "No active shift right now"} icon="clock" tone={isClockedIn ? "success" : "neutral"} />
        <StatCard label="Recent Uploads" value={uploadCount} hint="Latest files you sent from the field" icon="upload" />
        <StatCard label="Policies" value="Review" hint="Open policies whenever a signature is needed" icon="shield" />
        <StatCard label="PPE" value="Status" hint="Check issued items and replacement dates" icon="hardhat" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Section title="Today’s focus" description="The essentials for getting through the shift cleanly on mobile or desktop.">
          <div className="grid gap-3">
            <div className={`${surfaceClassName} rounded-2xl p-4`}>
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-700">
                  <AppIcon icon="clock" className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-medium text-zinc-950">{isClockedIn ? "You’re on the clock" : "Start your shift"}</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {isClockedIn ? "Use the time screen to switch jobs or clock out when the shift wraps." : "Pick your job and clock in from the time screen to start tracking today’s hours."}
                  </p>
                </div>
              </div>
            </div>
            <div className={`${surfaceClassName} rounded-2xl p-4`}>
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-700">
                  <AppIcon icon="upload" className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-medium text-zinc-950">Upload field proof while it’s fresh</p>
                  <p className="mt-1 text-sm text-zinc-600">Photos and documents are easiest to keep organized when they’re uploaded right from the work area.</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Quick Links" description="Everyday employee tasks, without extra navigation.">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <Link href="/employee/time" className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100">Time</Link>
            <Link href="/employee/policies" className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100">Policies</Link>
            <Link href="/employee/ppe" className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100">PPE</Link>
            <Link href="/employee/uploads" className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100">Uploads</Link>
          </div>
        </Section>
      </div>

      <Section title="My Recent Uploads" description="Your latest photos and supporting documents live here.">
        <ul className="mt-3 space-y-3 text-sm">
          {(uploads ?? []).map((upload) => (
            <li key={upload.id} className="rounded-2xl border border-zinc-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-zinc-950">{upload.file_name}</p>
                  <p className="text-zinc-600">{getJobLabel(upload.jobs as Pick<Job, "job_number" | "name">[] | Pick<Job, "job_number" | "name"> | null)}</p>
                </div>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-zinc-700">{upload.tag}</span>
              </div>
              <p className="text-zinc-600">Tag: {upload.tag}</p>
              <p className="text-zinc-600">{upload.note || "—"}</p>
              <p className="mt-2 text-xs text-zinc-500">{upload.created_at}</p>
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
      </Section>
    </div>
  );
}
