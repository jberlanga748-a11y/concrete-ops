"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
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
    title: "Compliance",
    items: [
      { href: "/dashboard/incidents", label: "Incidents", icon: "alert" },
      { href: "/dashboard/policies", label: "Policies", icon: "shield" },
      { href: "/dashboard/ppe", label: "PPE", icon: "hardhat" },
      { href: "/dashboard/toolbox-talks", label: "Toolbox Talks", icon: "chat" },
    ],
  },
];

function ConcreteTruckIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="7" cy="18" r="2.1" />
      <circle cx="18" cy="18" r="2.1" />
      <path d="M3 16V9.5A1.5 1.5 0 0 1 4.5 8H11l2.9-2.1a1.4 1.4 0 0 1 2.2.48L18 10h1.7A1.3 1.3 0 0 1 21 11.3V16" />
      <path d="M9 8v5.5" />
      <path d="M12.5 8.5 16 11" />
      <path d="M3 16h1.9" />
      <path d="M9.1 16H15.8" />
      <path d="M20.1 16H21" />
    </svg>
  );
}

function NavIcon({ icon, className = "h-4 w-4" }: { icon: IconName; className?: string }) {
  switch (icon) {
    case "users":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9" /><path d="M16 3.1a4 4 0 0 1 0 7.8" /></svg>;
    case "customers":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /><path d="M8 13h8" /></svg>;
    case "jobs":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v2" /><path d="M2 12h20" /></svg>;
    case "clock":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><circle cx="12" cy="12" r="9" /><path d="M12 7v6l4 2" /></svg>;
    case "clipboard":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><rect x="9" y="2" width="6" height="4" rx="1" /><path d="M9 4H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" /><path d="M9 12h6" /><path d="M9 16h6" /></svg>;
    case "alert":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>;
    case "shield":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>;
    case "hardhat":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="M2 16a10 10 0 0 1 20 0" /><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /><path d="M12 6v4" /><path d="M8 8.5 6.5 12" /><path d="M16 8.5 17.5 12" /></svg>;
    case "bell":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="M10.3 3.9A2 2 0 0 1 12 3a2 2 0 0 1 1.7.9" /><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>;
    case "settings":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 .6 1.7 1.7 0 0 1-2 0 1.6 1.6 0 0 0-1-.6 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4.6 15a1.6 1.6 0 0 0-.6-1 1.7 1.7 0 0 1 0-2 1.6 1.6 0 0 0 .6-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9 4.6a1.6 1.6 0 0 0 1-.6 1.7 1.7 0 0 1 2 0 1.6 1.6 0 0 0 1 .6 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8c.2.3.4.7.5 1.1.2 1 .2 1.9 0 2.9-.1.4-.3.8-.5 1.1Z" /></svg>;
    case "check":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="M20 6 9 17l-5-5" /></svg>;
    case "chat":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
    case "file":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8" /><path d="M8 17h8" /><path d="M8 9h2" /></svg>;
    case "upload":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M20 16.5v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-2" /></svg>;
    case "dashboard":
    default:
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10.5V20h14v-9.5" /><path d="M9 20v-6h6v6" /></svg>;
  }
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: AppRole;
}) {
  const pathname = usePathname();
  const sections = role === "foreman" ? foremanSections : adminSections;
  const flatNav = sections.flatMap((section) => section.items);
  const mobileQuickNav = flatNav.slice(0, 4);
  const mobileMoreNav = flatNav.slice(4);
  const showSettingsShortcut = role !== "foreman";
  const portalTitle = role === "foreman" ? "Foreman Workspace" : "Admin Portal";
  const portalDescription =
    role === "foreman"
      ? "Keep crews moving, reports filed, and field issues visible."
      : "Keep field activity, office workflows, and compliance work organized from one control panel.";

  return (
    <div className="min-h-screen bg-zinc-100">
      <header className="sticky top-0 z-30 border-b bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Concrete Ops AI</p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">{portalTitle}</p>
          </div>
          <SignOutButton className="rounded-xl border px-4 py-3 text-sm font-medium disabled:opacity-50" />
        </div>

        <div className={`mt-3 grid gap-2 ${showSettingsShortcut ? "grid-cols-2" : "grid-cols-1"}`}>
          <Link href="/employee" className="rounded-2xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-center text-sm font-medium text-zinc-800">
            Employee Portal
          </Link>
          {showSettingsShortcut ? (
            <Link href="/dashboard/settings" className="rounded-2xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-center text-sm font-medium text-zinc-800">
              Settings
            </Link>
          ) : null}
        </div>
      </header>

      <div className="mx-auto flex min-h-screen w-full max-w-[1680px]">
        <aside className="hidden w-[308px] border-r border-zinc-800 bg-zinc-950 px-5 py-6 text-zinc-100 lg:block">
          <div className="rounded-[28px] border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-[0_12px_30px_rgba(249,115,22,0.32)]">
                <ConcreteTruckIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-400">Construction Operations</p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-white">Concrete Ops AI</h1>
                <p className="mt-2 text-sm font-medium text-zinc-200">{portalTitle}</p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-zinc-400">{portalDescription}</p>
          </div>

          <div className="mt-6 space-y-5">
            {sections.map((section) => (
              <div key={section.title}>
                <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  {section.title}
                </p>
                <nav className="mt-2 space-y-1.5">
                  {section.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
                          active
                            ? "bg-orange-500 text-white shadow-[0_14px_28px_rgba(249,115,22,0.28)]"
                            : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                            active ? "bg-white/18 text-white" : "bg-zinc-900 text-zinc-400"
                          }`}
                        >
                          <NavIcon icon={item.icon} className="h-4 w-4" />
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[28px] border border-zinc-800 bg-zinc-900/80 p-4">
            <Link
              href="/employee"
              className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm font-medium text-zinc-100 transition hover:border-zinc-700 hover:bg-zinc-900"
            >
              <span>Employee Portal</span>
              <span className="text-zinc-500">Open</span>
            </Link>
            <SignOutButton className="mt-3 w-full rounded-2xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800 disabled:opacity-50" />
          </div>
        </aside>

        <main className="flex-1 px-4 pb-28 pt-4 md:px-6 md:pt-6 lg:bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.08),_transparent_20%),linear-gradient(180deg,#f4f4f5_0%,#fafafa_100%)] lg:p-8 lg:pb-8">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-white p-3 shadow-[0_-10px_24px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="grid grid-cols-4 gap-2">
          {mobileQuickNav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl border px-3 py-3 text-center text-xs font-medium transition ${
                  active ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-zinc-50 text-zinc-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {mobileMoreNav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl border px-3 py-3 text-center text-xs font-medium transition ${
                  active ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-zinc-50 text-zinc-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
