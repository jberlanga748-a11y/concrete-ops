"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";

type IconName = "home" | "clock" | "shield" | "hardhat" | "upload";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    title: "Work",
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

const mobileNav = sections.flatMap((section) => section.items);

function isActive(pathname: string, href: string) {
  if (href === "/employee") return pathname === "/employee";
  return pathname === href || pathname.startsWith(`${href}/`);
}

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
    case "clock":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6l4 2" />
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
    case "upload":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path d="M12 16V4" />
          <path d="m7 9 5-5 5 5" />
          <path d="M20 16.5v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-2" />
        </svg>
      );
    case "home":
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

export function EmployeeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-zinc-100">
      <header className="sticky top-0 z-30 border-b bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Concrete Ops AI</p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">Employee Portal</p>
          </div>
          <SignOutButton className="rounded-xl border px-4 py-3 text-sm font-medium disabled:opacity-50" />
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
                <p className="mt-2 text-sm font-medium text-zinc-200">Employee Portal</p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-zinc-400">
              Stay on top of time, uploads, and compliance tasks from one clean workspace.
            </p>
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
            <p className="text-sm font-medium text-zinc-100">Shift-ready workspace</p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Keep your day moving with quick access to time entry, uploads, and required safety items.
            </p>
            <SignOutButton className="mt-4 w-full rounded-2xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800 disabled:opacity-50" />
          </div>
        </aside>

        <main className="flex-1 px-4 pb-24 pt-4 md:px-6 md:pt-6 lg:bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.08),_transparent_20%),linear-gradient(180deg,#f4f4f5_0%,#fafafa_100%)] lg:p-8 lg:pb-8">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-white p-3 shadow-[0_-10px_24px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="grid grid-cols-5 gap-2">
          {mobileNav.map((item) => {
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
