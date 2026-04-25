function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-blue-100 ${className}`} />;
}

export function EmployeeWorkflowLoading({
  titleWidth = "w-52",
  cardCount = 2,
}: {
  titleWidth?: string;
  cardCount?: number;
}) {
  return (
    <div>
      <section className="mb-5 border-b border-blue-100 bg-white px-5 py-5 sm:px-6 lg:px-8">
        <SkeletonBlock className="h-4 w-28" />
        <SkeletonBlock className={`mt-4 h-10 max-w-full ${titleWidth}`} />
        <SkeletonBlock className="mt-4 h-5 w-[30rem] max-w-full" />
      </section>

      <section className="grid gap-4 px-5 sm:px-6 lg:px-8">
        {Array.from({ length: cardCount }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-950/5">
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
