"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";

const nav = [
  { href: "/employee", label: "Home" },
  { href: "/employee/time", label: "Time" },
  { href: "/employee/uploads", label: "Uploads" },
];

function isActive(pathname: string, href: string) {
  if (href === "/employee") return pathname === "/employee";
  return pathname === href || pathname.startsWith(`${href}/`);
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

      <div className="mx-auto flex min-h-screen w-full max-w-[1400px]">
        <aside className="hidden w-72 border-r bg-white p-6 lg:block">
          <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">Concrete Ops AI</p>
          <h1 className="mt-3 text-2xl font-semibold">Employee Portal</h1>

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

          <div className="mt-6">
            <SignOutButton className="w-full rounded-2xl border px-4 py-3 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50" />
          </div>
        </aside>

        <main className="flex-1 px-4 pb-24 pt-4 md:px-6 md:pt-6 lg:p-8 lg:pb-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-white p-3 shadow-[0_-10px_24px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="grid grid-cols-3 gap-2">
          {nav.map((item) => {
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
