import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getChangeOrders,
  getDailyReports,
  getJobFiles,
  getTimeEntries,
  type ChangeOrderListRow,
  type DailyReportListRow,
  type JobFileRow,
  type JobTimeEntryRow,
} from "@/lib/db/queries";
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

function getJobLabel(
  jobs:
    | JobTimeEntryRow["jobs"]
    | DailyReportListRow["jobs"]
    | JobFileRow["jobs"]
    | ChangeOrderListRow["jobs"]
) {
  if (!jobs) return "—";
  if (Array.isArray(jobs)) {
    const job = jobs[0];
    return job ? `${job.job_number} · ${job.name}` : "—";
  }
  return `${jobs.job_number} · ${jobs.name}`;
}

function getSubmitter(
  users: DailyReportListRow["users"] | JobFileRow["users"],
  employees?: JobFileRow["employees"]
) {
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

export default async function JobHubPage({
  params,
}: {
  params: { jobId: string };
}) {
  const { jobId } = params; // ✅ FIXED

  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select(
      "id, job_number, name, status, address, start_date, target_finish_date, customers(name, contact_name, phone, email)"
    )
    .eq("id", jobId)
    .maybeSingle<JobHubRow>();

  if (!job) notFound();

  const [
    { data: timeEntries },
    { data: reports },
    { data: uploads },
    { data: changeOrders },
  ] = await Promise.all([
    getTimeEntries({ jobId }),
    getDailyReports({ jobId }),
    getJobFiles({ jobId }),
    getChangeOrders({ jobId }),
  ]);

  const allTimeEntries = timeEntries ?? [];
  const allReports = reports ?? [];
  const allUploads = uploads ?? [];
  const allChangeOrders = changeOrders ?? [];

  const activeCrew = allTimeEntries.filter(
    (entry) => entry.status === "clocked_in"
  ).length;

  const customer = Array.isArray(job.customers)
    ? job.customers[0]
    : job.customers;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-white p-5 shadow-sm">
        <h1 className="text-3xl font-semibold">
          {job.job_number} · {job.name}
        </h1>
        <p className="text-zinc-600 mt-2">{job.status}</p>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Customer</h2>
        <p>{customer?.name}</p>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Active Crew</h2>
        <p>{activeCrew}</p>
      </section>

      <Link href="/dashboard/jobs" className="underline">
        Back to Jobs
      </Link>
    </div>
  );
}