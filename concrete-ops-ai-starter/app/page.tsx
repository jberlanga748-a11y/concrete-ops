import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen p-8 flex items-center justify-center">
      <div className="max-w-2xl rounded-3xl border bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">Concrete Ops</p>
        <h1 className="mt-3 text-4xl font-semibold">Run field and office work from one workspace</h1>
        <p className="mt-4 text-zinc-600">
          Concrete Ops brings together jobs, time, daily reports, change orders, uploads,
          compliance, customer follow-up, and employee workflows for concrete teams.
        </p>
        <p className="mt-3 text-sm text-zinc-500">Sign in to access the admin dashboard or employee portal.</p>
        <div className="mt-6 flex gap-3">
          <Link href="/login" className="rounded-2xl bg-zinc-900 px-5 py-3 text-white">Sign in</Link>
          <Link href="/dashboard" className="rounded-2xl border px-5 py-3">Dashboard</Link>
        </div>
      </div>
    </main>
  );
}
