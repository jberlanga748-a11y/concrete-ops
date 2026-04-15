"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/jobs", label: "Jobs" },
  { href: "/dashboard/time", label: "Time" },
  { href: "/dashboard/daily-reports", label: "Daily Reports" },
  { href: "/dashboard/change-orders", label: "Change Orders" },
  { href: "/dashboard/uploads", label: "Uploads" },
  { href: "/dashboard/settings", label: "Settings" },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-zinc-100">
      <header className="sticky top-0 z-30 border-b bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Concrete Ops AI</p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">Admin Portal</p>
          </div>
          <SignOutButton className="rounded-xl border px-4 py-3 text-sm font-medium disabled:opacity-50" />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link href="/employee" className="rounded-2xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-center text-sm font-medium text-zinc-800">
            Employee Portal
          </Link>
          <Link href="/dashboard/settings" className="rounded-2xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-center text-sm font-medium text-zinc-800">
            Settings
          </Link>
        </div>

        <nav className="mt-3 -mx-1 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-2 px-1">
            {nav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
                    active ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-zinc-50 text-zinc-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="hidden w-72 border-r bg-white p-6 lg:block">
          <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">Concrete Ops AI</p>
          <h1 className="mt-3 text-2xl font-semibold">Admin Portal</h1>

          <nav className="mt-6 space-y-2">
            {nav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active ? "bg-zinc-900 text-white" : "hover:bg-zinc-100"
                  }`}
                >
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

        <main className="flex-1 px-4 py-4 md:px-6 md:py-6 lg:p-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-white p-3 shadow-[0_-10px_24px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="grid grid-cols-4 gap-2">
          {mobileQuickNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-3 text-center text-xs font-medium text-zinc-800"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {mobileMoreNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-3 text-center text-xs font-medium text-zinc-800"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
