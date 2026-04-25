function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-blue-100 ${className}`} />;
}

export function JobsWorkflowLoading({
  variant,
}: {
  variant: "board" | "form";
}) {
  if (variant === "form") {
    return (
      <div>
        <header className="mb-5 border-b border-blue-100 bg-white px-5 py-5 sm:px-6 lg:px-8">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="mt-3 h-8 w-64 max-w-full" />
          <SkeletonBlock className="mt-3 h-4 w-[32rem] max-w-full" />
        </header>

        <div className="grid gap-4 px-5 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
          <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-950/5">
            <SkeletonBlock className="h-5 w-36" />
            <SkeletonBlock className="mt-3 h-4 w-72 max-w-full" />
            <div className="mt-5 space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                  <SkeletonBlock className="h-4 w-32" />
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <SkeletonBlock className="h-10 w-full" />
                    <SkeletonBlock className="h-10 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-4">
            <SkeletonBlock className="h-72 w-full rounded-2xl" />
            <SkeletonBlock className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-5 border-b border-blue-100 bg-white px-5 py-5 sm:px-6 lg:px-8">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="mt-3 h-8 w-72 max-w-full" />
        <SkeletonBlock className="mt-3 h-4 w-[34rem] max-w-full" />
      </header>

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
        <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-950/5">
          <SkeletonBlock className="h-12 w-full" />
          <div className="mt-3 space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-14 w-full" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
