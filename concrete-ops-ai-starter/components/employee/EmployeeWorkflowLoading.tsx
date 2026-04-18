function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-zinc-200/80 ${className}`} />;
}

export function EmployeeWorkflowLoading({
  titleWidth = "w-52",
  cardCount = 2,
}: {
  titleWidth?: string;
  cardCount?: number;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
        <SkeletonBlock className="h-4 w-28" />
        <SkeletonBlock className={`mt-4 h-10 max-w-full ${titleWidth}`} />
        <SkeletonBlock className="mt-4 h-5 w-[30rem] max-w-full" />
      </section>

      <section className="grid gap-4">
        {Array.from({ length: cardCount }).map((_, index) => (
          <div key={index} className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
            <SkeletonBlock className="h-5 w-40" />
            <SkeletonBlock className="mt-4 h-4 w-full" />
            <SkeletonBlock className="mt-3 h-4 w-4/5" />
            <SkeletonBlock className="mt-6 h-11 w-40" />
          </div>
        ))}
      </section>
    </div>
  );
}
