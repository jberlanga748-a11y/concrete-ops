import Link from "next/link";
import { notFound } from "next/navigation";
import { getChangeOrders, getDailyReports, getJobFiles, getTimeEntries, type ChangeOrderListRow, type DailyReportListRow, type JobFileRow, type JobTimeEntryRow } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";

type JobHubRow = {
  id: string;
  job_number: string;
  name: string;
  status: string;
  address: string | null;
  start_date: string | null;
  target_finish_date: string | null;
  customers:
    | { name: string; contact_name: string | null; phone: string | null; email: string | null }
    | { name: string; contact_name: string | null; phone: string | null; email: string | null }[]
    | null;
};

function getEmployeeName(employees: JobTimeEntryRow["employees"]) {
  if (!employees) return "—";
  if (Array.isArray(employees)) return employees[0]?.full_name ?? "—";
  return employees.full_name;
}

function getJobLabel(jobs: JobTimeEntryRow["jobs"] | DailyReportListRow["jobs"] | JobFileRow["jobs"] | ChangeOrderListRow["jobs"]) {
  if (!jobs) return "—";
  if (Array.isArray(jobs)) {
    const job = jobs[0];
    return job ? `${job.job_number} · ${job.name}` : "—";
  }

  return `${jobs.job_number} · ${jobs.name}`;
}

function getSubmitter(users: DailyReportListRow["users"] | JobFileRow["users"], employees?: JobFileRow["employees"]) {
  if (users) {
    if (Array.isArray(users)) return users[0]?.full_name ?? "—";
    return users.full_name;
  }

  if (employees) {
    if (Array.isArray(employees)) return employees[0]?.full_name ?? "—";
    return employees.full_name;
  }

  return "—";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
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

  const { data: job } = await supabase
    .from("jobs")
    .select("id, job_number, name, status, address, start_date, target_finish_date, customers(name, contact_name, phone, email)")
    .eq("id", jobId)
    .maybeSingle<JobHubRow>();

  if (!job) notFound();

  const [{ data: timeEntries }, { data: reports }, { data: uploads }, { data: changeOrders }] = await Promise.all([
    getTimeEntries({ jobId }),
    getDailyReports({ jobId }),
    getJobFiles({ jobId }),
    getChangeOrders({ jobId }),
  ]);

  const allTimeEntries = timeEntries ?? [];
  const allReports = reports ?? [];
  const allUploads = uploads ?? [];
  const allChangeOrders = changeOrders ?? [];

  const recentTimeEntries = allTimeEntries.slice(0, 5);
  const recentReports = allReports.slice(0, 5);
  const recentUploads = allUploads.slice(0, 5);
  const recentChangeOrders = allChangeOrders.slice(0, 5);

  const activeCrew = allTimeEntries.filter((entry) => entry.status === "clocked_in").length;
  const customer = Array.isArray(job.customers) ? job.customers[0] : job.customers;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Job Hub</p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 sm:text-3xl">{job.job_number} · {job.name}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full border bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">Status: {job.status.replaceAll("_", " ")}</span>
          <span className="rounded-full border bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">Start: {formatDate(job.start_date)}</span>
          <span className="rounded-full border bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">Target Finish: {formatDate(job.target_finish_date)}</span>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Customer Info</h2>
          <div className="mt-3 space-y-1 text-sm">
            <p className="font-medium text-zinc-900">{customer?.name ?? "—"}</p>
            <p className="text-zinc-600">Contact: {customer?.contact_name ?? "—"}</p>
            <p className="text-zinc-600">Phone: {customer?.phone ?? "—"}</p>
            <p className="text-zinc-600">Email: {customer?.email ?? "—"}</p>
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Address & Schedule</h2>
          <div className="mt-3 space-y-1 text-sm">
            <p className="text-zinc-900">{job.address ?? "—"}</p>
            <p className="text-zinc-600">Start Date: {formatDate(job.start_date)}</p>
            <p className="text-zinc-600">Target Finish: {formatDate(job.target_finish_date)}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Active Crew</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">{activeCrew}</p>
          <p className="mt-1 text-xs text-zinc-500">Clocked in right now</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Total Reports</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">{allReports.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Total Uploads</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">{allUploads.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Total Change Orders</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">{allChangeOrders.length}</p>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-semibold text-zinc-900">Quick Actions</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Link href={`/dashboard/time?jobId=${jobId}`} className="rounded-xl border bg-zinc-50 px-4 py-3 text-center text-sm font-medium hover:bg-zinc-100">View Time</Link>
          <Link href="/dashboard/daily-reports/new" className="rounded-xl border bg-zinc-50 px-4 py-3 text-center text-sm font-medium hover:bg-zinc-100">New Report</Link>
          <Link href="/dashboard/uploads/new" className="rounded-xl border bg-zinc-50 px-4 py-3 text-center text-sm font-medium hover:bg-zinc-100">Add Upload</Link>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-zinc-900">Recent Time Activity</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {recentTimeEntries.map((entry) => (
              <li key={entry.id} className="rounded-xl border p-3">
                <p className="font-medium text-zinc-900">{getEmployeeName(entry.employees)}</p>
                <p className="text-zinc-600">{formatDateTime(entry.clock_in_at)} · {entry.status}</p>
              </li>
            ))}
            {recentTimeEntries.length === 0 ? <li className="rounded-xl border p-3 text-zinc-600">No time entries yet.</li> : null}
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-zinc-900">Recent Daily Reports</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {recentReports.map((report) => (
              <li key={report.id} className="rounded-xl border p-3">
                <p className="font-medium text-zinc-900">{formatDate(report.report_date)}</p>
                <p className="text-zinc-600">{getSubmitter(report.users)}</p>
                <p className="text-xs text-zinc-500 line-clamp-2">{report.work_completed}</p>
              </li>
            ))}
            {recentReports.length === 0 ? <li className="rounded-xl border p-3 text-zinc-600">No daily reports yet.</li> : null}
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-zinc-900">Recent Uploads</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {recentUploads.map((upload) => (
              <li key={upload.id} className="rounded-xl border p-3">
                <p className="font-medium text-zinc-900">{upload.file_name}</p>
                <p className="text-zinc-600">{getSubmitter(upload.users, upload.employees)}</p>
                <p className="text-xs text-zinc-500">{formatDateTime(upload.created_at)}</p>
              </li>
            ))}
            {recentUploads.length === 0 ? <li className="rounded-xl border p-3 text-zinc-600">No uploads yet.</li> : null}
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-zinc-900">Recent Change Orders</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {recentChangeOrders.map((changeOrder) => (
              <li key={changeOrder.id} className="rounded-xl border p-3">
                <p className="font-medium text-zinc-900">{changeOrder.title}</p>
                <p className="text-zinc-600">{getJobLabel(changeOrder.jobs)}</p>
                <p className="text-xs text-zinc-500">{changeOrder.status} · {formatDateTime(changeOrder.created_at)}</p>
              </li>
            ))}
            {recentChangeOrders.length === 0 ? <li className="rounded-xl border p-3 text-zinc-600">No change orders yet.</li> : null}
          </ul>
        </div>
      </section>
    </div>
  );
}
