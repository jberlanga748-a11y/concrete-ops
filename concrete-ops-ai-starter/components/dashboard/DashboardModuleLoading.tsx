import { Skeleton } from "@/components/ui/skeleton";

export function DashboardModuleLoading({
  showFilters = true,
  rowCount = 5,
}: {
  showFilters?: boolean;
  rowCount?: number;
}) {
  return (
    <div>
      <section className="mb-5 border-b border-blue-100 bg-white px-5 py-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-3">
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-5 w-[30rem] max-w-full" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </section>

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
      {showFilters ? (
        <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-950/5">
          <div className="grid gap-3 md:grid-cols-4">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm shadow-blue-950/5">
        <div className="space-y-3 p-4">
          {Array.from({ length: rowCount }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </section>
      </div>
    </div>
  );
}
