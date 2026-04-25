import Link from "next/link";
import { BriefcaseBusinessIcon, Clock3Icon, UsersIcon } from "lucide-react";
import { getCurrentAppUserContext } from "@/lib/auth/server";
import { isForemanRole } from "@/lib/auth/roles";
import { JobList } from "@/components/jobs/JobList";
import { ErrorPanel } from "@/components/ui/feedback";
import { FilterBar, KpiTile, PageHeader, RecordPreview } from "@/components/ui/page-primitives";
import { TableToolbar } from "@/components/ui/table";
import { getJobs } from "@/lib/db/queries";
import { formatDateOnly } from "@/lib/time/formatting";

function getCustomerName(customers: { name: string }[] | { name: string } | null) {
  if (!customers) return "—";
  if (Array.isArray(customers)) return customers[0]?.name ?? "—";
  return customers.name;
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams?: { status?: string };
} = {}) {
  const appUser = await getCurrentAppUserContext();
  const isForeman = isForemanRole(appUser?.role);
  const selectedStatus = searchParams?.status?.trim() ?? "all";
  const { data, error } = await getJobs();
  const jobs = data ?? [];
  const visibleJobs = selectedStatus === "all" ? jobs : jobs.filter((job) => job.status === selectedStatus);
  const liveJobs = jobs.filter((job) => !["completed", "archived"].includes(job.status)).length;
  const onHoldJobs = jobs.filter((job) => job.status === "on_hold").length;
  const customerCount = new Set(jobs.map((job) => getCustomerName(job.customers)).filter((name) => name !== "—")).size;
  const nextJob = visibleJobs.find((job) => !["completed", "archived"].includes(job.status)) ?? visibleJobs[0] ?? null;
  const toolbarDescription = isForeman
    ? "Open a job to review field activity, documents, assignments, and the shared project record without losing the crew context."
    : "Open a job to manage field activity, documents, assignments, and planning details that keep office and field teams aligned.";
  const filterOptions = [
    { label: "All", href: "/dashboard/jobs", active: selectedStatus === "all" },
    { label: "Scheduled", href: "/dashboard/jobs?status=scheduled", active: selectedStatus === "scheduled" },
    { label: "In Progress", href: "/dashboard/jobs?status=in_progress", active: selectedStatus === "in_progress" },
    { label: "On Hold", href: "/dashboard/jobs?status=on_hold", active: selectedStatus === "on_hold" },
    { label: "Completed", href: "/dashboard/jobs?status=completed", active: selectedStatus === "completed" },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Field Ops"
        title="Jobs"
        description="Jobs need progress, ownership, due date, and the next step visible from the first scan. This board stays dense and operational so crews and office staff can move directly into the right record."
        actions={
          <>
            <Link href="/dashboard/uploads" className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-blue-50">
              Review Uploads
            </Link>
            {!isForeman ? (
              <Link href="/dashboard/jobs/new" className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800">
                New Job
              </Link>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <KpiTile label="Jobs on board" value={jobs.length.toString()} helper="Total project records" icon={<BriefcaseBusinessIcon className="h-4 w-4" />} />
          <KpiTile label="Live planning" value={liveJobs.toString()} helper="Active planning or execution" icon={<Clock3Icon className="h-4 w-4" />} />
          <KpiTile label="Customers" value={customerCount.toString()} helper={`${onHoldJobs} job${onHoldJobs === 1 ? "" : "s"} on hold`} icon={<UsersIcon className="h-4 w-4" />} />
        </div>

        {error ? (
          <ErrorPanel
            title="We couldn’t load jobs right now"
            description="The job board didn’t come back cleanly. Try refreshing the page or come back in a moment."
            actionHref="/dashboard/jobs"
            actionLabel="Try again"
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <div className="min-w-0">
              <FilterBar options={filterOptions} />
              <JobList
                jobs={visibleJobs}
                canManage={!isForeman}
                toolbar={
                  <TableToolbar
                    title="Project board"
                    description={toolbarDescription}
                    countLabel={`${visibleJobs.length} job${visibleJobs.length === 1 ? "" : "s"}`}
                  />
                }
              />
            </div>
            <RecordPreview
              title={nextJob?.name}
              rows={[
                ["Customer", nextJob ? getCustomerName(nextJob.customers) : "—"],
                ["Stage", nextJob ? statusLabel(nextJob.status) : "—"],
                ["Start", nextJob?.start_date ? formatDateOnly(nextJob.start_date, "") : "Not scheduled"],
                ["Next Step", nextJob ? "Open the job hub for assignments, reports, uploads, and status." : "No job selected"],
              ]}
              actions={
                nextJob ? (
                  <Link href={`/dashboard/jobs/${nextJob.id}`} className="inline-flex rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">
                    Open Job Hub
                  </Link>
                ) : null
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
