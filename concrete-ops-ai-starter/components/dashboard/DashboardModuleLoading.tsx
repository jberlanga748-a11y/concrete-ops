import { Skeleton } from "@/components/ui/skeleton";

export function DashboardModuleLoading({
  showFilters = true,
  rowCount = 5,
}: {
  showFilters?: boolean;
  rowCount?: number;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-3">
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-5 w-[30rem] max-w-full" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </section>

      {showFilters ? (
        <section className="rounded-2xl border bg-white p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <div className="space-y-3 p-4">
          {Array.from({ length: rowCount }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </section>
    </div>
  );
}
