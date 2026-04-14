import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";

const nav = [
  { href: "/employee", label: "Home" },
  { href: "/employee/time", label: "Time" },
  { href: "/employee/uploads", label: "Uploads" },
];

export function EmployeeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-100">
      <header className="border-b bg-white p-4 lg:hidden">
        <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">Concrete Ops AI</p>
        <p className="mt-1 text-lg font-semibold">Employee Portal</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-xl border px-3 py-2 text-sm">
              {item.label}
            </Link>
          ))}
          <SignOutButton className="rounded-xl border px-3 py-2 text-sm disabled:opacity-50" />
        </div>
      </header>

      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r bg-white p-6 lg:block">
          <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">Concrete Ops AI</p>
          <h1 className="mt-3 text-2xl font-semibold">Employee Portal</h1>
          <nav className="mt-6 space-y-2">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="block rounded-2xl px-4 py-3 text-sm font-medium hover:bg-zinc-100">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6">
            <SignOutButton className="w-full rounded-2xl border px-4 py-3 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50" />
          </div>
        </aside>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
