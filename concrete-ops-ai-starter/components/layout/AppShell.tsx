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
  switch (icon) {
    case "users":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
          <path d="M16 3.1a4 4 0 0 1 0 7.8" />
        </svg>
      );
    case "customers":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
          <path d="M8 13h8" />
        </svg>
      );
    case "jobs":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v2" />
          <path d="M2 12h20" />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6l4 2" />
        </svg>
      );
    case "clipboard":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <rect x="9" y="2" width="6" height="4" rx="1" />
          <path d="M9 4H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
          <path d="M9 12h6" />
          <path d="M9 16h6" />
        </svg>
      );
    case "alert":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        </svg>
      );
    case "hardhat":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M2 16a10 10 0 0 1 20 0" />
          <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          <path d="M12 6v4" />
          <path d="M8 8.5 6.5 12" />
          <path d="M16 8.5 17.5 12" />
        </svg>
      );
    case "bell":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M10.3 3.9A2 2 0 0 1 12 3a2 2 0 0 1 1.7.9" />
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 .6 1.7 1.7 0 0 1-2 0 1.6 1.6 0 0 0-1-.6 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4.6 15a1.6 1.6 0 0 0-.6-1 1.7 1.7 0 0 1 0-2 1.6 1.6 0 0 0 .6-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9 4.6a1.6 1.6 0 0 0 1-.6 1.7 1.7 0 0 1 2 0 1.6 1.6 0 0 0 1 .6 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8c.2.3.4.7.5 1.1.2 1 .2 1.9 0 2.9-.1.4-.3.8-.5 1.1Z" />
        </svg>
      );
    case "check":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    case "chat":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "file":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8" />
          <path d="M8 17h8" />
          <path d="M8 9h2" />
        </svg>
      );
    case "upload":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M12 16V4" />
          <path d="m7 9 5-5 5 5" />
          <path d="M20 16.5v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-2" />
        </svg>
      );
    case "dashboard":
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(201,106,44,0.12),_transparent_20%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.08),_transparent_22%),linear-gradient(180deg,#eef2f4_0%,#f7f8f6_55%,#fbfbfa_100%)] text-zinc-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[1720px] gap-4 px-3 pb-28 pt-3 sm:px-4 lg:gap-6 lg:px-6 lg:pb-6 lg:pt-6">
        <aside className="hidden w-[330px] shrink-0 lg:block">
          <div className="sticky top-6 overflow-hidden rounded-[32px] border border-[#18232d] bg-[#0c141c] text-zinc-100 shadow-[0_32px_70px_rgba(15,23,42,0.24)]">
            <div className="border-b border-white/10 p-5">
              <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(155deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))] p-5">
                <p className="font-app-mono text-[11px] uppercase tracking-[0.24em] text-zinc-400">Premium Operations Platform</p>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-[1.7rem] font-semibold tracking-[-0.05em] text-white">Concrete Ops AI</h1>
                    <p className="mt-2 max-w-[18rem] text-sm leading-6 text-zinc-300">
                      A sharper control layer for field execution, office coordination, and documentation.
                    </p>
                  </div>
                  <Badge className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">{portalTitle}</Badge>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-[22px] border border-white/10 bg-black/10 p-3">
                    <p className="font-app-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">Workstreams</p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">{sections.length}</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-black/10 p-3">
                    <p className="font-app-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">Modules</p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">{totalModules}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-h-[calc(100vh-22rem)] overflow-y-auto px-5 py-5">
              {sections.map((section) => (
                <section key={section.title} className="mb-6 last:mb-0">
                  <div className="mb-3 px-1">
                    <p className="font-app-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">{section.title}</p>
                    <p className="mt-2 text-xs leading-5 text-zinc-400">{getSectionSummary(section.title)}</p>
                  </div>

                  <div className="space-y-2">
                    {section.items.map((item) => {
                      const active = isActive(pathname, item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`group flex items-center gap-3 rounded-[22px] border px-4 py-3 transition ${
                            active
                              ? "border-[#cf6f33]/60 bg-[linear-gradient(135deg,rgba(201,106,44,0.24),rgba(201,106,44,0.08))] text-white shadow-[0_18px_35px_rgba(201,106,44,0.18)]"
                              : "border-white/8 bg-white/[0.03] text-zinc-300 hover:border-white/14 hover:bg-white/[0.06] hover:text-white"
                          }`}
                        >
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                              active
                                ? "border-white/20 bg-white/10 text-white"
                                : "border-white/10 bg-black/10 text-zinc-400 group-hover:border-white/15 group-hover:text-white"
                            }`}
                          >
                            <NavIcon icon={item.icon} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold">{item.label}</span>
                            <span className={`mt-1 block text-xs ${active ? "text-orange-100/90" : "text-zinc-500 group-hover:text-zinc-300"}`}>
                              {section.title}
                            </span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            <div className="border-t border-white/10 p-5">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">Workspace Status</p>
                    <p className="mt-2 text-base font-semibold text-white">{getRoleLabel(role)}</p>
                  </div>
                  <Badge variant="outline" className="rounded-full border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-300">
                    <ViewerCurrentDateLabel monthStyle="short" />
                  </Badge>
                </div>

                <p className="mt-3 text-sm leading-6 text-zinc-300">{getRoleSummary(role)}</p>

                <div className={`mt-4 grid gap-2 ${showSettingsShortcut ? "grid-cols-2" : "grid-cols-1"}`}>
                  <Link
                    href="/employee"
                    className="rounded-[20px] border border-white/10 bg-black/10 px-4 py-3 text-center text-sm font-medium text-zinc-100 transition hover:border-white/20 hover:bg-white/8"
                  >
                    Employee Portal
                  </Link>
                  {showSettingsShortcut ? (
                    <Link
                      href="/dashboard/settings"
                      className="rounded-[20px] border border-white/10 bg-black/10 px-4 py-3 text-center text-sm font-medium text-zinc-100 transition hover:border-white/20 hover:bg-white/8"
                    >
                      Settings
                    </Link>
                  ) : null}
                </div>

                <SignOutButton className="mt-3 w-full rounded-[20px] border border-white/12 bg-white/[0.02] px-4 py-3 text-sm font-medium text-zinc-100 transition hover:bg-white/[0.08] disabled:opacity-50" />
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4 lg:gap-6">
          <header className="rounded-[30px] border border-[#18232d] bg-[#0c141c] px-4 py-4 text-zinc-100 shadow-[0_24px_50px_rgba(15,23,42,0.18)] lg:hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-app-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Concrete Ops AI</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.04em] text-white">{activeTitle}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {activeSection}
                  <ViewerCurrentDateLabel monthStyle="short" prefix=" · " />
                </p>
              </div>
              <SignOutButton className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-100 transition hover:bg-white/10 disabled:opacity-50" />
            </div>

            <div className={`mt-4 grid gap-2 ${showSettingsShortcut ? "grid-cols-2" : "grid-cols-1"}`}>
              <Link
                href="/employee"
                className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-medium text-zinc-100"
              >
                Employee Portal
              </Link>
              {showSettingsShortcut ? (
                <Link
                  href="/dashboard/settings"
                  className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-medium text-zinc-100"
                >
                  Settings
                </Link>
              ) : null}
            </div>

            <details className="group mt-4 rounded-[24px] border border-white/10 bg-white/5 p-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-white">
                Browse all modules
                <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-300">
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
                          ? "border-[#cf6f33]/60 bg-[rgba(201,106,44,0.16)] text-white"
                          : "border-white/10 bg-black/10 text-zinc-300"
                      }`}
                    >
                      <span className="block font-medium">{item.label}</span>
                      <span className="mt-1 block text-xs text-zinc-500">{item.sectionTitle}</span>
                    </Link>
                  );
                })}
              </div>
            </details>
          </header>

          <section className="hidden rounded-[32px] border border-white/80 bg-white/78 px-6 py-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur lg:block">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <p className="font-app-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">{activeSection}</p>
                <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.055em] text-[#101828]">{activeTitle}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5b6574]">{getSectionSummary(activeSection)}</p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <div className="rounded-[22px] border border-zinc-200/80 bg-white/80 px-4 py-3">
                  <p className="font-app-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">Today</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900">
                    <ViewerCurrentDateLabel monthStyle="short" />
                  </p>
                </div>
                <Link
                  href="/employee"
                  className="rounded-[20px] border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
                >
                  Employee Portal
                </Link>
                {showSettingsShortcut ? (
                  <Link
                    href="/dashboard/settings"
                    className="rounded-[20px] border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
                  >
                    Settings
                  </Link>
                ) : null}
              </div>
            </div>
          </section>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/70 bg-[rgba(247,248,249,0.92)] px-3 py-3 shadow-[0_-18px_40px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-4 gap-2">
          {primaryMobileNav.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-[20px] border px-3 py-3 text-center transition ${
                  active
                    ? "border-[#cf6f33]/60 bg-[rgba(201,106,44,0.14)] text-zinc-950 shadow-[0_12px_24px_rgba(201,106,44,0.16)]"
                    : "border-white/80 bg-white/75 text-zinc-700"
                }`}
              >
                <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-2xl bg-white/70">
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
