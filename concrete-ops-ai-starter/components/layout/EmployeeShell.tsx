"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { cn } from "@/components/ui/cn";
import { AppIcon } from "@/components/ui/icons";

type NavItem = {
  href: string;
  label: string;
  icon: Parameters<typeof AppIcon>[0]["icon"];
};

const employeeSections = [
  {
    title: "My Work",
    items: [
      { href: "/employee", label: "Home", icon: "home" },
      { href: "/employee/time", label: "Time", icon: "clock" },
      { href: "/employee/uploads", label: "Uploads", icon: "upload" },
    ] as NavItem[],
  },
  {
    title: "Compliance",
    items: [
      { href: "/employee/policies", label: "Policies", icon: "shield" },
      { href: "/employee/ppe", label: "PPE", icon: "hardhat" },
    ] as NavItem[],
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
        active ? "bg-zinc-900 text-white shadow-[0_14px_32px_rgba(24,24,27,0.18)]" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
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
      {!collapsed ? <span>{item.label}</span> : null}
    </Link>
  );
}

export function EmployeeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const moreItems = employeeSections.flatMap((section) => section.items).filter((item) => !primaryMobileNav.some((primary) => primary.href === item.href));
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(24,24,27,0.08),_transparent_22%),linear-gradient(180deg,#f4f4f5_0%,#fafafa_100%)]">
        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Concrete Ops AI</p>
              <p className="mt-1 text-xl font-semibold text-zinc-950">Employee Portal</p>
            </div>
            <SignOutButton className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 disabled:opacity-50" />
          </div>
        </header>

        <div className="mx-auto flex min-h-screen w-full max-w-[1480px]">
          <aside
            className={cn(
              "hidden border-r border-zinc-200 bg-white/92 px-4 py-6 backdrop-blur lg:flex lg:flex-col",
              collapsed ? "w-24" : "w-[300px]",
            )}
          >
            <div className={cn("flex items-start justify-between gap-3", collapsed && "justify-center")}>
              {!collapsed ? (
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Concrete Ops AI</p>
                  <h1 className="mt-3 text-2xl font-semibold text-zinc-950">Employee Portal</h1>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-600">Personal time, uploads, and compliance tasks in a clean mobile-friendly workspace.</p>
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

            <div className="mt-8 flex-1 space-y-6">
              {employeeSections.map((section) => (
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

            <SignOutButton
              className={cn(
                "mt-6 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50",
                collapsed && "px-2",
              )}
            />
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
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Employee Portal</p>
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
      </div>
    </ToastProvider>
  );
}
