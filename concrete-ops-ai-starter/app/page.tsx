import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-md rounded-3xl border bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">Concrete Ops Starter</h1>
        <p className="mt-2 text-sm text-zinc-600">Field operations platform for concrete contractors.</p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/employee"
            className="rounded-xl bg-orange-600 px-4 py-3 text-sm font-medium text-white hover:bg-orange-700"
          >
            Employee Portal
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border px-4 py-3 text-sm font-medium hover:bg-zinc-100"
          >
            Admin Dashboard
          </Link>
          <Link
            href="/login"
            className="text-sm text-zinc-500 hover:underline"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
