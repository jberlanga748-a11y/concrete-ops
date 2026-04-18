import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState, ErrorPanel } from "@/components/ui/feedback";
import { createClient } from "@/lib/supabase/server";
import type { Job } from "@/lib/db/schema";
import { formatTimestamp } from "@/lib/time/formatting";

function getJobLabel(jobs: Pick<Job, "job_number" | "name">[] | Pick<Job, "job_number" | "name"> | null) {
  if (!jobs) return "—";
  if (Array.isArray(jobs)) {
    const job = jobs[0];
    return job ? `${job.job_number} · ${job.name}` : "—";
  }

  return `${jobs.job_number} · ${jobs.name}`;
}

function EmployeePortalError({
  description,
}: {
  description: string;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Employee Portal</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">Your portal is signed in, but we couldn&apos;t load the latest employee data.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
          Core employee tools depend on your linked profile, time activity, and recent uploads. When one of those services is unavailable, the portal pauses here instead of showing misleading empty data.
        </p>
      </section>

      <ErrorPanel
        title="We couldn’t load your employee portal right now"
        description={description}
        actionHref="/employee"
        actionLabel="Try again"
      />
    </div>
  );
}

export default async function EmployeeHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/employee");
  }

  const { data: appUser, error: appUserError } = await supabase.from("users").select("id").eq("auth_user_id", user.id).maybeSingle();

  if (appUserError) {
    return (
      <EmployeePortalError description="We couldn’t verify your app profile against the employee portal. Try refreshing the page or come back in a moment." />
    );
  }

  if (!appUser) {
    redirect("/login");
  }

  const { data: employee, error: employeeError } = await supabase.from("employees").select("id").eq("user_id", appUser.id).maybeSingle();

  if (employeeError) {
    return (
      <EmployeePortalError description="We couldn’t load your linked employee profile right now. Try refreshing the page or ask the office to check your account setup." />
    );
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Employee Portal</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">Your account is signed in, but your employee profile is not ready yet.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
            Time, uploads, PPE, and policy acknowledgments all depend on an employee record. Once the office links your profile, this portal will populate automatically.
          </p>
        </section>

        <EmptyState
          icon="users"
          title="Waiting on employee setup"
          description="Ask an owner or office admin to create or reconnect your employee record so your assignments, compliance items, and self-service tools can appear here."
          actionHref="/employee/policies"
          actionLabel="Open policies"
        />
      </div>
    );
  }

  const [
    { data: openEntry, error: openEntryError },
    { data: uploads, error: uploadsError },
  ] = await Promise.all([
    supabase
      .from("time_entries")
      .select("id, clock_in_at, status")
      .eq("employee_id", employee.id)
      .is("clock_out_at", null)
      .in("status", ["clocked_in", "on_break"])
      .order("clock_in_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("job_files")
      .select("id, file_name, tag, note, created_at, jobs(job_number, name)")
      .eq("uploaded_by_user_id", appUser.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (openEntryError || uploadsError) {
    return (
      <EmployeePortalError description="We couldn’t load your latest shift or upload activity. Try refreshing the page or come back in a moment." />
    );
  }

  const allUploads = uploads ?? [];
  const isClockedIn = Boolean(openEntry);
  const uniqueJobs = new Set(
    allUploads
      .map((upload) => getJobLabel(upload.jobs as Pick<Job, "job_number" | "name">[] | Pick<Job, "job_number" | "name"> | null))
      .filter((label) => label !== "—")
  );

  const stats = [
    {
      label: "Shift Status",
      value: isClockedIn ? "Clocked In" : "Not Clocked In",
      detail: isClockedIn ? "You already have an active shift." : "Start your day from the time board.",
    },
    {
      label: "Active Since",
      value: openEntry ? formatTimestamp(openEntry.clock_in_at, { includeYear: false }) : "—",
      detail: openEntry ? `Current state: ${openEntry.status.replaceAll("_", " ")}` : "No active shift on file.",
    },
    {
      label: "Recent Uploads",
      value: allUploads.length.toString(),
      detail: allUploads[0]?.created_at ? `Latest: ${formatTimestamp(allUploads[0].created_at, { includeYear: false })}` : "No uploads yet",
    },
    {
      label: "Jobs Documented",
      value: uniqueJobs.size.toString(),
      detail: uniqueJobs.size > 0 ? "Jobs referenced in your recent uploads." : "No jobs attached to uploads yet.",
    },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Employee Portal</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">Know your shift, your uploads, and your next task at a glance.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
              This home screen keeps the basics in reach so you can clock time, upload field proof, and stay current on required safety items without hunting around the app.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/employee/time"
              className="inline-flex items-center justify-center rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Go to Time Entry
            </Link>
            <Link
              href="/employee/uploads"
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
            >
              Open Uploads
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{stat.label}</p>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950">{stat.value}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{stat.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr,1fr]">
        <article className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Today</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">Stay ready for the shift</h2>
            </div>
            <Link href="/employee/time" className="text-sm font-medium text-orange-600 hover:text-orange-500">
              Open time
            </Link>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-medium text-zinc-900">Clock status</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {isClockedIn
                  ? `You are currently ${openEntry?.status.replaceAll("_", " ")} and your shift started at ${formatTimestamp(openEntry?.clock_in_at, { includeYear: false })}.`
                  : "You do not have an active shift right now. Start with the time board when you are ready to work."}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-medium text-zinc-900">Recommended next step</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {allUploads.length > 0
                  ? "If you captured field photos or paperwork today, keep them organized by uploading them before the shift wraps."
                  : "If you have jobsite photos, delivery slips, or field proof, upload them so the office has clean documentation."}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-orange-200 bg-orange-50 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Quick access</p>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  Keep your daily essentials close: time entry, uploads, policies, and PPE all live in one place.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/employee/policies" className="rounded-2xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50">
                  Policies
                </Link>
                <Link href="/employee/ppe" className="rounded-2xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50">
                  PPE
                </Link>
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Quick Actions</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">Common tasks</h2>
          </div>

          <div className="mt-5 space-y-3">
            {[
              {
                href: "/employee/time",
                title: "Update shift status",
                detail: "Clock in, take a break, or wrap the day from the time board.",
              },
              {
                href: "/employee/uploads",
                title: "Upload jobsite proof",
                detail: "Keep photos and documents organized for the office team.",
              },
              {
                href: "/employee/policies",
                title: "Review policies",
                detail: "Stay current on anything waiting for acknowledgment.",
              },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="block rounded-2xl border border-zinc-200 px-4 py-4 transition hover:border-orange-300 hover:bg-orange-50"
              >
                <p className="text-sm font-semibold text-zinc-950">{action.title}</p>
                <p className="mt-1 text-sm leading-6 text-zinc-600">{action.detail}</p>
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Recent Activity</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">Your latest uploads</h2>
          </div>
          <Link href="/employee/uploads" className="text-sm font-medium text-orange-600 hover:text-orange-500">
            View all uploads
          </Link>
        </div>

        <ul className="mt-5 space-y-3 text-sm">
          {allUploads.map((upload) => (
            <li key={upload.id} className="rounded-[24px] border border-zinc-200 bg-zinc-50/70 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-base font-semibold text-zinc-950">{upload.file_name}</p>
                  <p className="mt-1 text-zinc-600">
                    {getJobLabel(upload.jobs as Pick<Job, "job_number" | "name">[] | Pick<Job, "job_number" | "name"> | null)}
                  </p>
                  <p className="mt-1 text-zinc-600">Tag: {upload.tag}</p>
                  <p className="mt-1 text-zinc-600">{upload.note || "No note added."}</p>
                </div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {formatTimestamp(upload.created_at, { includeYear: false })}
                </p>
              </div>
            </li>
          ))}
          {allUploads.length === 0 ? (
            <li>
              <EmptyState
                icon="file"
                title="No uploads yet"
                description="Once you add field photos, delivery slips, or other jobsite proof, your latest files will show here for quick review."
                actionHref="/employee/uploads"
                actionLabel="Add first upload"
              />
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
