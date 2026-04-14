import Link from "next/link";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/jobs", label: "Jobs" },
  { href: "/dashboard/time", label: "Time" },
  { href: "/dashboard/daily-reports", label: "Daily Reports" },
  { href: "/dashboard/change-orders", label: "Change Orders" },
  { href: "/dashboard/uploads", label: "Uploads" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r bg-white p-6 lg:block">
          <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">Concrete Ops AI</p>
          <h1 className="mt-3 text-2xl font-semibold">Admin</h1>
          <nav className="mt-6 space-y-2">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="block rounded-2xl px-4 py-3 text-sm font-medium hover:bg-zinc-100">
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
