"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { cn } from "@/components/ui/cn";
import { AppIcon, ConcreteTruckIcon } from "@/components/ui/icons";
import { appBackgroundClassName, brandPanelClassName } from "@/components/ui/primitives";

type NavItem = {
  href: string;
  label: string;
  icon: Parameters<typeof AppIcon>[0]["icon"];
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const employeeSections: NavSection[] = [
  {
    title: "Field Ops",
    items: [
      { href: "/employee", label: "Home", icon: "home" },
      { href: "/employee/time", label: "Time", icon: "clock" },
      { href: "/employee/uploads", label: "Uploads", icon: "upload" },
    ],
  },
  {
    title: "Compliance",
    items: [
      { href: "/employee/policies", label: "Policies", icon: "shield" },
      { href: "/employee/ppe", label: "PPE", icon: "hardhat" },
    ],
  },
];

const primaryMobileNav: NavItem[] = [
  { href: "/employee", label: "Home", icon: "home" },
  { href: "/employee/time", label: "Time", icon: "clock" },
  { href: "/employee/uploads", label: "Uploads", icon: "upload" },
  { href: "/employee/policies", label: "Policies", icon: "shield" },
];

function isActive(pathname: string, href: string) {
  if (href === "/employee") return pathname === "/employee";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition",
        active
          ? "bg-zinc-950 text-white shadow-[0_18px_36px_rgba(24,24,27,0.22)]"
          : "text-zinc-600 hover:bg-orange-50 hover:text-zinc-950",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border transition",
          active
            ? "border-white/10 bg-white/10 text-orange-300"
            : "border-zinc-200 bg-white text-zinc-600 group-hover:border-orange-200 group-hover:bg-orange-50 group-hover:text-orange-600",
        )}
      >
        <AppIcon icon={item.icon} className="h-4 w-4" />
      </span>
      <span>{item.label}</span>
    </Link>
  );
}

function DesktopSection({
  section,
  pathname,
  expanded,
  onToggle,
}: {
  section: NavSection;
  pathname: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <section className="rounded-[24px] border border-zinc-200/80 bg-white/75 p-3">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between rounded-2xl px-2 py-2 text-left">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">{section.title}</span>
        <AppIcon icon={expanded ? "chevron-left" : "chevron-right"} className={cn("h-4 w-4 text-zinc-400", expanded && "rotate-90")} />
      </button>
      {expanded ? (
        <div className="mt-2 space-y-2">
          {section.items.map((item) => (
            <SidebarLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function EmployeeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreSections = employeeSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !primaryMobileNav.some((primary) => primary.href === item.href)),
    }))
    .filter((section) => section.items.length > 0);
  const activeSectionTitle = useMemo(() => {
    return employeeSections.find((section) => section.items.some((item) => isActive(pathname, item.href)))?.title ?? employeeSections[0]?.title;
  }, [pathname]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(employeeSections.map((section) => [section.title, section.title === "Field Ops" || section.title === activeSectionTitle])),
  );

  useEffect(() => {
    if (!activeSectionTitle) return;
    setExpandedSections((current) => ({
      ...current,
      [activeSectionTitle]: true,
    }));
  }, [activeSectionTitle]);

  return (
    <ToastProvider>
      <div className={cn("min-h-screen", appBackgroundClassName)}>
        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-orange-400 shadow-sm">
                <ConcreteTruckIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Concrete Ops AI</p>
                <p className="mt-1 text-xl font-semibold text-zinc-950">Employee Portal</p>
              </div>
            </div>
            <SignOutButton className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 disabled:opacity-50" />
          </div>
        </header>

        <div className="mx-auto flex min-h-screen w-full max-w-[1480px]">
          <aside className={cn("hidden w-[320px] border-r border-zinc-200/80 px-5 py-6 backdrop-blur lg:flex lg:flex-col", brandPanelClassName)}>
            <div className="rounded-[28px] border border-zinc-200/80 bg-white/85 p-5 shadow-[0_16px_34px_rgba(24,24,27,0.08)]">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-zinc-950 text-orange-400 shadow-[0_12px_24px_rgba(24,24,27,0.18)]">
                  <ConcreteTruckIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Concrete Ops AI</p>
                  <h1 className="mt-1 text-2xl font-semibold text-zinc-950">Employee Portal</h1>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-zinc-600">
                Personal time, uploads, and compliance tasks in a cleaner desktop workspace.
              </p>
            </div>

            <div className="mt-6 flex-1 space-y-3">
              {employeeSections.map((section) => (
                <DesktopSection
                  key={section.title}
                  section={section}
                  pathname={pathname}
                  expanded={Boolean(expandedSections[section.title])}
                  onToggle={() =>
                    setExpandedSections((current) => ({
                      ...current,
                      [section.title]: !current[section.title],
                    }))
                  }
                />
              ))}
            </div>

            <SignOutButton className="mt-6 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50" />
          </aside>

          <main className="flex-1 px-4 pb-28 pt-4 md:px-6 md:pt-6 lg:p-8 lg:pb-10">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-3 backdrop-blur lg:hidden">
          <div className="mx-auto grid max-w-xl grid-cols-5 gap-2">
            {primaryMobileNav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-2xl px-2 py-2 text-center text-[11px] font-medium transition",
                    active ? "bg-zinc-950 text-white shadow-sm" : "bg-zinc-100 text-zinc-700",
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
                moreSections.some((section) => section.items.some((item) => isActive(pathname, item.href)))
                  ? "bg-zinc-950 text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-700",
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
                  <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-zinc-500">
                    <ConcreteTruckIcon className="h-4 w-4 text-orange-500" />
                    <span>Employee Portal</span>
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-zinc-950">More</h2>
                </div>
                <button type="button" onClick={() => setIsMoreOpen(false)} className="rounded-2xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700">
                  Close
                </button>
              </div>
              <div className="mt-5 space-y-5">
                {moreSections.map((section) => (
                  <div key={section.title}>
                    <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-zinc-400">{section.title}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {section.items.map((item) => {
                        const active = isActive(pathname, item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMoreOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-2xl border px-4 py-4 text-sm font-medium transition",
                              active
                                ? "border-zinc-900 bg-zinc-900 text-white"
                                : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700",
                            )}
                          >
                            <AppIcon icon={item.icon} className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </ToastProvider>
  );
}
