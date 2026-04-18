import Link from "next/link";
import { redirect } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ActivityIcon,
  ArrowRightIcon,
  BellDotIcon,
  CalculatorIcon,
  ClipboardListIcon,
  Clock3Icon,
  FileTextIcon,
  HardHatIcon,
  LayoutDashboardIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UploadIcon,
} from "lucide-react";
import { AdminOpsCopilotCard } from "@/components/copilot/AdminOpsCopilotCard";
import { DashboardActivityTime } from "@/components/dashboard/DashboardActivityTime";
import { ViewerCurrentDateLabel } from "@/components/time/ViewerCurrentDateLabel";
import { Badge } from "@/components/ui/badge";
import { ErrorPanel } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";
import { getCurrentAppUserContext } from "@/lib/auth/server";
import { getRoleHomePath, isOfficeRole } from "@/lib/auth/roles";
import {
  getDailyReports,
  getDocuments,
  getNotifications,
  getTimeEntries,
  type DailyReportListRow,
  type DocumentRow,
  type JobTimeEntryRow,
  type NotificationRow,
} from "@/lib/db/queries";
import { formatDateOnly } from "@/lib/time/formatting";

function getEmployeeName(employees: JobTimeEntryRow["employees"]) {
  if (!employees) return "—";
  if (Array.isArray(employees)) return employees[0]?.full_name ?? "—";
  return employees.full_name;
}

function getJobLabel(jobs: JobTimeEntryRow["jobs"] | DailyReportListRow["jobs"] | DocumentRow["jobs"]) {
  if (!jobs) return "—";
  if (Array.isArray(jobs)) {
    const job = jobs[0];
    return job ? `${job.job_number} · ${job.name}` : "—";
  }

  return `${jobs.job_number} · ${jobs.name}`;
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

function formatRelativeCount(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

async function getSafeUnreadNotifications() {
  try {
    const result = await getNotifications({ unreadOnly: true });
    if (result.error) {
      return { data: [] as NotificationRow[], unavailable: true };
    }

    return { data: result.data ?? [], unavailable: false };
  } catch {
    return { data: [] as NotificationRow[], unavailable: true };
  }
}

async function getSafeRecentUploads() {
  try {
    const result = await getDocuments();
    if (result.error) {
      return { data: [] as DocumentRow[], unavailable: true };
    }

    return { data: result.data ?? [], unavailable: false };
  } catch {
    return { data: [] as DocumentRow[], unavailable: true };
  }
}

function SurfaceCard({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & ComponentProps<"article">) {
  return (
    <article
      className={cn(
        "rounded-[34px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,249,250,0.9))] p-6 shadow-[0_28px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-7",
        className
      )}
      {...props}
    >
      {children}
    </article>
  );
}

type Metric = {
  label: string;
  value: string;
  detail: string;
  cta: string;
  href: string;
  icon: LucideIcon;
  accentClass: string;
};

function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon;

  return (
    <SurfaceCard className="relative overflow-hidden p-5">
      <div className={cn("absolute inset-x-6 top-0 h-1.5 rounded-full", metric.accentClass)} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-app-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">{metric.label}</p>
          <p className="mt-5 text-[2.35rem] font-semibold tracking-[-0.07em] text-[#101828]">{metric.value}</p>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-[20px] border border-zinc-200/80 bg-white text-zinc-700 shadow-[0_12px_26px_rgba(15,23,42,0.06)]">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-sm leading-7 text-zinc-600">{metric.detail}</p>
      <Link href={metric.href} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#b95f26] transition hover:text-[#9f4f1c]">
        {metric.cta}
        <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </SurfaceCard>
  );
}

type ActionLaneItem = {
  href: string;
  title: string;
  detail: string;
};

type ActionLane = {
  eyebrow: string;
  title: string;
  detail: string;
  icon: LucideIcon;
  accentClass: string;
  items: ActionLaneItem[];
};

function ActionLaneCard({ lane }: { lane: ActionLane }) {
  const Icon = lane.icon;

  return (
    <div className="rounded-[30px] border border-zinc-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,248,250,0.9))] p-6 shadow-[0_20px_44px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">{lane.eyebrow}</p>
          <h3 className="mt-3 text-lg font-semibold tracking-[-0.04em] text-[#101828]">{lane.title}</h3>
        </div>
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-[18px] border", lane.accentClass)}>
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <p className="mt-4 text-sm leading-7 text-zinc-600">{lane.detail}</p>

      <div className="mt-6 space-y-3">
        {lane.items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-[24px] border border-zinc-200 bg-white px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)] transition hover:border-[#d69a72] hover:bg-[#fffaf6]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-950">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-zinc-600">{item.detail}</p>
              </div>
              <ArrowRightIcon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ActivityPanel<T>({
  title,
  eyebrow,
  href,
  icon: Icon,
  items,
  emptyLabel,
  renderItem,
}: {
  title: string;
  eyebrow: string;
  href: string;
  icon: LucideIcon;
  items: T[];
  emptyLabel: string;
  renderItem: (item: T) => ReactNode;
}) {
  return (
    <div className="rounded-[30px] border border-zinc-200/80 bg-[linear-gradient(180deg,rgba(246,247,248,0.9),rgba(241,244,246,0.78))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-[18px] border border-white bg-white text-zinc-700 shadow-sm">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <p className="font-app-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">{eyebrow}</p>
            <h3 className="mt-1 text-base font-semibold text-zinc-950">{title}</h3>
          </div>
        </div>
        <Link href={href} className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 transition hover:text-zinc-800">
          View all
        </Link>
      </div>

      <ul className="mt-5 space-y-3 text-sm">
        {items.map((item, index) => (
          <li key={index} className="rounded-[24px] border border-white bg-white/92 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
            {renderItem(item)}
          </li>
        ))}
        {items.length === 0 ? (
          <li className="rounded-[24px] border border-dashed border-zinc-300 bg-white/92 p-5 text-zinc-600">{emptyLabel}</li>
        ) : null}
      </ul>
    </div>
  );
}

export default async function DashboardPage() {
  const appUser = await getCurrentAppUserContext();

  if (!appUser) {
    redirect("/login?next=/dashboard");
  }

  if (appUser.role === "foreman") {
    redirect(getRoleHomePath(appUser.role));
  }

  const [
    { data: timeEntries, error: timeEntriesError },
    { data: reports, error: reportsError },
    { data: uploads, unavailable: uploadsUnavailable },
    { data: unreadNotifications, unavailable: notificationsUnavailable },
  ] = await Promise.all([
    getTimeEntries(),
    getDailyReports(),
    getSafeRecentUploads(),
    getSafeUnreadNotifications(),
  ]);

  if (timeEntriesError || reportsError) {
    return (
      <div className="space-y-6 lg:space-y-8">
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

  const recentTimeEntries = allTimeEntries.slice(0, 5);
  const recentReports = allReports.slice(0, 5);
  const recentUploads = allUploads.slice(0, 5);

  const activeClocks = allTimeEntries.filter((entry) => entry.status === "clocked_in").length;
  const todayIso = new Date().toISOString().slice(0, 10);
  const reportsToday = allReports.filter((report) => report.report_date === todayIso).length;
  const uploadsToday = allUploads.filter((upload) => upload.created_at?.slice(0, 10) === todayIso).length;
  const jobsTouchedToday = new Set(
    allTimeEntries
      .filter((entry) => entry.clock_in_at?.slice(0, 10) === todayIso)
      .map((entry) => getJobLabel(entry.jobs))
      .filter((label) => label !== "—")
  ).size;
  const canUseAdminOpsCopilot = isOfficeRole(appUser.role);

  const focusMessage =
    uploadsUnavailable && notificationsUnavailable
      ? "Uploads and notifications are temporarily unavailable, but the core labor and reporting picture is still loaded."
      : uploadsUnavailable
        ? "Recent uploads are temporarily unavailable, but the core labor and reporting picture is still loaded."
        : notificationsUnavailable
      ? "The notification queue is temporarily unavailable, but the core labor, report, and upload picture is still loaded."
      : allUnreadNotifications.length > 0
      ? "Clear the unread office queue after reviewing today's reports so follow-up stays same-day."
      : reportsToday === 0
        ? "Prompt the field for today's report set before closeout so documentation doesn't slip."
        : uploadsToday === 0
          ? "Ask for supporting photos and files while the field context is still fresh."
          : "The core queues look stable. Use this command view to keep records complete and crews unblocked.";

  const metrics: Metric[] = [
    {
      label: "Active Crew Clocks",
      value: activeClocks.toString(),
      detail: activeClocks > 0 ? `${activeClocks} people are currently clocked in.` : "No crews are clocked in right now.",
      cta: "Open time board",
      href: "/dashboard/time",
      icon: Clock3Icon,
      accentClass: "bg-[linear-gradient(90deg,#cf6f33_0%,#ebb086_100%)]",
    },
    {
      label: "Reports Filed Today",
      value: reportsToday.toString(),
      detail: `${formatRelativeCount(allReports.length, "report")} across the record, with today's pace visible at a glance.`,
      cta: "Review reports",
      href: "/dashboard/daily-reports",
      icon: ClipboardListIcon,
      accentClass: "bg-[linear-gradient(90deg,#1f3b57_0%,#4c6c88_100%)]",
    },
    {
      label: "Uploads Captured",
      value: uploadsUnavailable ? "—" : allUploads.length.toString(),
      detail: uploadsUnavailable
        ? "Recent uploads are temporarily unavailable."
        : uploadsToday > 0
          ? `${uploadsToday} file uploads landed today.`
          : "No uploads have been captured yet today.",
      cta: "Open uploads",
      href: "/dashboard/uploads",
      icon: UploadIcon,
      accentClass: "bg-[linear-gradient(90deg,#0f766e_0%,#4da89a_100%)]",
    },
    {
      label: "Unread Notifications",
      value: notificationsUnavailable ? "—" : allUnreadNotifications.length.toString(),
      detail: notificationsUnavailable
        ? "The notification queue is temporarily unavailable."
        : jobsTouchedToday > 0
          ? `${jobsTouchedToday} jobs have labor activity today.`
          : "No jobs have logged labor activity yet today.",
      cta: "Review alerts",
      href: "/dashboard/notifications",
      icon: BellDotIcon,
      accentClass: "bg-[linear-gradient(90deg,#7c5b1f_0%,#c7a25f_100%)]",
    },
  ];

  const actionLanes: ActionLane[] = [
    {
      eyebrow: "Field Execution",
      title: "Keep crews, reports, and scope aligned.",
      detail: "Use the live work surfaces first so the field record stays current while the day is in motion.",
      icon: HardHatIcon,
      accentClass: "border-[#f1d7c6] bg-[#fff4ed] text-[#b95f26]",
      items: [
        { href: "/dashboard/time", title: "Open live labor board", detail: "Review clock status, breaks, and active field coverage." },
        { href: "/dashboard/daily-reports/new", title: "Create daily report", detail: "Capture production notes before end-of-day compression." },
      ],
    },
    {
      eyebrow: "Office Follow-Up",
      title: "Work the queue before it turns reactive.",
      detail: "Stay ahead of approvals, change capture, and notification cleanup without hunting across modules.",
      icon: FileTextIcon,
      accentClass: "border-[#d7e2ec] bg-[#f2f7fb] text-[#2c5678]",
      items: [
        { href: "/dashboard/change-orders/new", title: "Start change order", detail: "Log scope movement while the cost story is still fresh." },
        { href: "/dashboard/notifications", title: "Clear notification queue", detail: "Keep office follow-up tight and visible." },
      ],
    },
    {
      eyebrow: "Project Record",
      title: "Keep documentation credible and easy to trust.",
      detail: "Centralize the latest job artifacts so office and field teams share the same source of truth.",
      icon: ShieldCheckIcon,
      accentClass: "border-[#d3e3dd] bg-[#eef7f2] text-[#1f6b52]",
      items: [
        { href: "/dashboard/uploads/new", title: "Add supporting upload", detail: "Bring photos and project files into the record quickly." },
        { href: "/dashboard/jobs", title: "Open job board", detail: "Move from the command view into the active project roster." },
      ],
    },
  ];

  const briefingItems = [
    {
      label: "Field coverage",
      value: activeClocks > 0 ? `${activeClocks} active clocks` : "No active clocks yet",
      detail: jobsTouchedToday > 0 ? `${jobsTouchedToday} jobs have labor activity today.` : "Waiting on the first field signal.",
    },
    {
      label: "Documentation pace",
      value: reportsToday > 0 ? `${reportsToday} daily reports filed` : "No reports filed yet",
      detail: uploadsUnavailable
        ? "Recent uploads could not be loaded for this view."
        : uploadsToday > 0
          ? `${uploadsToday} uploads were added today.`
          : "Supporting files still need to land.",
    },
    {
      label: "Office queue",
      value: notificationsUnavailable
        ? "Queue unavailable"
        : allUnreadNotifications.length > 0
          ? `${allUnreadNotifications.length} unread notifications`
          : "Queue is clear",
      detail: notificationsUnavailable
        ? "Notifications could not be loaded for this view."
        : allUnreadNotifications.length > 0
          ? "Follow-up is waiting in the notification feed."
          : "No office escalations are sitting unreviewed.",
    },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <SurfaceCard className="relative overflow-hidden p-7 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(201,106,44,0.16),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.07),_transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.3),transparent_55%)]" />

        <div className="relative">
          <Badge className="rounded-full border border-[#ead3c3] bg-[#fff4eb] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b95f26]">
            Operations Command
          </Badge>
          <p className="mt-4 font-app-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
            <ViewerCurrentDateLabel />
          </p>
          <h1 className="mt-4 max-w-4xl text-[clamp(2.35rem,4.2vw,4.2rem)] font-semibold tracking-[-0.08em] text-[#101828]">
            A steadier command view for field work, documentation, and office follow-up.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-600">
            See the day&apos;s operating picture before diving into individual modules. This home surface is designed to help crews, paperwork, and project records stay aligned without adding workflow churn.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/dashboard/daily-reports"
              className="inline-flex items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#101828_0%,#1f2937_100%)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(15,23,42,0.18)] transition hover:brightness-110"
            >
              Review today&apos;s reports
            </Link>
            <Link
              href="/dashboard/jobs"
              className="inline-flex items-center justify-center rounded-[22px] border border-zinc-200 bg-white px-5 py-3.5 text-sm font-semibold text-zinc-900 shadow-[0_12px_24px_rgba(15,23,42,0.05)] transition hover:border-[#d69a72] hover:bg-[#fffaf6]"
            >
              Open job board
            </Link>
            <Link
              href="#tools-and-ai"
              className="inline-flex items-center justify-center rounded-[22px] border border-zinc-200 bg-white px-5 py-3.5 text-sm font-semibold text-zinc-900 shadow-[0_12px_24px_rgba(15,23,42,0.05)] transition hover:border-[#d69a72] hover:bg-[#fffaf6]"
            >
              Browse Tools &amp; AI
            </Link>
          </div>

          <div className="mt-8 overflow-hidden rounded-[30px] border border-white/85 bg-white/90 shadow-[0_22px_44px_rgba(15,23,42,0.06)]">
            <div className="grid gap-px bg-zinc-200/80 xl:grid-cols-[0.9fr,0.9fr,0.9fr,1.25fr]">
              {briefingItems.map((item) => (
                <div key={item.label} className="bg-white/94 px-5 py-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-app-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">{item.label}</p>
                    <ActivityIcon className="h-4 w-4 text-zinc-400" />
                  </div>
                  <p className="mt-3 text-[1.55rem] font-semibold tracking-[-0.05em] text-zinc-950">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{item.detail}</p>
                </div>
              ))}

              <div className="bg-[linear-gradient(135deg,#0f1820_0%,#15222d_100%)] px-6 py-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-app-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Recommended Focus</p>
                    <h2 className="mt-3 text-[1.45rem] font-semibold tracking-[-0.04em] text-white">Keep the day moving from one wider command surface.</h2>
                  </div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-white/10 bg-white/5 text-zinc-200">
                    <LayoutDashboardIcon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-zinc-300">{focusMessage}</p>
                <Link
                  href="/dashboard/notifications"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-orange-100"
                >
                  Review follow-up queue
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <section className="grid gap-5 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <SurfaceCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <p className="font-app-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Quick Actions</p>
            <h2 className="mt-3 text-[1.9rem] font-semibold tracking-[-0.05em] text-[#101828]">Move the day forward from a smaller set of stronger decisions.</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              These action lanes keep the highest-value surfaces close at hand without reshaping how teams already work inside the product.
            </p>
          </div>
          <Link href="/dashboard/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-[#b95f26] transition hover:text-[#9f4f1c]">
            Open jobs
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-3">
          {actionLanes.map((lane) => (
            <ActionLaneCard key={lane.title} lane={lane} />
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard id="tools-and-ai" className="overflow-hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="font-app-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Tools &amp; AI</p>
            <h2 className="mt-3 text-[1.8rem] font-semibold tracking-[-0.05em] text-[#101828]">Keep specialty tools visible without turning the desktop workspace into a right-side utility column.</h2>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-[20px] border border-zinc-200 bg-zinc-50 text-zinc-700">
            <SparklesIcon className="h-5 w-5" />
          </span>
        </div>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-600">
          The concrete calculator stays accessible to both field and office roles, while Admin Ops Copilot remains constrained to owner and office admin access.
        </p>

        <div className="mt-7 grid gap-4 xl:grid-cols-2">
          <div className="rounded-[30px] border border-[#d7e2ec] bg-[linear-gradient(135deg,#f4f8fb_0%,#ffffff_100%)] p-6 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-app-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Concrete Calculator</p>
                <h3 className="mt-3 text-lg font-semibold tracking-[-0.04em] text-[#101828]">Estimate yardage quickly, then move back into delivery conversations.</h3>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-[#d7e2ec] bg-white text-[#2c5678]">
                <CalculatorIcon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-zinc-600">
              This is the utility surface that belongs in the shell-level toolkit: useful, role-safe, and immediately actionable.
            </p>
            <Link
              href="/dashboard/concrete-calculator"
              className="mt-6 inline-flex items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#101828_0%,#1f2937_100%)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(15,23,42,0.18)] transition hover:brightness-110"
            >
              Open Concrete Calculator
            </Link>
          </div>

          <div className="rounded-[30px] border border-[#ead3c3] bg-[linear-gradient(135deg,#fff8f2_0%,#ffffff_100%)] p-6 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-app-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Copilot Access</p>
                <h3 className="mt-3 text-lg font-semibold tracking-[-0.04em] text-[#101828]">
                  {canUseAdminOpsCopilot ? "Office-side AI follow-up is available in this workspace." : "AI follow-up remains intentionally hidden outside office-side roles."}
                </h3>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-[#ead3c3] bg-white text-[#b95f26]">
                <SparklesIcon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-zinc-600">
              {canUseAdminOpsCopilot
                ? "Jump directly into the assistant without leaving the command center."
                : "Role-based restraint keeps the dashboard cleaner for the field while still preserving the office workflow."}
            </p>
            {canUseAdminOpsCopilot ? (
              <Link
                href="#admin-ops-copilot"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#b95f26] transition hover:text-[#9f4f1c]"
              >
                Jump to Admin Ops Copilot
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </div>
      </SurfaceCard>

      <div id="admin-ops-copilot">
        {canUseAdminOpsCopilot ? (
          <AdminOpsCopilotCard />
        ) : (
          <SurfaceCard className="bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(247,248,250,0.92))]">
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-xl">
                <p className="font-app-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Admin Ops Copilot</p>
                <h3 className="mt-3 text-[1.55rem] font-semibold tracking-[-0.05em] text-[#101828]">Reserved for owner and office admin follow-up.</h3>
                <p className="mt-4 text-sm leading-7 text-zinc-600">
                  This keeps the command surface focused on field-safe tools while reserving this workflow for owner and office admin roles.
                </p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-[20px] border border-zinc-200 bg-zinc-50 text-zinc-700">
                <SparklesIcon className="h-5 w-5" />
              </span>
            </div>
          </SurfaceCard>
        )}
      </div>

      <SurfaceCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-app-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Recent Activity</p>
            <h2 className="mt-3 text-[1.85rem] font-semibold tracking-[-0.05em] text-[#101828]">Latest movement across the operation.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
              Read the newest field, reporting, and upload signals without leaving the command surface.
            </p>
          </div>
          <Link href="/dashboard/time" className="inline-flex items-center gap-2 text-sm font-semibold text-[#b95f26] transition hover:text-[#9f4f1c]">
            View time board
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-3">
          <ActivityPanel
            title="Time activity"
            eyebrow="Labor"
            href="/dashboard/time"
            icon={Clock3Icon}
            items={recentTimeEntries}
            emptyLabel="No time activity has been recorded yet."
            renderItem={(entry) => (
              <>
                <p className="font-semibold text-zinc-950">{getEmployeeName(entry.employees)}</p>
                <p className="mt-1 text-zinc-600">{getJobLabel(entry.jobs)}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-full border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
                    {entry.status.replaceAll("_", " ")}
                  </Badge>
                  <DashboardActivityTime
                    value={entry.clock_in_at}
                    className="font-app-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500"
                  />
                </div>
              </>
            )}
          />

          <ActivityPanel
            title="Daily reports"
            eyebrow="Reporting"
            href="/dashboard/daily-reports"
            icon={ClipboardListIcon}
            items={recentReports}
            emptyLabel="No daily reports have been filed yet."
            renderItem={(report) => (
              <>
                <p className="font-semibold text-zinc-950">{getJobLabel(report.jobs)}</p>
                <p className="mt-1 text-zinc-600">{getSubmitter(report.users)}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-full border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
                    Filed
                  </Badge>
                  <span className="font-app-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    {formatDateOnly(report.report_date)}
                  </span>
                </div>
              </>
            )}
          />

          <ActivityPanel
            title="Uploads"
            eyebrow="Project Record"
            href="/dashboard/uploads"
            icon={UploadIcon}
            items={recentUploads}
            emptyLabel={uploadsUnavailable ? "Recent uploads are temporarily unavailable." : "No files have been uploaded yet."}
            renderItem={(upload) => (
              <>
                <p className="font-semibold text-zinc-950">{upload.file_name}</p>
                <p className="mt-1 text-zinc-600">{getJobLabel(upload.jobs)}</p>
                <p className="mt-1 text-zinc-600">{getSubmitter(upload.users, upload.employees)}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-full border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
                    Upload
                  </Badge>
                  <DashboardActivityTime
                    value={upload.created_at}
                    className="font-app-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500"
                  />
                </div>
              </>
            )}
          />
        </div>
      </SurfaceCard>
    </div>
  );
}
