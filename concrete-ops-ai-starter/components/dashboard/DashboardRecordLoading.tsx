function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-zinc-200/80 ${className}`} />;
}

export function DashboardRecordLoading({
  variant,
}: {
  variant: "detail" | "form";
}) {
  if (variant === "form") {
    return (
      <div className="space-y-6 lg:space-y-8">
        <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_20px_48px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="grid gap-6 xl:grid-cols-[1.35fr,0.95fr] xl:items-start">
            <div>
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="mt-4 h-4 w-36" />
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

        <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <SkeletonBlock className="h-20 w-full" />
              <SkeletonBlock className="h-20 w-full" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonBlock key={index} className="h-20 w-full" />
              ))}
            </div>

            <SkeletonBlock className="h-36 w-full" />
            <SkeletonBlock className="h-28 w-full" />

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <SkeletonBlock className="h-5 w-[28rem] max-w-full" />
              <SkeletonBlock className="h-12 w-40" />
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="rounded-[32px] border border-zinc-900 bg-zinc-950 p-6 shadow-[0_30px_90px_rgba(24,24,27,0.28)] sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <SkeletonBlock className="h-4 w-32 bg-zinc-800" />
            <SkeletonBlock className="mt-4 h-12 w-[26rem] max-w-full bg-zinc-800" />
            <SkeletonBlock className="mt-4 h-5 w-[30rem] max-w-full bg-zinc-800" />
          </div>

          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-12 w-32 bg-zinc-800" />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <section key={index} className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="mt-4 h-7 w-40" />
            <SkeletonBlock className="mt-3 h-4 w-44" />
          </section>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <SkeletonBlock className="h-72 w-full rounded-[28px]" />
        <SkeletonBlock className="h-72 w-full rounded-[28px]" />
      </section>

      <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        <SkeletonBlock className="h-5 w-40" />
        <div className="mt-5 grid gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-24 w-full" />
          ))}
        </div>
      </section>
    </div>
  );
}
