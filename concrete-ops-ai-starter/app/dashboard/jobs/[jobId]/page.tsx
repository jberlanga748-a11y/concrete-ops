import Link from "next/link";
import { notFound } from "next/navigation";
import { JobAssignmentsCard } from "@/components/jobs/JobAssignmentsCard";
import {
  getJobById,
  getJobAssignments,
  getEmployeeOptions,
  getTimeEntries,
} from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

export default async function JobHubPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: appUser } = user
    ? await supabase.from("users").select("role").eq("auth_user_id", user.id).maybeSingle()
    : { data: null };
  const isForeman = appUser?.role === "foreman";

  const { data: job } = await getJobById(jobId);

  if (!job) notFound();

  const [{ data: timeEntries }, { data: assignments }, employeeOptions] = await Promise.all([
    getTimeEntries({ jobId }),
    getJobAssignments(jobId),
    getEmployeeOptions(),
  ]);

  const allTimeEntries = timeEntries ?? [];
  const allAssignments = assignments ?? [];

  const activeCrew = allTimeEntries.filter(
    (entry) => entry.status === "clocked_in"
  ).length;

  const customer = Array.isArray(job.customers)
    ? job.customers[0]
    : job.customers;
  const foreman = Array.isArray(job.foreman_employee)
    ? job.foreman_employee[0]
    : job.foreman_employee;
  const activeAssignments = allAssignments.filter((assignment) => assignment.is_active);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">
              {job.job_number} · {job.name}
            </h1>
            <p className="mt-2 text-zinc-600">{job.status}</p>
          </div>
          {!isForeman ? (
            <Link href={`/dashboard/jobs/${job.id}/edit`} className="rounded-xl border px-4 py-2 text-sm hover:bg-zinc-50">
              Edit Job
            </Link>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Customer</h2>
          <p className="mt-2">{customer?.name || "—"}</p>
          <p className="mt-1 text-sm text-zinc-600">
            {[customer?.contact_name, customer?.phone, customer?.email].filter(Boolean).join(" · ") || "No contact details"}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Foreman</h2>
          <p className="mt-2">{foreman?.full_name || "—"}</p>
          <p className="mt-1 text-sm text-zinc-600">
            {[foreman?.job_title, foreman?.crew_name].filter(Boolean).join(" · ") || "No foreman assigned"}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Schedule</h2>
          <p className="mt-2 text-sm text-zinc-700">Start: {formatDate(job.start_date)}</p>
          <p className="mt-1 text-sm text-zinc-700">Target Finish: {formatDate(job.target_finish_date)}</p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Address</h2>
          <p className="mt-2 text-sm text-zinc-700 whitespace-pre-wrap">{job.address || "—"}</p>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Description</h2>
        <p className="mt-2 text-sm text-zinc-700 whitespace-pre-wrap">{job.description || "—"}</p>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Assigned Crew</h2>
            <p className="mt-1 text-sm text-zinc-600">{activeCrew} currently clocked in</p>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs uppercase tracking-wide text-zinc-600">
            {activeAssignments.length} active assignments
          </span>
        </div>

        <ul className="mt-4 space-y-3 text-sm">
          {activeAssignments.map((assignment) => {
            const employee = Array.isArray(assignment.employees) ? assignment.employees[0] : assignment.employees;
            return (
              <li key={assignment.id} className="rounded-2xl border p-3">
                <p className="font-medium">{employee?.full_name || "Employee"}</p>
                <p className="mt-1 text-zinc-600">
                  {[assignment.assignment_role, employee?.job_title, employee?.crew_name].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-1 text-zinc-500">
                  {formatDate(assignment.start_date)} to {formatDate(assignment.end_date)}
                </p>
              </li>
            );
          })}
          {activeAssignments.length === 0 ? <li className="text-zinc-600">No active crew assignments yet.</li> : null}
        </ul>
      </section>

      {!isForeman ? <JobAssignmentsCard jobId={jobId} assignments={allAssignments} employeeOptions={employeeOptions} /> : null}

      <Link href="/dashboard/jobs" className="underline">
        Back to Jobs
      </Link>
    </div>
  );
}
