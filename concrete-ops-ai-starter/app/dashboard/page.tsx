import Link from "next/link";
import { redirect } from "next/navigation";
import { BriefcaseBusinessIcon, ClipboardListIcon, Clock3Icon, FileTextIcon, InboxIcon } from "lucide-react";
import { AdminOpsCopilotCard } from "@/components/copilot/AdminOpsCopilotCard";
import { DashboardActivityTime } from "@/components/dashboard/DashboardActivityTime";
import { ViewerCurrentDateLabel } from "@/components/time/ViewerCurrentDateLabel";
import { EmptyState, ErrorPanel, StatusChip } from "@/components/ui/feedback";
import {
  KpiTile,
  OperationalCard,
  PageHeader,
  RecordPreview,
  SectionHeader,
} from "@/components/ui/page-primitives";
import {
  DataTable,
  TableActionLink,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeadCell,
  TableRow,
} from "@/components/ui/table";
import { getCurrentAppUserContext } from "@/lib/auth/server";
import { getRoleHomePath, isOfficeRole } from "@/lib/auth/roles";
import {
  getCustomers,
  getDailyReports,
  getDocuments,
  getEstimates,
  getJobs,
  getNotifications,
  getProposals,
  getTimeEntries,
  type CustomerListRow,
  type DailyReportListRow,
  type DocumentRow,
  type EstimateListRow,
  type JobListRow,
  type JobTimeEntryRow,
  type NotificationRow,
  type ProposalListRow,
} from "@/lib/db/queries";
import { formatDateOnly } from "@/lib/time/formatting";

function getEmployeeName(employees: JobTimeEntryRow["employees"]) {
  if (!employees) return "—";
  if (Array.isArray(employees)) return employees[0]?.full_name ?? "—";
  return employees.full_name;
}

function getJobLabel(jobs: JobTimeEntryRow["jobs"] | DailyReportListRow["jobs"] | DocumentRow["jobs"] | EstimateListRow["jobs"] | JobListRow["customers"]) {
  if (!jobs) return "—";
  if (Array.isArray(jobs)) {
    const item = jobs[0];
    if (!item) return "—";
    if ("job_number" in item) return `${item.job_number} · ${item.name}`;
    return item.name;
  }

  if ("job_number" in jobs) return `${jobs.job_number} · ${jobs.name}`;
  return jobs.name;
}

function getSubmitter(users: DailyReportListRow["users"] | DocumentRow["users"], employees?: DocumentRow["employees"]) {
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatCount(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function isActiveJob(job: JobListRow) {
  return !["completed", "archived"].includes(job.status.toLowerCase());
}

function isOpenEstimate(estimate: EstimateListRow) {
  return ["draft", "sent"].includes(estimate.status.toLowerCase());
}

function isProposalInMotion(proposal: ProposalListRow) {
  return ["draft", "sent"].includes(proposal.status.toLowerCase());
}

function getStatusTone(status: string): "neutral" | "success" | "warning" | "error" | "info" {
  const normalized = status.toLowerCase();
  if (normalized.includes("approved") || normalized.includes("complete")) return "success";
  if (normalized.includes("hold") || normalized.includes("waiting") || normalized.includes("sent")) return "warning";
  if (normalized.includes("reject") || normalized.includes("decline")) return "error";
  if (normalized.includes("progress") || normalized.includes("draft") || normalized.includes("scheduled")) return "info";
  return "neutral";
}

async function getSafeUnreadNotifications() {
  try {
    const result = await getNotifications({ unreadOnly: true });
    if (result.error) return { data: [] as NotificationRow[], unavailable: true };
    return { data: result.data ?? [], unavailable: false };
  } catch {
    return { data: [] as NotificationRow[], unavailable: true };
  }
}

async function getSafeRecentUploads() {
  try {
    const result = await getDocuments();
    if (result.error) return { data: [] as DocumentRow[], unavailable: true };
    return { data: result.data ?? [], unavailable: false };
  } catch {
    return { data: [] as DocumentRow[], unavailable: true };
  }
}

async function getSafeOfficeSnapshot() {
  try {
    const [customers, estimates, jobs, proposals] = await Promise.all([
      getCustomers(),
      getEstimates(),
      getJobs(),
      getProposals(),
    ]);

    if (customers.error || estimates.error || jobs.error || proposals.error) {
      return {
        customers: [] as CustomerListRow[],
        estimates: [] as EstimateListRow[],
        jobs: [] as JobListRow[],
        proposals: [] as ProposalListRow[],
        unavailable: true,
      };
    }

    return {
      customers: customers.data ?? [],
      estimates: estimates.data ?? [],
      jobs: jobs.data ?? [],
      proposals: proposals.data ?? [],
      unavailable: false,
    };
  } catch {
    return {
      customers: [] as CustomerListRow[],
      estimates: [] as EstimateListRow[],
      jobs: [] as JobListRow[],
      proposals: [] as ProposalListRow[],
      unavailable: true,
    };
  }
}

type QueueItem = {
  title: string;
  meta: string;
  status: string;
  href: string;
};

function QueueList({ items }: { items: QueueItem[] }) {
  return (
    <OperationalCard className="p-4">
      <SectionHeader
        title="Today's Queue"
        description="Practical work queue with only items that need movement."
        action={
          <Link href="/dashboard/notifications" className="text-xs font-black text-blue-700 hover:text-blue-800">
            View all
          </Link>
        }
      />
      <div className="space-y-2">
        {items.map((item) => (
          <Link key={`${item.title}-${item.status}`} href={item.href} className="flex items-start justify-between gap-3 rounded-xl border border-blue-100 bg-white p-3 hover:bg-blue-50/50">
            <div>
              <p className="text-sm font-black text-slate-950">{item.title}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">{item.meta}</p>
            </div>
            <StatusChip tone={getStatusTone(item.status)}>{item.status}</StatusChip>
          </Link>
        ))}
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50 p-4 text-sm font-medium text-slate-600">
            No queue items need attention right now.
          </div>
        ) : null}
      </div>
    </OperationalCard>
  );
}

function EstimateTable({ estimates }: { estimates: EstimateListRow[] }) {
  return (
    <div className="overflow-x-auto">
      <DataTable>
        <TableHead>
          <tr>
            <TableHeadCell>Estimate</TableHeadCell>
            <TableHeadCell>Customer</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell>Value</TableHeadCell>
            <TableHeadCell>Action</TableHeadCell>
          </tr>
        </TableHead>
        <TableBody>
          {estimates.map((estimate) => (
            <TableRow key={estimate.id}>
              <TableCell>
                <p className="font-black text-slate-950">{estimate.title}</p>
                <p className="text-xs font-bold text-slate-500">{getJobLabel(estimate.jobs)}</p>
              </TableCell>
              <TableCell>{getJobLabel(estimate.customers)}</TableCell>
              <TableCell>
                <StatusChip tone={getStatusTone(estimate.status)}>{estimate.status}</StatusChip>
              </TableCell>
              <TableCell className="font-black text-slate-950">{formatCurrency(estimate.subtotal)}</TableCell>
              <TableCell>
                <TableActionLink href={`/dashboard/estimates/${estimate.id}`} label="Open" />
              </TableCell>
            </TableRow>
          ))}
          {estimates.length === 0 ? (
            <TableEmptyRow colSpan={5}>
              <EmptyState
                icon="file"
                title="No open estimates"
                description="Draft and sent estimates will appear here when the office has pricing work to move."
                actionHref="/dashboard/estimates/new"
                actionLabel="Create estimate"
              />
            </TableEmptyRow>
          ) : null}
        </TableBody>
      </DataTable>
    </div>
  );
}

function JobsTable({ jobs }: { jobs: JobListRow[] }) {
  return (
    <div className="overflow-x-auto">
      <DataTable>
        <TableHead>
          <tr>
            <TableHeadCell>Job</TableHeadCell>
            <TableHeadCell>Customer</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell>Schedule</TableHeadCell>
            <TableHeadCell>Action</TableHeadCell>
          </tr>
        </TableHead>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell>
                <p className="font-black text-slate-950">{job.name}</p>
                <p className="text-xs font-bold text-slate-500">{job.job_number}</p>
              </TableCell>
              <TableCell>{getJobLabel(job.customers)}</TableCell>
              <TableCell>
                <StatusChip tone={getStatusTone(job.status)}>{job.status.replaceAll("_", " ")}</StatusChip>
              </TableCell>
              <TableCell>{job.start_date ? formatDateOnly(job.start_date, "") : "Not scheduled"}</TableCell>
              <TableCell>
                <TableActionLink href={`/dashboard/jobs/${job.id}`} label="Open" />
              </TableCell>
            </TableRow>
          ))}
          {jobs.length === 0 ? (
            <TableEmptyRow colSpan={5}>
              <EmptyState
                icon="briefcase"
                title="No active jobs"
                description="Active job records will appear here when planning or field work is moving."
                actionHref="/dashboard/jobs/new"
                actionLabel="Create job"
              />
            </TableEmptyRow>
          ) : null}
        </TableBody>
      </DataTable>
    </div>
  );
}

export default async function DashboardPage() {
  const appUser = await getCurrentAppUserContext();

  if (!appUser) redirect("/login?next=/dashboard");
  if (appUser.role === "foreman") redirect(getRoleHomePath(appUser.role));

  const [
    { data: timeEntries, error: timeEntriesError },
    { data: reports, error: reportsError },
    { data: uploads, unavailable: uploadsUnavailable },
    { data: unreadNotifications, unavailable: notificationsUnavailable },
    officeSnapshot,
  ] = await Promise.all([
    getTimeEntries(),
    getDailyReports(),
    getSafeRecentUploads(),
    getSafeUnreadNotifications(),
    getSafeOfficeSnapshot(),
  ]);

  if (timeEntriesError || reportsError) {
    return (
      <div className="px-5 py-5 sm:px-6 lg:px-8">
        <ErrorPanel
          title="We couldn’t load the operations command view right now"
          description="The dashboard command view is temporarily unavailable. Try refreshing the page or come back in a moment."
          actionHref="/dashboard"
          actionLabel="Try again"
        />
      </div>
    );
  }

  const allTimeEntries = timeEntries ?? [];
  const allReports = reports ?? [];
  const allUploads = uploads ?? [];
  const allUnreadNotifications = unreadNotifications ?? [];
  const allCustomers = officeSnapshot.customers;
  const allEstimates = officeSnapshot.estimates;
  const allJobs = officeSnapshot.jobs;
  const allProposals = officeSnapshot.proposals;

  const todayIso = new Date().toISOString().slice(0, 10);
  const activeClocks = allTimeEntries.filter((entry) => entry.status === "clocked_in").length;
  const crewHoursToday = allTimeEntries
    .filter((entry) => entry.clock_in_at?.slice(0, 10) === todayIso || entry.clock_out_at?.slice(0, 10) === todayIso)
    .reduce((total, entry) => total + (entry.total_hours ?? 0), 0);
  const reportsToday = allReports.filter((report) => report.report_date === todayIso).length;
  const activeCustomers = allCustomers.filter((customer) => customer.status === "active").length;
  const activeJobs = allJobs.filter(isActiveJob);
  const openEstimates = allEstimates.filter(isOpenEstimate);
  const openEstimateValue = openEstimates.reduce((total, estimate) => total + estimate.subtotal, 0);
  const proposalsInMotion = allProposals.filter(isProposalInMotion).length;
  const latestJob = activeJobs[0] ?? allJobs[0] ?? null;
  const latestEstimate = openEstimates[0] ?? allEstimates[0] ?? null;
  const canUseAdminOpsCopilot = isOfficeRole(appUser.role);

  const queueItems: QueueItem[] = [
    ...allUnreadNotifications.slice(0, 2).map((notification) => ({
      title: notification.title,
      meta: notification.body || "Unread notification",
      status: notification.priority === "high" ? "Due today" : "Ready",
      href: "/dashboard/notifications",
    })),
    ...(latestEstimate
      ? [{
          title: `Review ${latestEstimate.title}`,
          meta: `${getJobLabel(latestEstimate.customers)} · ${formatCurrency(latestEstimate.subtotal)}`,
          status: latestEstimate.status,
          href: `/dashboard/estimates/${latestEstimate.id}`,
        }]
      : []),
    ...(latestJob
      ? [{
          title: `Check ${latestJob.name}`,
          meta: `${latestJob.job_number} · ${latestJob.status.replaceAll("_", " ")}`,
          status: latestJob.status,
          href: `/dashboard/jobs/${latestJob.id}`,
        }]
      : []),
    ...(reportsToday === 0
      ? [{
          title: "Prompt daily report capture",
          meta: "No daily reports have been filed today.",
          status: "Due today",
          href: "/dashboard/daily-reports/new",
        }]
      : []),
  ].slice(0, 4);

  const kpis = [
    {
      label: "Customers active",
      value: officeSnapshot.unavailable ? "—" : activeCustomers.toString(),
      helper: officeSnapshot.unavailable ? "Office data unavailable" : `${formatCount(allCustomers.length, "customer")} total`,
      icon: <InboxIcon className="h-4 w-4" />,
    },
    {
      label: "Estimates outstanding",
      value: officeSnapshot.unavailable ? "—" : formatCurrency(openEstimateValue),
      helper: officeSnapshot.unavailable ? "Estimate data unavailable" : `${formatCount(openEstimates.length, "open estimate")}`,
      icon: <FileTextIcon className="h-4 w-4" />,
    },
    {
      label: "Jobs active today",
      value: officeSnapshot.unavailable ? "—" : activeJobs.length.toString(),
      helper: officeSnapshot.unavailable ? "Job data unavailable" : `${activeClocks} crew clocks open`,
      icon: <BriefcaseBusinessIcon className="h-4 w-4" />,
    },
    {
      label: "Reports filed today",
      value: reportsToday.toString(),
      helper: uploadsUnavailable ? "Uploads unavailable" : `${allUploads.filter((upload) => upload.created_at?.slice(0, 10) === todayIso).length} uploads today`,
      icon: <ClipboardListIcon className="h-4 w-4" />,
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Operations Command"
        title="Daily workspace"
        description="Calm command surface for customers, estimates, jobs, reports, and queues. The dashboard shows what needs action first, then lets the user drill into records without changing context."
        actions={
          <>
            <Link href="/dashboard/estimates/new" className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-blue-50">
              Create Estimate
            </Link>
            <Link href="/dashboard/customers/new" className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800">
              New Customer
            </Link>
          </>
        }
        tabs={
          <>
            {["Today", "This Week", "Needs Action", "Ready to Bill"].map((tab, index) => (
              <span key={tab} className={index === 0 ? "rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white" : "rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700"}>
                {tab}
              </span>
            ))}
          </>
        }
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => <KpiTile key={item.label} {...item} />)}
        </div>

        {notificationsUnavailable ? (
          <OperationalCard className="p-4">
            <p className="text-sm font-black text-slate-950">Queue unavailable</p>
            <p className="mt-1 text-sm font-medium text-slate-600">The notification queue is temporarily unavailable, but the dashboard remains available.</p>
          </OperationalCard>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <OperationalCard className="overflow-hidden">
            <div className="p-4">
              <SectionHeader
                title="Estimate Pipeline"
                description="High-density office queue with status, customer, value, and action."
                action={<Link href="/dashboard/estimates" className="text-xs font-black text-blue-700 hover:text-blue-800">Open Estimates</Link>}
              />
            </div>
            <EstimateTable estimates={openEstimates.slice(0, 5)} />
          </OperationalCard>
          <div className="space-y-4">
            <QueueList items={queueItems} />
            <RecordPreview
              title={latestJob?.name ?? latestEstimate?.title}
              rows={[
                ["Customer", latestJob ? getJobLabel(latestJob.customers) : latestEstimate ? getJobLabel(latestEstimate.customers) : "—"],
                ["Stage", latestJob?.status.replaceAll("_", " ") ?? latestEstimate?.status ?? "—"],
                ["Next Step", latestJob ? "Open job hub and check field status" : latestEstimate ? "Review estimate record" : "No active record"],
                ["Risk", notificationsUnavailable ? "Queue unavailable" : officeSnapshot.unavailable ? "Office pipeline unavailable" : "No active blocker surfaced"],
              ]}
              actions={
                latestJob ? (
                  <Link href={`/dashboard/jobs/${latestJob.id}`} className="inline-flex rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">
                    Open Record
                  </Link>
                ) : null
              }
            />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <OperationalCard className="overflow-hidden">
            <div className="p-4">
              <SectionHeader
                title="Active Jobs"
                description="Operational job list with status, schedule, customer, and next action."
                action={<Link href="/dashboard/jobs" className="text-xs font-black text-blue-700 hover:text-blue-800">Open Jobs</Link>}
              />
            </div>
            <JobsTable jobs={activeJobs.slice(0, 5)} />
          </OperationalCard>

          <OperationalCard className="p-4">
            <SectionHeader title="Recent Activity" description="Compact audit rhythm across labor, reports, and uploads." />
            <div className="space-y-3">
              {allTimeEntries.slice(0, 2).map((entry) => (
                <div key={entry.id} className="border-l-2 border-blue-200 pl-3">
                  <p className="text-xs font-black uppercase tracking-widest text-blue-700">
                    <DashboardActivityTime value={entry.clock_in_at} />
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-950">Time entry updated</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{getEmployeeName(entry.employees)} · {getJobLabel(entry.jobs)}</p>
                </div>
              ))}
              {allReports.slice(0, 1).map((report) => (
                <div key={report.id} className="border-l-2 border-blue-200 pl-3">
                  <p className="text-xs font-black uppercase tracking-widest text-blue-700">{formatDateOnly(report.report_date)}</p>
                  <p className="mt-1 text-sm font-black text-slate-950">Daily report submitted</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{getJobLabel(report.jobs)} · {getSubmitter(report.users)}</p>
                </div>
              ))}
              {allUploads.slice(0, 1).map((upload) => (
                <div key={upload.id} className="border-l-2 border-blue-200 pl-3">
                  <p className="text-xs font-black uppercase tracking-widest text-blue-700">
                    <DashboardActivityTime value={upload.created_at} />
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-950">Upload added</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{upload.file_name} · {getJobLabel(upload.jobs)}</p>
                </div>
              ))}
              {allTimeEntries.length + allReports.length + allUploads.length === 0 ? (
                <p className="rounded-xl border border-dashed border-blue-200 bg-blue-50 p-4 text-sm font-medium text-slate-600">
                  No activity has landed yet.
                </p>
              ) : null}
            </div>
          </OperationalCard>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <OperationalCard className="p-4">
            <SectionHeader title="Tools and AI" description="Keep utilities visible without turning the desktop into a decorative concept dashboard." />
            <div className="grid gap-3 md:grid-cols-2">
              <Link href="/dashboard/concrete-calculator" className="rounded-xl border border-blue-100 bg-blue-50 p-4 hover:bg-blue-100">
                <p className="text-sm font-black text-slate-950">Concrete Calculator</p>
                <p className="mt-1 text-sm font-medium text-slate-600">Estimate yardage, then move back into delivery conversations.</p>
              </Link>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-black text-slate-950">Pipeline health</p>
                <p className="mt-1 text-sm font-medium text-slate-600">
                  {officeSnapshot.unavailable ? "Office pipeline unavailable." : `${proposalsInMotion} proposals moving through draft or sent status.`}
                </p>
              </div>
            </div>
          </OperationalCard>
          <OperationalCard className="p-4">
            <SectionHeader title="Crew Hours Today" description="Field status remains visible without a separate right strip." />
            <div className="rounded-xl bg-blue-950 p-4 text-white">
              <p className="text-xs font-black uppercase tracking-widest text-blue-200">
                <ViewerCurrentDateLabel />
              </p>
              <p className="mt-2 text-4xl font-black">{crewHoursToday.toFixed(1)}</p>
              <p className="mt-1 text-sm font-bold text-blue-100">{activeClocks} active crew clocks</p>
            </div>
          </OperationalCard>
        </div>

        {canUseAdminOpsCopilot ? <div id="admin-ops-copilot"><AdminOpsCopilotCard /></div> : null}
      </div>
    </div>
  );
}
