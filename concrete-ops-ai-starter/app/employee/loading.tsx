function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-zinc-200/80 ${className}`} />;
}

export default function EmployeeLoading() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
        <SkeletonBlock className="h-4 w-28" />
        <SkeletonBlock className="mt-4 h-10 w-80 max-w-full" />
        <SkeletonBlock className="mt-4 h-5 w-[28rem] max-w-full" />
        <div className="mt-6 flex gap-3">
          <SkeletonBlock className="h-12 w-40" />
          <SkeletonBlock className="h-12 w-36" />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="mt-4 h-10 w-24" />
            <SkeletonBlock className="mt-3 h-4 w-36" />
          </div>
        ))}
      </section>

      <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="mt-3 h-7 w-44" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-20 w-full" />
          ))}
        </div>
      </section>
    </div>
  );
}
