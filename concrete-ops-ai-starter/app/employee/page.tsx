import Link from "next/link";
import { redirect } from "next/navigation";
import { BriefcaseBusinessIcon, Clock3Icon, ShieldCheckIcon, UploadIcon } from "lucide-react";
import { EmptyState, ErrorPanel, StatusChip } from "@/components/ui/feedback";
import { KpiTile, OperationalCard, PageHeader, RecordPreview, SectionHeader } from "@/components/ui/page-primitives";
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
    <div>
      <PageHeader
        eyebrow="Employee Portal"
        title="Your portal is signed in, but we couldn't load the latest employee data."
        description="Core employee tools depend on your linked profile, time activity, and recent uploads. When one of those services is unavailable, the portal pauses here instead of showing misleading empty data."
      />
      <div className="px-5 sm:px-6 lg:px-8">
        <ErrorPanel
          title="We couldn’t load your employee portal right now"
          description={description}
          actionHref="/employee"
          actionLabel="Try again"
        />
      </div>
    </div>
  );
}

export default async function EmployeeHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/employee");

  const { data: appUser, error: appUserError } = await supabase.from("users").select("id").eq("auth_user_id", user.id).maybeSingle();

  if (appUserError) {
    return (
      <EmployeePortalError description="We couldn’t verify your app profile against the employee portal. Try refreshing the page or come back in a moment." />
    );
  }

  if (!appUser) redirect("/login");

  const { data: employee, error: employeeError } = await supabase.from("employees").select("id").eq("user_id", appUser.id).maybeSingle();

  if (employeeError) {
    return (
      <EmployeePortalError description="We couldn’t load your linked employee profile right now. Try refreshing the page or ask the office to check your account setup." />
    );
  }

  if (!employee) {
    return (
      <div>
        <PageHeader
          eyebrow="Employee Portal"
          title="Your account is signed in, but your employee profile is not ready yet."
          description="Time, uploads, PPE, and policy acknowledgments all depend on an employee record. Once the office links your profile, this portal will populate automatically."
        />
        <div className="px-5 sm:px-6 lg:px-8">
          <EmptyState
            icon="users"
            title="Waiting on employee setup"
            description="Ask an owner or office admin to create or reconnect your employee record so your assignments, compliance items, and self-service tools can appear here."
            actionHref="/employee/policies"
            actionLabel="Open policies"
          />
        </div>
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
  const latestUpload = allUploads[0] ?? null;

  return (
    <div>
      <PageHeader
        eyebrow="Employee Portal"
        title="Daily workspace"
        description="A compact field workspace for shift status, upload proof, and safety follow-through. The highest-value actions stay visible without changing the underlying employee workflows."
        actions={
          <>
            <Link href="/employee/time" className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800">
              Time Entry
            </Link>
            <Link href="/employee/uploads" className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-blue-50">
              Uploads
            </Link>
          </>
        }
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiTile label="Shift status" value={isClockedIn ? "Clocked In" : "Ready"} helper={isClockedIn ? "Active shift is open" : "No active shift"} icon={<Clock3Icon className="h-4 w-4" />} />
          <KpiTile label="Active since" value={openEntry ? formatTimestamp(openEntry.clock_in_at, { includeYear: false }) : "—"} helper={openEntry ? openEntry.status.replaceAll("_", " ") : "Start from time entry"} icon={<BriefcaseBusinessIcon className="h-4 w-4" />} />
          <KpiTile label="Recent uploads" value={allUploads.length.toString()} helper={latestUpload ? `Latest ${formatTimestamp(latestUpload.created_at, { includeYear: false })}` : "No uploads yet"} icon={<UploadIcon className="h-4 w-4" />} />
          <KpiTile label="Jobs documented" value={uniqueJobs.size.toString()} helper="Jobs in recent uploads" icon={<ShieldCheckIcon className="h-4 w-4" />} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <OperationalCard className="p-4">
            <SectionHeader
              title="Today's Work Queue"
              description="Keep the field day moving with the few actions employees need most."
            />
            <div className="grid gap-3 md:grid-cols-3">
              {[
                {
                  href: "/employee/time",
                  title: "Update shift status",
                  detail: isClockedIn ? "You have an active shift. Keep breaks and clock-out accurate." : "Clock in when work begins.",
                  status: isClockedIn ? "Active" : "Ready",
                },
                {
                  href: "/employee/uploads",
                  title: "Upload jobsite proof",
                  detail: "Attach photos, tickets, and notes to the right job record.",
                  status: latestUpload ? "Ready" : "Due today",
                },
                {
                  href: "/employee/policies",
                  title: "Review safety items",
                  detail: "Policies and PPE stay close to the daily workspace.",
                  status: "This week",
                },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="rounded-xl border border-blue-100 bg-white p-3 hover:bg-blue-50/50">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-black text-slate-950">{item.title}</p>
                    <StatusChip tone={item.status === "Due today" ? "warning" : "info"}>{item.status}</StatusChip>
                  </div>
                  <p className="mt-2 text-sm font-medium leading-5 text-slate-500">{item.detail}</p>
                </Link>
              ))}
            </div>
          </OperationalCard>

          <RecordPreview
            eyebrow="Latest Upload"
            title={latestUpload?.file_name}
            rows={[
              ["Job", latestUpload ? getJobLabel(latestUpload.jobs as Pick<Job, "job_number" | "name">[] | Pick<Job, "job_number" | "name"> | null) : "—"],
              ["Tag", latestUpload?.tag ?? "—"],
              ["Note", latestUpload?.note || "No note added"],
              ["Created", latestUpload ? formatTimestamp(latestUpload.created_at, { includeYear: false }) : "—"],
            ]}
            actions={
              <Link href="/employee/uploads" className="inline-flex rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">
                Open Uploads
              </Link>
            }
          />
        </div>

        <OperationalCard className="overflow-hidden">
          <div className="p-4">
            <SectionHeader title="Recent Uploads" description="Compact record list for the field proof already attached to your account." />
          </div>
          <div className="divide-y divide-blue-50">
            {allUploads.map((upload) => (
              <div key={upload.id} className="grid gap-2 px-4 py-3 md:grid-cols-[minmax(0,1fr)_180px_120px] md:items-center">
                <div>
                  <p className="font-black text-slate-950">{upload.file_name}</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {getJobLabel(upload.jobs as Pick<Job, "job_number" | "name">[] | Pick<Job, "job_number" | "name"> | null)}
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-600">{upload.tag}</p>
                <p className="text-xs font-black uppercase tracking-widest text-blue-700">
                  {formatTimestamp(upload.created_at, { includeYear: false })}
                </p>
              </div>
            ))}
            {allUploads.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon="file"
                  title="No uploads yet"
                  description="Once you add field photos, delivery slips, or other jobsite proof, your latest files will show here for quick review."
                  actionHref="/employee/uploads"
                  actionLabel="Add first upload"
                />
              </div>
            ) : null}
          </div>
        </OperationalCard>
      </div>
    </div>
  );
}
