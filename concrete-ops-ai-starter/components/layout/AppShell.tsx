"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { cn } from "@/components/ui/cn";
import type { AppRole } from "@/lib/auth/roles";

const adminNav = [
  { href: "/dashboard", label: "Dashboard", icon: "home" },
  { href: "/dashboard/employees", label: "Employees", icon: "users" },
  { href: "/dashboard/customers", label: "Customers", icon: "briefcase" },
  { href: "/dashboard/estimates", label: "Estimates", icon: "calculator" },
  { href: "/dashboard/proposals", label: "Proposals", icon: "clipboard" },
  { href: "/dashboard/approvals", label: "Approvals", icon: "check" },
  { href: "/dashboard/jobs", label: "Jobs", icon: "hammer" },
  { href: "/dashboard/time", label: "Time", icon: "clock" },
  { href: "/dashboard/daily-reports", label: "Daily Reports", icon: "clipboard" },
  { href: "/dashboard/incidents", label: "Incidents", icon: "alert" },
  { href: "/dashboard/policies", label: "Policies", icon: "shield" },
  { href: "/dashboard/ppe", label: "PPE", icon: "hardhat" },
  { href: "/dashboard/notifications", label: "Notifications", icon: "bell" },
  { href: "/dashboard/audit-logs", label: "Audit Logs", icon: "list" },
  { href: "/dashboard/toolbox-talks", label: "Toolbox Talks", icon: "chat" },
  { href: "/dashboard/change-orders", label: "Change Orders", icon: "document" },
  { href: "/dashboard/uploads", label: "Uploads", icon: "upload" },
  { href: "/dashboard/settings", label: "Settings", icon: "gear" },
];

function getAdminNav(role?: AppRole) {
  if (role === "owner") {
    return [
      ...adminNav.slice(0, adminNav.length - 1),
      { href: "/dashboard/setup", label: "Setup", icon: "wand" },
      adminNav[adminNav.length - 1],
    ];
  }

  return adminNav;
}

const foremanNav = [
  { href: "/dashboard/foreman", label: "Foreman", icon: "home" },
  { href: "/dashboard/jobs", label: "Jobs", icon: "hammer" },
  { href: "/dashboard/time", label: "Time", icon: "clock" },
  { href: "/dashboard/daily-reports", label: "Daily Reports", icon: "clipboard" },
  { href: "/dashboard/incidents", label: "Incidents", icon: "alert" },
  { href: "/dashboard/policies", label: "Policies", icon: "shield" },
  { href: "/dashboard/ppe", label: "PPE", icon: "hardhat" },
  { href: "/dashboard/toolbox-talks", label: "Toolbox Talks", icon: "chat" },
  { href: "/dashboard/uploads", label: "Uploads", icon: "upload" },
  { href: "/dashboard/change-orders", label: "Change Orders", icon: "document" },
];

function NavIcon({ icon }: { icon: string }) {
  const common = "h-4 w-4";
  switch (icon) {
    case "users":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "briefcase":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v2"/><path d="M2 12h20"/></svg>;
    case "calculator":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8"/><path d="M8 11h2"/><path d="M14 11h2"/><path d="M8 15h2"/><path d="M14 15h2"/><path d="M8 19h8"/></svg>;
    case "clipboard":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 4H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"/><path d="M9 12h6"/><path d="M9 16h6"/></svg>;
    case "check":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><path d="M20 6 9 17l-5-5"/></svg>;
    case "hammer":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><path d="m14 12-8.5 8.5a2.1 2.1 0 0 1-3-3L11 9"/><path d="M15 5 19 9"/><path d="m8 6 8-3 3 3-3 8"/><path d="M12 8 4 16"/></svg>;
    case "clock":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></svg>;
    case "alert":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></svg>;
    case "shield":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>;
    case "hardhat":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><path d="M2 16a10 10 0 0 1 20 0"/><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/><path d="M12 6v4"/><path d="M8 8.5 6.5 12"/><path d="M16 8.5 17.5 12"/></svg>;
    case "bell":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><path d="M10.29 3.86A2 2 0 0 1 12 3a2 2 0 0 1 1.71.86"/><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>;
    case "list":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>;
    case "chat":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case "document":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h8"/><path d="M8 9h2"/></svg>;
    case "upload":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M20 16.5v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-2"/></svg>;
    case "gear":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 1-2 0 1.65 1.65 0 0 0-1-.6 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 1 0-2 1.65 1.65 0 0 0 .6-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 1 2 0 1.65 1.65 0 0 0 1 .6 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.24.32.41.69.49 1.08.2.98.2 1.94 0 2.92-.08.39-.25.76-.49 1.08Z"/></svg>;
    case "wand":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><path d="m15 4 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z"/><path d="m6 14 4 4"/><path d="m5 19 9-9"/></svg>;
    default:
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><path d="M3 12h18"/></svg>;
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
  const nav = role === "foreman" ? foremanNav : getAdminNav(role);
  const mobileQuickNav = nav.slice(0, 4);
  const mobileMoreNav = nav.slice(4);
  const showSettingsShortcut = role !== "foreman";

  return (
    <ToastProvider>
    <div className="min-h-screen bg-zinc-100">
      <header className="sticky top-0 z-30 border-b bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Concrete Ops AI</p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">{role === "foreman" ? "Foreman Portal" : "Admin Portal"}</p>
          </div>
          <SignOutButton className="rounded-xl border px-4 py-3 text-sm font-medium disabled:opacity-50" />
        </div>

        <div className={`mt-3 grid gap-2 ${showSettingsShortcut ? "grid-cols-2" : "grid-cols-1"}`}>
          <Link href="/employee" className="rounded-2xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-center text-sm font-medium text-zinc-800 transition hover:bg-zinc-100">
            Employee Portal
          </Link>
          {showSettingsShortcut ? (
            <Link href="/dashboard/settings" className="rounded-2xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-center text-sm font-medium text-zinc-800 transition hover:bg-zinc-100">
              Settings
            </Link>
          ) : null}
        </div>
      </header>

      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="hidden w-72 border-r bg-white px-6 py-7 lg:block">
          <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">Concrete Ops AI</p>
          <h1 className="mt-3 text-2xl font-semibold">{role === "foreman" ? "Foreman Portal" : "Admin Portal"}</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {role === "foreman"
              ? "Field-first access to jobs, time, reports, and safety workflows."
              : "Operations, compliance, and field visibility in one place."}
          </p>

          <nav className="mt-6 space-y-2">
            {nav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                    active ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-700 hover:bg-zinc-100",
                  )}
                >
                  <NavIcon icon={item.icon} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 space-y-2">
            <Link href="/employee" className="block rounded-2xl border px-4 py-3 text-sm font-medium hover:bg-zinc-100">
              Employee Portal
            </Link>
            <SignOutButton className="w-full rounded-2xl border px-4 py-3 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50" />
          </div>
        </aside>

        <main className="flex-1 px-4 pb-28 pt-4 md:px-6 md:pt-6 lg:p-8 lg:pb-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
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
                className={cn(
                  "rounded-xl border px-3 py-3 text-center text-xs font-medium transition",
                  active ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-zinc-50 text-zinc-800",
                )}
              >
                <span className="flex flex-col items-center gap-1">
                  <NavIcon icon={item.icon} />
                  <span>{item.label}</span>
                </span>
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
                className={cn(
                  "rounded-xl border px-3 py-3 text-center text-xs font-medium transition",
                  active ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-zinc-50 text-zinc-800",
                )}
              >
                <span className="flex flex-col items-center gap-1">
                  <NavIcon icon={item.icon} />
                  <span>{item.label}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
    </ToastProvider>
  );
}
