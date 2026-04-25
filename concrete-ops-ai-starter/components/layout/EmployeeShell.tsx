"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ViewerCurrentDateLabel } from "@/components/time/ViewerCurrentDateLabel";
import { Badge } from "@/components/ui/badge";

type IconName = "home" | "clock" | "shield" | "hardhat" | "upload";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
};

type NavSection = {
  title: string;
  summary: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    title: "Daily Work",
    summary: "Clock time, capture proof, and stay oriented without extra taps.",
    items: [
      { href: "/employee", label: "Home", icon: "home" },
      { href: "/employee/time", label: "Time", icon: "clock" },
      { href: "/employee/uploads", label: "Uploads", icon: "upload" },
    ],
  },
  {
    title: "Safety",
    summary: "Keep required policy and gear information close to the same workspace.",
    items: [
      { href: "/employee/policies", label: "Policies", icon: "shield" },
      { href: "/employee/ppe", label: "PPE", icon: "hardhat" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/employee") return pathname === "/employee";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavIcon({ icon, className = "h-4 w-4" }: { icon: IconName; className?: string }) {
  const sharedProps = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    className,
    width: 16,
    height: 16,
    "aria-hidden": true,
    focusable: false,
    style: { flexShrink: 0 },
  } as const;

  switch (icon) {
    case "clock":
      return (
        <svg viewBox="0 0 24 24" {...sharedProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6l4 2" />
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
    case "upload":
      return (
        <svg viewBox="0 0 24 24" {...sharedProps}>
          <path d="M12 16V4" />
          <path d="m7 9 5-5 5 5" />
          <path d="M20 16.5v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-2" />
        </svg>
      );
    case "home":
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
  const activeSection = activeEntry?.sectionTitle ?? "Overview";

  return (
    <div className="min-h-screen bg-[#f8fbff] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[1800px] gap-4 px-3 pb-28 pt-3 sm:px-4 lg:gap-6 lg:px-6 lg:pb-6 lg:pt-6">
        <aside className="hidden w-[320px] shrink-0 lg:block">
          <div className="sticky top-6 overflow-hidden rounded-[2rem] border border-blue-100 bg-white text-slate-950 shadow-sm shadow-blue-950/5">
            <div className="border-b border-blue-100 p-5">
              <div className="rounded-3xl bg-blue-950 p-5 text-white shadow-xl shadow-blue-950/20">
                <p className="font-app-mono text-[11px] uppercase tracking-[0.24em] text-blue-200">Field Workspace</p>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-[1.7rem] font-black tracking-[-0.03em] text-white">Concrete Ops</h1>
                    <p className="mt-2 max-w-[17rem] text-sm font-medium leading-6 text-blue-100">
                      A calmer home base for the shift, your uploads, and required safety follow-through.
                    </p>
                  </div>
                  <Badge className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white">
                    Employee Portal
                  </Badge>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-[22px] border border-white/10 bg-white/10 p-3">
                    <p className="font-app-mono text-[10px] uppercase tracking-[0.22em] text-blue-200">Sections</p>
                    <p className="mt-2 text-2xl font-black tracking-[-0.03em] text-white">{sections.length}</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/10 p-3">
                    <p className="font-app-mono text-[10px] uppercase tracking-[0.22em] text-blue-200">Modules</p>
                    <p className="mt-2 text-2xl font-black tracking-[-0.03em] text-white">{navEntries.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-5">
              {sections.map((section) => (
                <section key={section.title} className="mb-6 last:mb-0">
                  <div className="mb-3 px-1">
                    <p className="font-app-mono text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">{section.title}</p>
                    <p className="mt-2 text-xs font-medium leading-5 text-slate-500">{section.summary}</p>
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
                              ? "border-blue-700 bg-blue-700 text-white shadow-lg shadow-blue-700/20"
                              : "border-blue-100 bg-blue-50/70 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          }`}
                        >
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                                active
                                  ? "border-white/20 bg-white/10 text-white"
                                  : "border-blue-100 bg-white text-blue-700 group-hover:border-blue-200 group-hover:text-blue-800"
                            }`}
                          >
                            <NavIcon icon={item.icon} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold">{item.label}</span>
                            <span className={`mt-1 block text-xs ${active ? "text-blue-100/90" : "text-slate-500 group-hover:text-blue-700"}`}>
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

            <div className="border-t border-blue-100 p-5">
              <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-blue-700">Today</p>
                    <p className="mt-2 text-base font-black text-slate-950">
                      <ViewerCurrentDateLabel monthStyle="short" />
                    </p>
                  </div>
                  <Badge variant="outline" className="rounded-full border-blue-100 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">
                    Shift Ready
                  </Badge>
                </div>

                <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
                  Keep the essentials close: time entry, field proof, and required safety follow-up all live in one steady workspace.
                </p>

                <SignOutButton className="mt-4 w-full rounded-full border border-blue-100 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-blue-50 disabled:opacity-50" />
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4 lg:gap-6">
          <header className="rounded-[30px] border border-blue-100 bg-white px-4 py-4 text-slate-950 shadow-sm shadow-blue-950/5 lg:hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-app-mono text-[11px] font-black uppercase tracking-[0.24em] text-blue-700">Concrete Ops</p>
                <p className="mt-2 text-lg font-black tracking-[-0.03em] text-slate-950">{activeTitle}</p>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {activeSection}
                  <ViewerCurrentDateLabel monthStyle="short" prefix=" · " />
                </p>
              </div>
              <SignOutButton className="rounded-full border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-blue-100 disabled:opacity-50" />
            </div>
          </header>

          <section className="hidden rounded-[2rem] border border-blue-100 bg-white px-6 py-5 shadow-sm shadow-blue-950/5 backdrop-blur lg:block">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <p className="font-app-mono text-[11px] font-black uppercase tracking-[0.24em] text-blue-700">{activeSection}</p>
                <h2 className="mt-3 text-[2rem] font-black tracking-[-0.04em] text-slate-950">{activeTitle}</h2>
                <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600">
                  A more polished employee workspace for time, uploads, and safety follow-through without changing how the underlying tools work.
                </p>
              </div>

              <div className="rounded-3xl border border-blue-100 bg-blue-50/70 px-4 py-3">
                <p className="font-app-mono text-[11px] uppercase tracking-[0.18em] text-blue-700">Today</p>
                <p className="mt-1 text-sm font-black text-slate-950">
                  <ViewerCurrentDateLabel monthStyle="short" />
                </p>
              </div>
            </div>
          </section>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-blue-100 bg-white/95 px-3 py-3 shadow-[0_-18px_40px_rgba(30,64,175,0.12)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-2">
          {navEntries.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-[20px] border px-2 py-3 text-center transition ${
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
