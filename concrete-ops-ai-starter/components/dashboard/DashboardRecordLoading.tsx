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

export function DashboardRecordLoading({
  variant,
}: {
  variant: "detail" | "form";
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
          <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-950/5">
            <div className="grid gap-3 md:grid-cols-2">
              <SkeletonBlock className="h-10 w-full" />
              <SkeletonBlock className="h-10 w-full" />
            </div>
            <SkeletonBlock className="mt-4 h-28 w-full" />
            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <SkeletonBlock className="h-5 w-[28rem] max-w-full" />
              <SkeletonBlock className="h-10 w-40" />
            </div>
          </section>
        </div>
      </div>
    );
  }

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
          <SkeletonBlock className="h-72 w-full rounded-2xl" />
        </div>
        <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-950/5">
          <SkeletonBlock className="h-5 w-40" />
          <div className="mt-4 grid gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-20 w-full" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
