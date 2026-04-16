"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { cn } from "@/components/ui/cn";
import { AppIcon } from "@/components/ui/icons";
import type { AppRole } from "@/lib/auth/roles";

type NavItem = {
  href: string;
  label: string;
  icon: Parameters<typeof AppIcon>[0]["icon"];
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const adminPrimaryMobileNav: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/dashboard/jobs", label: "Jobs", icon: "hammer" },
  { href: "/dashboard/time", label: "Time", icon: "clock" },
  { href: "/dashboard/daily-reports", label: "Reports", icon: "clipboard" },
];

const adminSections: NavSection[] = [
  {
    title: "Operations",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "home" },
      { href: "/dashboard/jobs", label: "Jobs", icon: "hammer" },
      { href: "/dashboard/time", label: "Time", icon: "clock" },
      { href: "/dashboard/daily-reports", label: "Daily Reports", icon: "clipboard" },
      { href: "/dashboard/uploads", label: "Uploads", icon: "upload" },
      { href: "/dashboard/change-orders", label: "Change Orders", icon: "document" },
      { href: "/dashboard/toolbox-talks", label: "Toolbox Talks", icon: "chat" },
      { href: "/dashboard/incidents", label: "Incidents", icon: "alert" },
    ],
  },
  {
    title: "Commercial",
    items: [
      { href: "/dashboard/customers", label: "Customers", icon: "briefcase" },
      { href: "/dashboard/estimates", label: "Estimates", icon: "calculator" },
      { href: "/dashboard/proposals", label: "Proposals", icon: "clipboard" },
      { href: "/dashboard/approvals", label: "Approvals", icon: "check" },
    ],
  },
  {
    title: "People & Compliance",
    items: [
      { href: "/dashboard/employees", label: "Employees", icon: "users" },
      { href: "/dashboard/policies", label: "Policies", icon: "shield" },
      { href: "/dashboard/ppe", label: "PPE", icon: "hardhat" },
      { href: "/dashboard/notifications", label: "Notifications", icon: "bell" },
      { href: "/dashboard/audit-logs", label: "Audit Logs", icon: "list" },
      { href: "/dashboard/settings", label: "Settings", icon: "gear" },
    ],
  },
];

const ownerExtraSection: NavSection = {
  title: "Owner Tools",
  items: [{ href: "/dashboard/setup", label: "Setup", icon: "wand" }],
};

const foremanPrimaryMobileNav: NavItem[] = [
  { href: "/dashboard/foreman", label: "Home", icon: "home" },
  { href: "/dashboard/jobs", label: "Jobs", icon: "hammer" },
  { href: "/dashboard/time", label: "Time", icon: "clock" },
  { href: "/dashboard/daily-reports", label: "Reports", icon: "clipboard" },
];

const foremanSections: NavSection[] = [
  {
    title: "Field Work",
    items: [
      { href: "/dashboard/foreman", label: "Foreman", icon: "home" },
      { href: "/dashboard/jobs", label: "Jobs", icon: "hammer" },
      { href: "/dashboard/time", label: "Time", icon: "clock" },
      { href: "/dashboard/daily-reports", label: "Daily Reports", icon: "clipboard" },
      { href: "/dashboard/uploads", label: "Uploads", icon: "upload" },
      { href: "/dashboard/change-orders", label: "Change Orders", icon: "document" },
    ],
  },
  {
    title: "Safety",
    items: [
      { href: "/dashboard/toolbox-talks", label: "Toolbox Talks", icon: "chat" },
      { href: "/dashboard/incidents", label: "Incidents", icon: "alert" },
      { href: "/dashboard/policies", label: "Policies", icon: "shield" },
      { href: "/dashboard/ppe", label: "PPE", icon: "hardhat" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function buildAdminSections(role?: AppRole) {
  return role === "owner" ? [...adminSections, ownerExtraSection] : adminSections;
}

function flattenItems(sections: NavSection[]) {
  return sections.flatMap((section) => section.items);
}

function getMobileNav(role?: AppRole) {
  if (role === "foreman") {
    const sections = foremanSections;
    const primary = foremanPrimaryMobileNav;
    const more = flattenItems(sections).filter((item) => !primary.some((primaryItem) => primaryItem.href === item.href));
    return { sections, primary, more };
  }

  const sections = buildAdminSections(role);
  const primary = adminPrimaryMobileNav;
  const more = flattenItems(sections).filter((item) => !primary.some((primaryItem) => primaryItem.href === item.href));
  return { sections, primary, more };
}

function SidebarLink({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
}) {
  const active = isActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition",
        collapsed && "justify-center px-2",
        active
          ? "bg-zinc-900 text-white shadow-[0_14px_32px_rgba(24,24,27,0.18)]"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
      )}
      title={collapsed ? item.label : undefined}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border transition",
          active ? "border-white/20 bg-white/10" : "border-zinc-200 bg-white group-hover:border-zinc-300",
        )}
      >
        <AppIcon icon={item.icon} className="h-4 w-4" />
      </span>
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );
}

function MobileNav({
  pathname,
  primaryItems,
  moreItems,
  title,
}: {
  pathname: string;
  primaryItems: NavItem[];
  moreItems: NavItem[];
  title: string;
}) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-3 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-2">
          {primaryItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-2xl px-2 py-2 text-center text-[11px] font-medium transition",
                  active ? "bg-zinc-900 text-white shadow-sm" : "bg-zinc-100 text-zinc-700",
                )}
              >
                <span className="flex flex-col items-center gap-1">
                  <AppIcon icon={item.icon} className="h-4 w-4" />
                  <span>{item.label}</span>
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            className={cn(
              "rounded-2xl px-2 py-2 text-center text-[11px] font-medium transition",
              moreItems.some((item) => isActive(pathname, item.href)) ? "bg-zinc-900 text-white shadow-sm" : "bg-zinc-100 text-zinc-700",
            )}
          >
            <span className="flex flex-col items-center gap-1">
              <AppIcon icon="menu" className="h-4 w-4" />
              <span>More</span>
            </span>
          </button>
        </div>
      </nav>

      {isMoreOpen ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40 lg:hidden" onClick={() => setIsMoreOpen(false)}>
          <div
            className="w-full rounded-t-[2rem] bg-white px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] pt-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-200" />
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{title}</p>
                <h2 className="mt-1 text-xl font-semibold text-zinc-950">More</h2>
              </div>
              <button type="button" onClick={() => setIsMoreOpen(false)} className="rounded-2xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700">
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {moreItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border px-4 py-4 text-sm font-medium transition",
                      active ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100",
                    )}
                  >
                    <AppIcon icon={item.icon} className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function AppShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: AppRole;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { sections, primary, more } = getMobileNav(role);
  const portalTitle = role === "foreman" ? "Foreman Portal" : "Admin Portal";
  const introCopy =
    role === "foreman"
      ? "Field-first access to jobs, time, reports, and safety workflows."
      : "Operations, compliance, and field visibility in one premium workspace.";

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(24,24,27,0.08),_transparent_22%),linear-gradient(180deg,#f4f4f5_0%,#fafafa_100%)]">
        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Concrete Ops AI</p>
              <p className="mt-1 text-xl font-semibold text-zinc-950">{portalTitle}</p>
            </div>
            <SignOutButton className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 disabled:opacity-50" />
          </div>
        </header>

        <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
          <aside
            className={cn(
              "hidden border-r border-zinc-200 bg-white/92 px-4 py-6 backdrop-blur lg:flex lg:flex-col",
              collapsed ? "w-24" : "w-[320px]",
            )}
          >
            <div className={cn("flex items-start justify-between gap-3", collapsed && "justify-center")}>
              {!collapsed ? (
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Concrete Ops AI</p>
                  <h1 className="mt-3 text-2xl font-semibold text-zinc-950">{portalTitle}</h1>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-600">{introCopy}</p>
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-zinc-900 text-white shadow-sm">
                  <AppIcon icon="sparkles" className="h-5 w-5" />
                </div>
              )}

              <button
                type="button"
                onClick={() => setCollapsed((current) => !current)}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-2 text-zinc-700 transition hover:bg-zinc-100"
              >
                <AppIcon icon={collapsed ? "chevron-right" : "chevron-left"} className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-8 flex-1 space-y-6 overflow-y-auto pr-1">
              {sections.map((section) => (
                <div key={section.title}>
                  {!collapsed ? (
                    <p className="mb-3 px-3 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
                      {section.title}
                    </p>
                  ) : null}
                  <div className="space-y-2">
                    {section.items.map((item) => (
                      <SidebarLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <Link
                href="/employee"
                className={cn(
                  "flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100",
                  collapsed && "justify-center px-2",
                )}
                title={collapsed ? "Employee Portal" : undefined}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white">
                  <AppIcon icon="folder" className="h-4 w-4" />
                </span>
                {!collapsed ? <span>Employee Portal</span> : null}
              </Link>
              <SignOutButton
                className={cn(
                  "w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50",
                  collapsed && "px-2",
                )}
              />
            </div>
          </aside>

          <main className="flex-1 px-4 pb-28 pt-4 md:px-6 md:pt-6 lg:p-8 lg:pb-10">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>

        <MobileNav pathname={pathname} primaryItems={primary} moreItems={more} title={portalTitle} />
      </div>
    </ToastProvider>
  );
}
