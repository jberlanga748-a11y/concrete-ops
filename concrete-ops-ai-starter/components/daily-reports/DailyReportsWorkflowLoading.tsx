function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-blue-100 ${className}`} />;
}

function LoadingHeader() {
  return (
    <header className="mb-5 border-b border-blue-100 bg-white px-5 py-5 sm:px-6 lg:px-8">
      <SkeletonBlock className="h-3 w-28" />
      <SkeletonBlock className="mt-3 h-8 w-72 max-w-full" />
      <SkeletonBlock className="mt-3 h-4 w-[34rem] max-w-full" />
    </header>
  );
}

export function DailyReportsWorkflowLoading({
  variant,
}: {
  variant: "board" | "form" | "detail";
}) {
  if (variant === "form") {
    return (
      <div>
        <LoadingHeader />
        <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <section key={index} className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-950/5">
                  <SkeletonBlock className="h-4 w-28" />
                  <SkeletonBlock className="mt-3 h-6 w-64 max-w-full" />
                  <SkeletonBlock className="mt-3 h-4 w-[28rem] max-w-full" />
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <SkeletonBlock className="h-10 w-full" />
                    <SkeletonBlock className="h-10 w-full" />
                  </div>
                </section>
              ))}
            </div>
            <div className="space-y-4">
              <SkeletonBlock className="h-72 w-full rounded-2xl" />
              <SkeletonBlock className="h-56 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div>
        <LoadingHeader />
        <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <SkeletonBlock className="h-72 w-full rounded-2xl" />
            <div className="space-y-4">
              <SkeletonBlock className="h-64 w-full rounded-2xl" />
              <SkeletonBlock className="h-56 w-full rounded-2xl" />
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-44 w-full rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <SkeletonBlock className="h-96 w-full rounded-2xl" />
            <SkeletonBlock className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <LoadingHeader />
      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-950/5">
          <SkeletonBlock className="h-10 w-full" />
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
