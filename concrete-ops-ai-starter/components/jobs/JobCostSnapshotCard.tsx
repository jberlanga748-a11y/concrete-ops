"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ViewerDateTime } from "@/components/time/ViewerDateTime";
import { refreshJobCostSnapshot } from "@/lib/db/mutations";
import type { JobCostSnapshotRow } from "@/lib/db/queries";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function JobCostSnapshotCard({
  jobId,
  snapshot,
}: {
  jobId: string;
  snapshot: JobCostSnapshotRow | null;
}) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleRefresh() {
    setIsRefreshing(true);
    setMessage(null);

    const result = await refreshJobCostSnapshot(jobId);
    if (result.error) {
      setMessage(result.error);
      setIsRefreshing(false);
      return;
    }

    setMessage("Snapshot refreshed.");
    setIsRefreshing(false);
    router.refresh();
  }

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Cost Snapshot</h2>
          <p className="mt-1 text-sm text-zinc-600">Admin-only rollup from labor time, daily reports, and approved change orders.</p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {isRefreshing ? "Refreshing..." : snapshot ? "Refresh Snapshot" : "Create Snapshot"}
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border p-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Actual Labor Hours</p>
          <p className="mt-2 text-xl font-semibold">{formatNumber(snapshot?.actual_labor_hours || 0)}</p>
        </div>
        <div className="rounded-2xl border p-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Actual Labor Cost</p>
          <p className="mt-2 text-xl font-semibold">{formatCurrency(snapshot?.actual_labor_cost || 0)}</p>
        </div>
        <div className="rounded-2xl border p-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Approved Change Orders</p>
          <p className="mt-2 text-xl font-semibold">{formatCurrency(snapshot?.approved_change_order_total || 0)}</p>
        </div>
        <div className="rounded-2xl border p-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Projected Revenue</p>
          <p className="mt-2 text-xl font-semibold">{formatCurrency(snapshot?.projected_revenue_total || 0)}</p>
        </div>
        <div className="rounded-2xl border p-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Time Entries Count</p>
          <p className="mt-2 text-xl font-semibold">{snapshot?.time_entry_count || 0}</p>
        </div>
        <div className="rounded-2xl border p-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Daily Reports Count</p>
          <p className="mt-2 text-xl font-semibold">{snapshot?.daily_report_count || 0}</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-zinc-600">
        Last refreshed: <ViewerDateTime value={snapshot?.updated_at} includeYear includeTimeZoneName={false} />
      </p>
      {message ? <p className="mt-2 text-sm text-zinc-600">{message}</p> : null}
    </section>
  );
}
