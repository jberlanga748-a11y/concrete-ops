"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ViewerCurrentDateLabel } from "@/components/time/ViewerCurrentDateLabel";
import { Badge } from "@/components/ui/badge";
import type { AppRole } from "@/lib/auth/roles";

type IconName =
  | "dashboard"
  | "users"
  | "customers"
  | "jobs"
  | "clock"
  | "clipboard"
  | "alert"
  | "shield"
  | "hardhat"
  | "bell"
  | "file"
  | "upload"
  | "settings"
  | "check"
  | "chat";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const adminSections: NavSection[] = [
  {
    title: "Field Ops",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
      { href: "/dashboard/jobs", label: "Jobs", icon: "jobs" },
      { href: "/dashboard/time", label: "Time", icon: "clock" },
      { href: "/dashboard/daily-reports", label: "Daily Reports", icon: "clipboard" },
      { href: "/dashboard/change-orders", label: "Change Orders", icon: "file" },
      { href: "/dashboard/uploads", label: "Uploads", icon: "upload" },
    ],
  },
  {
    title: "Tools & AI",
    items: [{ href: "/dashboard/concrete-calculator", label: "Concrete Calculator", icon: "file" }],
  },
  {
    title: "Office",
    items: [
      { href: "/dashboard/customers", label: "Customers", icon: "customers" },
      { href: "/dashboard/estimates", label: "Estimates", icon: "file" },
      { href: "/dashboard/proposals", label: "Proposals", icon: "chat" },
      { href: "/dashboard/approvals", label: "Approvals", icon: "check" },
    ],
  },
  {
    title: "Compliance",
    items: [
      { href: "/dashboard/incidents", label: "Incidents", icon: "alert" },
      { href: "/dashboard/policies", label: "Policies", icon: "shield" },
      { href: "/dashboard/ppe", label: "PPE", icon: "hardhat" },
      { href: "/dashboard/toolbox-talks", label: "Toolbox Talks", icon: "chat" },
      { href: "/dashboard/notifications", label: "Notifications", icon: "bell" },
    ],
  },
  {
    title: "Admin",
    items: [
      { href: "/dashboard/employees", label: "Employees", icon: "users" },
      { href: "/dashboard/audit-logs", label: "Audit Logs", icon: "file" },
      { href: "/dashboard/settings", label: "Settings", icon: "settings" },
    ],
  },
];

const foremanSections: NavSection[] = [
  {
    title: "Field Ops",
    items: [
      { href: "/dashboard/foreman", label: "Foreman", icon: "dashboard" },
      { href: "/dashboard/jobs", label: "Jobs", icon: "jobs" },
      { href: "/dashboard/time", label: "Time", icon: "clock" },
      { href: "/dashboard/daily-reports", label: "Daily Reports", icon: "clipboard" },
      { href: "/dashboard/change-orders", label: "Change Orders", icon: "file" },
      { href: "/dashboard/uploads", label: "Uploads", icon: "upload" },
    ],
  },
  {
    title: "Tools",
    items: [{ href: "/dashboard/concrete-calculator", label: "Concrete Calculator", icon: "file" }],
  },
  {
    title: "Compliance",
    items: [
      { href: "/dashboard/incidents", label: "Incidents", icon: "alert" },
      { href: "/dashboard/policies", label: "Policies", icon: "shield" },
      { href: "/dashboard/ppe", label: "PPE", icon: "hardhat" },
      { href: "/dashboard/toolbox-talks", label: "Toolbox Talks", icon: "chat" },
    ],
  },
];

function NavIcon({ icon, className = "h-[18px] w-[18px]" }: { icon: IconName; className?: string }) {
  const sharedProps = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    className,
    width: 18,
    height: 18,
    "aria-hidden": true,
    focusable: false,
    style: { flexShrink: 0 },
  } as const;

  switch (icon) {
    case "users":
      return (
        <svg viewBox="0 0 24 24" {...sharedProps}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
          <path d="M16 3.1a4 4 0 0 1 0 7.8" />
        </svg>
      );
    case "customers":
      return (
        <svg viewBox="0 0 24 24" {...sharedProps}>
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
          <path d="M8 13h8" />
        </svg>
      );
    case "jobs":
      return (
        <svg viewBox="0 0 24 24" {...sharedProps}>
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v2" />
          <path d="M2 12h20" />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" {...sharedProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6l4 2" />
        </svg>
      );
    case "clipboard":
      return (
        <svg viewBox="0 0 24 24" {...sharedProps}>
          <rect x="9" y="2" width="6" height="4" rx="1" />
          <path d="M9 4H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
          <path d="M9 12h6" />
          <path d="M9 16h6" />
        </svg>
      );
    case "alert":
      return (
        <svg viewBox="0 0 24 24" {...sharedProps}>
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" {...sharedProps}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        </svg>
      );
    case "hardhat":
      return (
        <svg viewBox="0 0 24 24" {...sharedProps}>
          <path d="M2 16a10 10 0 0 1 20 0" />
          <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          <path d="M12 6v4" />
          <path d="M8 8.5 6.5 12" />
          <path d="M16 8.5 17.5 12" />
        </svg>
      );
    case "bell":
      return (
        <svg viewBox="0 0 24 24" {...sharedProps}>
          <path d="M10.3 3.9A2 2 0 0 1 12 3a2 2 0 0 1 1.7.9" />
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" {...sharedProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 .6 1.7 1.7 0 0 1-2 0 1.6 1.6 0 0 0-1-.6 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4.6 15a1.6 1.6 0 0 0-.6-1 1.7 1.7 0 0 1 0-2 1.6 1.6 0 0 0 .6-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9 4.6a1.6 1.6 0 0 0 1-.6 1.7 1.7 0 0 1 2 0 1.6 1.6 0 0 0 1 .6 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8c.2.3.4.7.5 1.1.2 1 .2 1.9 0 2.9-.1.4-.3.8-.5 1.1Z" />
        </svg>
      );
    case "check":
      return (
        <svg viewBox="0 0 24 24" {...sharedProps}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    case "chat":
      return (
        <svg viewBox="0 0 24 24" {...sharedProps}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "file":
      return (
        <svg viewBox="0 0 24 24" {...sharedProps}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8" />
          <path d="M8 17h8" />
          <path d="M8 9h2" />
        </svg>
      );
    case "upload":
      return (
        <svg viewBox="0 0 24 24" {...sharedProps}>
          <path d="M12 16V4" />
          <path d="m7 9 5-5 5 5" />
          <path d="M20 16.5v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-2" />
        </svg>
      );
    case "dashboard":
    default:
      return (
        <svg viewBox="0 0 24 24" {...sharedProps}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5 10.5V20h14v-9.5" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );
  }
}

function isActive(pathname: string, href: string) {
  if (href.includes("#")) return false;
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getRoleLabel(role?: AppRole) {
  switch (role) {
    case "owner":
      return "Owner access";
    case "office_admin":
      return "Office admin access";
    case "foreman":
      return "Foreman access";
    default:
      return "Operations access";
  }
}

function getRoleSummary(role?: AppRole) {
  if (role === "foreman") {
    return "Track field execution, paperwork, and compliance without losing sight of what the crew needs next.";
  }

  return "Coordinate labor, documentation, and office follow-up through one command layer with clearer priorities.";
}

function getSectionSummary(sectionTitle?: string) {
  switch (sectionTitle) {
    case "Field Ops":
      return "Keep execution, labor, and reporting aligned as the day moves.";
    case "Tools & AI":
    case "Tools":
      return "Use specialized tools without cluttering the rest of the operation.";
    case "Office":
      return "Stay ahead of estimating, customer context, and approvals.";
    case "Compliance":
      return "Surface risk, policy, and safety work before it becomes reactive.";
    case "Admin":
      return "Manage the people, logs, and system settings behind the operation.";
    default:
      return "Move across the platform with a cleaner operations view.";
  }
}

export function AppShell({
  children,
  role,
}: {
  children: ReactNode;
  role?: AppRole;
}) {
  const pathname = usePathname();
  const sections = (role === "foreman" ? foremanSections : adminSections).map((section) => {
    if (section.title !== "Tools & AI") return section;
    if (!["owner", "office_admin"].includes(role ?? "")) return section;

    return {
      ...section,
      items: [...section.items, { href: "/dashboard#admin-ops-copilot", label: "Admin Ops Copilot", icon: "chat" as const }],
    };
  });

  const navEntries = sections.flatMap((section) =>
    section.items.map((item) => ({
      ...item,
      sectionTitle: section.title,
    }))
  );
  const activeEntry = navEntries.find((entry) => isActive(pathname, entry.href));
  const primaryMobileNav = navEntries.filter((entry) => !entry.href.includes("#")).slice(0, 4);
  const secondaryMobileNav = navEntries.filter(
    (entry) => !primaryMobileNav.some((primaryItem) => primaryItem.href === entry.href)
  );
  const showSettingsShortcut = role !== "foreman";
  const portalTitle = role === "foreman" ? "Foreman Workspace" : "Operations Command";
  const activeTitle = activeEntry?.label ?? portalTitle;
  const activeSection = activeEntry?.sectionTitle ?? "Overview";
  const totalModules = navEntries.filter((entry) => !entry.href.includes("#")).length;
  const sectionSummary = getSectionSummary(activeSection);

  return (
    <div className="min-h-screen bg-[#f8fbff] text-slate-950">
      <div className="mx-auto min-h-screen w-full max-w-[1800px] px-3 pb-28 pt-3 sm:px-4 lg:px-6 lg:pb-6 lg:pt-6">
        <div className="grid min-h-full gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="hidden min-w-0 lg:block">
            <div className="sticky top-6 overflow-hidden rounded-[2rem] border border-blue-100 bg-white text-slate-950 shadow-sm shadow-blue-950/5">
              <div className="border-b border-blue-100 p-5">
                <div className="rounded-3xl bg-blue-950 p-5 text-white shadow-xl shadow-blue-950/20">
                  <p className="font-app-mono text-[11px] uppercase tracking-[0.24em] text-blue-200">Operations Command</p>
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-[1.7rem] font-black tracking-[-0.03em] text-white">Concrete Ops</h1>
                      <p className="mt-3 max-w-[14rem] text-sm font-medium leading-6 text-blue-100">
                        A sharper control layer for field execution, office coordination, and documentation.
                      </p>
                    </div>
                    <Badge className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white">{portalTitle}</Badge>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-blue-100">
                      {sections.length} workstreams
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-blue-100">
                      {totalModules} modules
                    </span>
                  </div>
                </div>

                <div className="mt-4 rounded-3xl border border-blue-100 bg-blue-50 p-4">
                  <p className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-blue-700">Workspace</p>
                  <p className="mt-2 text-base font-black text-slate-950">{getRoleLabel(role)}</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{getRoleSummary(role)}</p>
                </div>
              </div>

              <div className="max-h-[calc(100vh-19rem)] overflow-y-auto px-4 py-5">
                {sections.map((section) => (
                  <section key={section.title} className="mb-6 last:mb-0">
                    <div className="mb-3 px-2">
                      <p className="font-app-mono text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">{section.title}</p>
                    </div>

                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const active = isActive(pathname, item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`group flex items-center gap-3 rounded-[18px] px-3 py-2.5 transition ${
                              active
                                ? "bg-blue-700 text-white shadow-lg shadow-blue-700/20"
                                : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                            }`}
                          >
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[16px] border ${
                                active
                                  ? "border-white/20 bg-white/10 text-white"
                                  : "border-blue-100 bg-blue-50 text-blue-700 group-hover:border-blue-200 group-hover:bg-white"
                              }`}
                            >
                              <NavIcon icon={item.icon} />
                            </span>
                            <span className="min-w-0 flex-1 text-[0.94rem] font-semibold">{item.label}</span>
                            <span
                              className={`h-2.5 w-2.5 rounded-full transition ${
                                active ? "bg-white" : "bg-blue-200 opacity-0 group-hover:opacity-100"
                              }`}
                            />
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>

              <div className="border-t border-blue-100 p-5">
                <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-blue-700">Workspace Status</p>
                      <p className="mt-2 text-base font-black text-slate-950">{getRoleLabel(role)}</p>
                    </div>
                    <Badge variant="outline" className="rounded-full border-blue-100 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">
                      <ViewerCurrentDateLabel monthStyle="short" />
                    </Badge>
                  </div>

                  <p className="mt-3 text-[13px] font-medium leading-5 text-slate-600">{getRoleSummary(role)}</p>

                  <div className={`mt-4 grid gap-2 ${showSettingsShortcut ? "grid-cols-2" : "grid-cols-1"}`}>
                    <Link
                      href="/employee"
                      className="rounded-full border border-blue-100 bg-white px-4 py-3 text-center text-sm font-black text-blue-700 transition hover:bg-blue-50"
                    >
                      Employee Portal
                    </Link>
                    {showSettingsShortcut ? (
                      <Link
                        href="/dashboard/settings"
                        className="rounded-full border border-blue-100 bg-white px-4 py-3 text-center text-sm font-black text-blue-700 transition hover:bg-blue-50"
                      >
                        Settings
                      </Link>
                    ) : null}
                  </div>

                  <SignOutButton className="mt-3 w-full rounded-full border border-blue-100 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-blue-50 disabled:opacity-50" />
                </div>
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="flex min-h-full flex-col gap-4 lg:gap-5 lg:rounded-[40px] lg:border lg:border-blue-100 lg:bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(248,251,255,0.74))] lg:p-4 lg:shadow-sm lg:shadow-blue-950/5 xl:p-5">
              <header className="rounded-[30px] border border-blue-100 bg-white px-4 py-4 text-slate-950 shadow-sm shadow-blue-950/5 lg:hidden">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-app-mono text-[11px] font-black uppercase tracking-[0.24em] text-blue-700">Concrete Ops</p>
                    <p className="mt-2 text-lg font-black tracking-[-0.02em] text-slate-950">{activeTitle}</p>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {activeSection}
                      <ViewerCurrentDateLabel monthStyle="short" prefix=" · " />
                    </p>
                  </div>
                  <SignOutButton className="rounded-full border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-blue-100 disabled:opacity-50" />
                </div>

                <div className={`mt-4 grid gap-2 ${showSettingsShortcut ? "grid-cols-2" : "grid-cols-1"}`}>
                  <Link
                    href="/employee"
                    className="rounded-full border border-blue-100 bg-blue-50 px-4 py-3 text-center text-sm font-black text-blue-700"
                  >
                    Employee Portal
                  </Link>
                  {showSettingsShortcut ? (
                    <Link
                      href="/dashboard/settings"
                      className="rounded-full border border-blue-100 bg-blue-50 px-4 py-3 text-center text-sm font-black text-blue-700"
                    >
                      Settings
                    </Link>
                  ) : null}
                </div>

                <details className="group mt-4 rounded-3xl border border-blue-100 bg-blue-50/70 p-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black text-slate-950">
                    Browse all modules
                    <span className="rounded-full border border-blue-100 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">
                      {totalModules}
                    </span>
                  </summary>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {secondaryMobileNav.map((item) => {
                      const active = isActive(pathname, item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`rounded-[18px] border px-3 py-3 text-sm transition ${
                            active
                              ? "border-blue-600 bg-blue-700 text-white"
                              : "border-blue-100 bg-white text-slate-700"
                          }`}
                        >
                          <span className="block font-black">{item.label}</span>
                          <span className={`mt-1 block text-xs ${active ? "text-blue-100" : "text-slate-500"}`}>{item.sectionTitle}</span>
                        </Link>
                      );
                    })}
                  </div>
                </details>
              </header>

          <section className="hidden rounded-[36px] border border-blue-100 bg-white px-7 py-6 shadow-sm shadow-blue-950/5 backdrop-blur lg:block xl:px-8">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.52fr)_minmax(320px,0.88fr)] xl:items-start">
              <div className="min-w-0 rounded-[30px] border border-blue-100 bg-blue-50/60 px-6 py-6 shadow-sm shadow-blue-950/5 xl:px-7">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-app-mono text-[11px] font-black uppercase tracking-[0.24em] text-blue-700">{activeSection}</p>
                  <Badge
                    variant="outline"
                    className="rounded-full border border-blue-100 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-blue-700"
                  >
                    {getRoleLabel(role)}
                  </Badge>
                </div>
                <h2 className="mt-4 text-[2.6rem] font-black tracking-[-0.05em] text-slate-950">{activeTitle}</h2>
                <p className="mt-4 max-w-5xl text-sm font-medium leading-7 text-slate-600">{sectionSummary}</p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/employee"
                    className="rounded-full border border-blue-100 bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm shadow-blue-950/5 transition hover:bg-blue-50"
                  >
                    Employee Portal
                  </Link>
                  {showSettingsShortcut ? (
                    <Link
                      href="/dashboard/settings"
                      className="rounded-full border border-blue-100 bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm shadow-blue-950/5 transition hover:bg-blue-50"
                    >
                      Settings
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[30px] border border-blue-950 bg-blue-950 p-5 text-white shadow-xl shadow-blue-950/20">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-app-mono text-[10px] uppercase tracking-[0.2em] text-blue-200">Workspace posture</p>
                      <h3 className="mt-3 text-[1.2rem] font-black tracking-[-0.02em] text-white">Keep the main product plane in focus.</h3>
                    </div>
                    <Badge className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                      {portalTitle}
                    </Badge>
                  </div>
                  <p className="mt-4 text-sm font-medium leading-7 text-blue-100">{getRoleSummary(role)}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-4">
                      <p className="font-app-mono text-[10px] uppercase tracking-[0.18em] text-blue-200">Today</p>
                      <p className="mt-2 text-sm font-black text-white">
                        <ViewerCurrentDateLabel monthStyle="short" />
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-4">
                      <p className="font-app-mono text-[10px] uppercase tracking-[0.18em] text-blue-200">Modules</p>
                      <p className="mt-2 text-[1.35rem] font-black tracking-[-0.02em] text-white">{totalModules}</p>
                      <p className="mt-1 text-xs font-medium leading-5 text-blue-100">{activeSection} stays anchored in the main workspace.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[30px] border border-blue-100 bg-white p-5 shadow-sm shadow-blue-950/5">
                  <p className="font-app-mono text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">Current surface</p>
                  <p className="mt-3 text-[1.15rem] font-black tracking-[-0.02em] text-slate-950">{activeTitle}</p>
                  <p className="mt-2 text-sm font-medium leading-7 text-slate-600">{sectionSummary}</p>
                  <div className={`mt-5 grid gap-3 ${showSettingsShortcut ? "sm:grid-cols-2 xl:grid-cols-1" : "grid-cols-1"}`}>
                    <div className="rounded-[22px] border border-blue-100 bg-blue-50/70 px-4 py-4">
                      <p className="font-app-mono text-[10px] uppercase tracking-[0.18em] text-blue-700">Access</p>
                      <p className="mt-2 text-sm font-black text-slate-950">{getRoleLabel(role)}</p>
                    </div>
                    {showSettingsShortcut ? (
                      <div className="rounded-[22px] border border-blue-100 bg-blue-50/70 px-4 py-4">
                        <p className="font-app-mono text-[10px] uppercase tracking-[0.18em] text-blue-700">Shortcut</p>
                        <p className="mt-2 text-sm font-black text-slate-950">Settings stays one hop away.</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </section>

              <main className="min-w-0 flex-1 lg:px-1">{children}</main>
            </div>
          </div>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-blue-100 bg-white/95 px-3 py-3 shadow-[0_-18px_40px_rgba(30,64,175,0.12)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-4 gap-2">
          {primaryMobileNav.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-[20px] border px-3 py-3 text-center transition ${
                  active
                    ? "border-blue-700 bg-blue-700 text-white shadow-lg shadow-blue-700/20"
                    : "border-blue-100 bg-blue-50/70 text-slate-600"
                }`}
              >
                <span className={`mx-auto flex h-8 w-8 items-center justify-center rounded-2xl ${active ? "bg-white/15" : "bg-white"}`}>
                  <NavIcon icon={item.icon} className="h-4 w-4" />
                </span>
                <span className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.12em]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
