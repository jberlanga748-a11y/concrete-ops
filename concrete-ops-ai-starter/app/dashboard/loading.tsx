function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-blue-100 ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div>
      <section className="mb-5 border-b border-blue-100 bg-white px-5 py-5 sm:px-6 lg:px-8">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="mt-4 h-10 w-96 max-w-full" />
        <SkeletonBlock className="mt-4 h-5 w-[32rem] max-w-full" />
        <div className="mt-6 flex gap-3">
          <SkeletonBlock className="h-12 w-40" />
          <SkeletonBlock className="h-12 w-36" />
        </div>
      </section>

      <section className="grid gap-4 px-5 sm:px-6 lg:px-8 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-950/5">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="mt-4 h-10 w-20" />
            <SkeletonBlock className="mt-3 h-4 w-40" />
          </div>
        ))}
      </section>

      <section className="mx-5 mt-4 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-950/5 sm:mx-6 lg:mx-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="mt-3 h-7 w-52" />
          </div>
          <SkeletonBlock className="h-10 w-28" />
        </div>
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-16 w-full" />
          ))}
        </div>
      </section>
    </div>
  );
}
