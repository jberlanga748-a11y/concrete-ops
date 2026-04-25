"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Clock3Icon, HardHatIcon, HomeIcon, ShieldCheckIcon, UploadIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ViewerCurrentDateLabel } from "@/components/time/ViewerCurrentDateLabel";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    title: "Daily Work",
    items: [
      { href: "/employee", label: "Home", icon: HomeIcon },
      { href: "/employee/time", label: "Time", icon: Clock3Icon },
      { href: "/employee/uploads", label: "Uploads", icon: UploadIcon },
    ],
  },
  {
    title: "Safety",
    items: [
      { href: "/employee/policies", label: "Policies", icon: ShieldCheckIcon },
      { href: "/employee/ppe", label: "PPE", icon: HardHatIcon },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/employee") return pathname === "/employee";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function EmployeeShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const navEntries = sections.flatMap((section) =>
    section.items.map((item) => ({
      ...item,
      sectionTitle: section.title,
    }))
  );
  const activeEntry = navEntries.find((entry) => isActive(pathname, entry.href));
  const activeTitle = activeEntry?.label ?? "Employee Portal";
  const activeSection = activeEntry?.sectionTitle ?? "Daily Work";

  return (
    <div className="min-h-screen bg-[#f8fbff] text-slate-950">
      <div className="lg:flex">
        <aside className="hidden h-screen w-64 shrink-0 border-r border-blue-100 bg-white lg:sticky lg:top-0 lg:flex lg:flex-col">
          <div className="flex h-16 items-center gap-3 border-b border-blue-100 px-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-sm font-black text-white">CO</div>
            <div className="min-w-0">
              <p className="text-sm font-black leading-none text-slate-950">Concrete Ops</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Employee</p>
            </div>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto p-3">
            {sections.map((section) => (
              <section key={section.title} className="mb-4 last:mb-0">
                <p className="mb-1 px-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{section.title}</p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex h-10 w-full items-center gap-2.5 rounded-xl px-2.5 text-sm font-bold transition",
                          active ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </nav>

          <div className="border-t border-blue-100 p-3">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">Today</p>
                  <p className="mt-1 text-sm font-black text-slate-950">
                    <ViewerCurrentDateLabel monthStyle="short" />
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-blue-700 ring-1 ring-blue-100">
                  Ready
                </span>
              </div>
              <SignOutButton className="mt-3 w-full rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-700 ring-1 ring-blue-100 hover:bg-blue-50 disabled:opacity-50" />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-20 lg:pb-0">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-blue-100 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-700">Employee Portal</p>
              <p className="truncate text-sm font-black text-slate-950">{activeTitle}</p>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 ring-1 ring-blue-100">{activeSection}</span>
              <Link href="/dashboard" className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-blue-50">
                Office
              </Link>
              <SignOutButton className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-blue-50 disabled:opacity-50" />
            </div>
            <select
              value={activeEntry?.href ?? "/employee"}
              onChange={(event) => {
                window.location.href = event.target.value;
              }}
              className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-black text-blue-700 md:hidden"
              aria-label="Switch employee module"
            >
              {navEntries.map((entry) => (
                <option key={entry.href} value={entry.href}>
                  {entry.label}
                </option>
              ))}
            </select>
          </header>

          <main className="min-w-0">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-blue-100 bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {navEntries.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("rounded-xl px-1.5 py-2 text-center text-[11px] font-black", active ? "bg-blue-700 text-white" : "text-slate-500")}
              >
                <Icon className="mx-auto h-4 w-4" aria-hidden="true" />
                <span className="mt-1 block truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
