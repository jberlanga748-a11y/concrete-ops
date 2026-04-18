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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(201,106,44,0.12),_transparent_20%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.08),_transparent_22%),linear-gradient(180deg,#eef2f4_0%,#f7f8f6_55%,#fbfbfa_100%)] text-zinc-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[1680px] gap-4 px-3 pb-28 pt-3 sm:px-4 lg:gap-6 lg:px-6 lg:pb-6 lg:pt-6">
        <aside className="hidden w-[320px] shrink-0 lg:block">
          <div className="sticky top-6 overflow-hidden rounded-[32px] border border-[#18232d] bg-[#0c141c] text-zinc-100 shadow-[0_32px_70px_rgba(15,23,42,0.24)]">
            <div className="border-b border-white/10 p-5">
              <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(155deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))] p-5">
                <p className="font-app-mono text-[11px] uppercase tracking-[0.24em] text-zinc-400">Field Workspace</p>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-[1.7rem] font-semibold tracking-[-0.05em] text-white">Concrete Ops</h1>
                    <p className="mt-2 max-w-[17rem] text-sm leading-6 text-zinc-300">
                      A calmer home base for the shift, your uploads, and required safety follow-through.
                    </p>
                  </div>
                  <Badge className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                    Employee Portal
                  </Badge>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-[22px] border border-white/10 bg-black/10 p-3">
                    <p className="font-app-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">Sections</p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">{sections.length}</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-black/10 p-3">
                    <p className="font-app-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">Modules</p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">{navEntries.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-5">
              {sections.map((section) => (
                <section key={section.title} className="mb-6 last:mb-0">
                  <div className="mb-3 px-1">
                    <p className="font-app-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">{section.title}</p>
                    <p className="mt-2 text-xs leading-5 text-zinc-400">{section.summary}</p>
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
                    <p className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">Today</p>
                    <p className="mt-2 text-base font-semibold text-white">
                      <ViewerCurrentDateLabel monthStyle="short" />
                    </p>
                  </div>
                  <Badge variant="outline" className="rounded-full border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-300">
                    Shift Ready
                  </Badge>
                </div>

                <p className="mt-3 text-sm leading-6 text-zinc-300">
                  Keep the essentials close: time entry, field proof, and required safety follow-up all live in one steady workspace.
                </p>

                <SignOutButton className="mt-4 w-full rounded-[20px] border border-white/12 bg-white/[0.02] px-4 py-3 text-sm font-medium text-zinc-100 transition hover:bg-white/[0.08] disabled:opacity-50" />
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4 lg:gap-6">
          <header className="rounded-[30px] border border-[#18232d] bg-[#0c141c] px-4 py-4 text-zinc-100 shadow-[0_24px_50px_rgba(15,23,42,0.18)] lg:hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-app-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Concrete Ops</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.04em] text-white">{activeTitle}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {activeSection}
                  <ViewerCurrentDateLabel monthStyle="short" prefix=" · " />
                </p>
              </div>
              <SignOutButton className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-100 transition hover:bg-white/10 disabled:opacity-50" />
            </div>
          </header>

          <section className="hidden rounded-[32px] border border-white/80 bg-white/78 px-6 py-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur lg:block">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <p className="font-app-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">{activeSection}</p>
                <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.055em] text-[#101828]">{activeTitle}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5b6574]">
                  A more polished employee workspace for time, uploads, and safety follow-through without changing how the underlying tools work.
                </p>
              </div>

              <div className="rounded-[24px] border border-zinc-200/80 bg-white/80 px-4 py-3 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
                <p className="font-app-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">Today</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  <ViewerCurrentDateLabel monthStyle="short" />
                </p>
              </div>
            </div>
          </section>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/70 bg-[rgba(247,248,249,0.92)] px-3 py-3 shadow-[0_-18px_40px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-2">
          {navEntries.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-[20px] border px-2 py-3 text-center transition ${
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
