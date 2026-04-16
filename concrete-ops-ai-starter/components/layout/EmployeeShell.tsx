"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { cn } from "@/components/ui/cn";

const nav = [
  { href: "/employee", label: "Home", icon: "home" },
  { href: "/employee/time", label: "Time", icon: "clock" },
  { href: "/employee/policies", label: "Policies", icon: "shield" },
  { href: "/employee/ppe", label: "PPE", icon: "hardhat" },
  { href: "/employee/uploads", label: "Uploads", icon: "upload" },
];

function isActive(pathname: string, href: string) {
  if (href === "/employee") return pathname === "/employee";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavIcon({ icon }: { icon: string }) {
  const common = "h-4 w-4";
  switch (icon) {
    case "clock":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></svg>;
    case "shield":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>;
    case "hardhat":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><path d="M2 16a10 10 0 0 1 20 0"/><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/><path d="M12 6v4"/><path d="M8 8.5 6.5 12"/><path d="M16 8.5 17.5 12"/></svg>;
    case "upload":
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M20 16.5v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-2"/></svg>;
    default:
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}><path d="M3 12h18"/><path d="M12 3v18"/></svg>;
  }
}

export function EmployeeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ToastProvider>
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

      <div className="mx-auto flex min-h-screen w-full max-w-[1400px]">
        <aside className="hidden w-72 border-r bg-white px-6 py-7 lg:block">
          <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">Concrete Ops AI</p>
          <h1 className="mt-3 text-2xl font-semibold">Employee Portal</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">Personal time, compliance, PPE, and uploads in one place.</p>

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

          <div className="mt-6">
            <SignOutButton className="w-full rounded-2xl border px-4 py-3 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50" />
          </div>
        </aside>

        <main className="flex-1 px-4 pb-24 pt-4 md:px-6 md:pt-6 lg:p-8 lg:pb-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-white p-3 shadow-[0_-10px_24px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="grid grid-cols-5 gap-2">
          {nav.map((item) => {
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
