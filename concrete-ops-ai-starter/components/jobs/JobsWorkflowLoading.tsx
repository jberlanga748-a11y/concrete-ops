function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-zinc-200/80 ${className}`} />;
}

export function JobsWorkflowLoading({
  variant,
}: {
  variant: "board" | "form";
}) {
  if (variant === "form") {
    return (
      <div className="space-y-6 lg:space-y-8">
        <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_20px_48px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="grid gap-6 xl:grid-cols-[1.35fr,0.95fr]">
            <div>
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="mt-4 h-4 w-32" />
              <SkeletonBlock className="mt-4 h-12 w-[34rem] max-w-full" />
              <SkeletonBlock className="mt-4 h-5 w-[28rem] max-w-full" />
            </div>
            <div className="rounded-[28px] border border-zinc-200 bg-zinc-950/95 p-5">
              <SkeletonBlock className="h-4 w-28 bg-zinc-700" />
              <div className="mt-5 space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <SkeletonBlock key={index} className="h-24 w-full bg-zinc-800" />
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),320px]">
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <section key={index} className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="mt-3 h-8 w-64 max-w-full" />
                <SkeletonBlock className="mt-3 h-4 w-[26rem] max-w-full" />
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <SkeletonBlock className="h-24 w-full" />
                  <SkeletonBlock className="h-24 w-full" />
                </div>
              </section>
            ))}
          </div>

          <div className="space-y-4">
            <SkeletonBlock className="h-80 w-full rounded-[28px]" />
            <SkeletonBlock className="h-64 w-full rounded-[28px]" />
          </div>
        </div>

        <section className="rounded-[28px] border border-zinc-200 bg-white px-6 py-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <SkeletonBlock className="h-5 w-[30rem] max-w-full" />
            <SkeletonBlock className="h-12 w-32" />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_20px_48px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.4fr,0.95fr]">
          <div>
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="mt-4 h-14 w-[40rem] max-w-full" />
            <SkeletonBlock className="mt-4 h-5 w-[32rem] max-w-full" />
            <div className="mt-6 flex gap-3">
              <SkeletonBlock className="h-12 w-32" />
              <SkeletonBlock className="h-12 w-32" />
            </div>
          </div>
          <div className="rounded-[28px] border border-zinc-200 bg-zinc-950/95 p-5">
            <SkeletonBlock className="h-4 w-32 bg-zinc-700" />
            <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonBlock key={index} className="h-28 w-full bg-zinc-800" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <SkeletonBlock className="h-6 w-40" />
            <SkeletonBlock className="mt-3 h-4 w-[28rem] max-w-full" />
          </div>
          <SkeletonBlock className="h-10 w-32" />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-20 w-full" />
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        <div className="grid gap-3">
          <SkeletonBlock className="h-14 w-full" />
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-24 w-full" />
          ))}
        </div>
      </section>
    </div>
  );
}
