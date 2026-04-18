import Link from "next/link";
import type { Job } from "@/lib/db/schema";
import { getEmployeePortalContext } from "@/lib/employee/portal";
import { formatTimestamp } from "@/lib/time/formatting";
import { EmployeeAssignmentsState, EmployeeSetupState } from "@/components/employee/EmployeePortalStates";
import { ErrorPanel } from "@/components/ui/feedback";

function getJobLabel(jobs: Pick<Job, "job_number" | "name">[] | Pick<Job, "job_number" | "name"> | null) {
  if (!jobs) return "—";
  if (Array.isArray(jobs)) {
    const job = jobs[0];
    return job ? `${job.job_number} · ${job.name}` : "—";
  }

  return `${jobs.job_number} · ${jobs.name}`;
}

export default async function EmployeeHomePage() {
  const { supabase, appUser, employee, assignedJobIds, contextError } = await getEmployeePortalContext("/employee");

  const [openEntryResult, uploadsResult, policyResult, ppeResult] = await Promise.all([
    employee
      ? supabase
          .from("time_entries")
          .select("id, clock_in_at, status")
          .eq("company_id", appUser.companyId)
          .eq("employee_id", employee.id)
          .is("clock_out_at", null)
          .in("status", ["clocked_in", "on_break"])
          .order("clock_in_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    employee
      ? supabase
          .from("job_files")
          .select("id, file_name, tag, note, created_at, jobs(job_number, name)")
          .eq("company_id", appUser.companyId)
          .eq("uploaded_by_user_id", appUser.id)
          .order("created_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("policy_acknowledgments")
      .select("id, status, acknowledged_at, policies(is_active)")
      .order("created_at", { ascending: false }),
    employee
      ? supabase
          .from("ppe_items")
          .select("id, status")
          .eq("company_id", appUser.companyId)
          .eq("employee_id", employee.id)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const openEntry = openEntryResult.data ?? null;
  const allUploads = uploadsResult.data ?? [];
  const policyAcknowledgments = policyResult.data ?? [];
  const ppeItems = ppeResult.data ?? [];
  const activePolicyAcknowledgments = policyAcknowledgments.filter((ack: { policies: { is_active: boolean }[] | { is_active: boolean } | null }) => {
    const policy = Array.isArray(ack.policies) ? ack.policies[0] : ack.policies;
    return policy?.is_active;
  });
  const pendingPolicyCount = activePolicyAcknowledgments.filter((ack: { status: string }) => ack.status !== "signed").length;
  const ppeAttentionCount = ppeItems.filter((item: { status: string }) => item.status !== "issued").length;
  const isClockedIn = Boolean(openEntry);
  const pageError =
    contextError ||
    openEntryResult.error?.message ||
    uploadsResult.error?.message ||
    policyResult.error?.message ||
    ppeResult.error?.message ||
    null;

  const stats = employee
    ? [
        {
          label: "Shift Status",
          value: isClockedIn ? "Clocked In" : "Ready",
          detail: isClockedIn ? "You already have an active shift." : "Start your day from the time board when you are ready.",
        },
        {
          label: "Assigned Jobs",
          value: assignedJobIds.length.toString(),
          detail:
            assignedJobIds.length > 0
              ? "These jobs are available for time entry and uploads."
              : "Waiting on the office or foreman to assign your next active job.",
        },
        {
          label: "Pending Policies",
          value: pendingPolicyCount.toString(),
          detail:
            pendingPolicyCount > 0
              ? "Review and sign anything waiting on your acknowledgment."
              : "You are current on active policy acknowledgments.",
        },
        {
          label: "PPE Attention",
          value: ppeAttentionCount.toString(),
          detail:
            ppeAttentionCount > 0
              ? "One or more PPE items need a replacement or fit check."
              : ppeItems.length > 0
                ? "No replacement or fit-check issues are currently flagged."
                : "No PPE items are assigned yet.",
        },
      ]
    : [];

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Employee Portal</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
              {employee ? `Stay shift-ready, ${employee.full_name || appUser.fullName}.` : "Get your employee workspace fully ready."}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
              This home screen keeps time entry, uploads, and compliance tasks in reach so field crews can stay organized
              without bouncing between disconnected pages.
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

      {pageError ? (
        <ErrorPanel
          title="We couldn’t fully load your employee workspace"
          description="Some shift, upload, or compliance details are unavailable right now. Try refreshing this page, and if it keeps happening, let the office know."
          actionHref="/employee"
          actionLabel="Try again"
        />
      ) : null}

      {!employee ? (
        <EmployeeSetupState />
      ) : (
        <>
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

          {assignedJobIds.length === 0 ? (
            <EmployeeAssignmentsState
              title="Your portal is ready, but you do not have an active assignment yet"
              description="Time entry and uploads open automatically once the office or foreman assigns you to an active job. You can still stay current on policies and PPE from this portal."
            />
          ) : null}

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
                    {assignedJobIds.length === 0
                      ? "You are waiting on an active assignment. If you expected one already, check with the office or your foreman."
                      : allUploads.length > 0
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
                    detail:
                      assignedJobIds.length > 0
                        ? "Clock in, clock out, or close an open shift from the time board."
                        : "You can still review time status here, and new clock-ins will unlock once an assignment is active.",
                  },
                  {
                    href: "/employee/uploads",
                    title: "Upload jobsite proof",
                    detail:
                      assignedJobIds.length > 0
                        ? "Keep photos and documents organized for the office team."
                        : "Uploads will unlock automatically after an active assignment is added to your record.",
                  },
                  {
                    href: "/employee/policies",
                    title: "Review policies",
                    detail:
                      pendingPolicyCount > 0
                        ? `${pendingPolicyCount} active policy acknowledgment${pendingPolicyCount === 1 ? "" : "s"} still need your signature.`
                        : "You are current on active policy acknowledgments right now.",
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
                        {getJobLabel(
                          upload.jobs as Pick<Job, "job_number" | "name">[] | Pick<Job, "job_number" | "name"> | null,
                        )}
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
                <li className="rounded-[24px] border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-600">
                  No uploads yet. When you start adding jobsite photos and documents, they will show up here for quick review.
                </li>
              ) : null}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
