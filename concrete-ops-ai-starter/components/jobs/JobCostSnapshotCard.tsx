"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ViewerDateTime } from "@/components/time/ViewerDateTime";
import { OperationalCard, SectionHeader } from "@/components/ui/page-primitives";
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
  const metrics = [
    ["Actual Labor Hours", formatNumber(snapshot?.actual_labor_hours || 0)],
    ["Actual Labor Cost", formatCurrency(snapshot?.actual_labor_cost || 0)],
    ["Approved Change Orders", formatCurrency(snapshot?.approved_change_order_total || 0)],
    ["Projected Revenue", formatCurrency(snapshot?.projected_revenue_total || 0)],
    ["Time Entries Count", snapshot?.time_entry_count || 0],
    ["Daily Reports Count", snapshot?.daily_report_count || 0],
  ];

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
    <OperationalCard className="p-4">
      <SectionHeader
        title="Cost Snapshot"
        description="Admin-only rollup from labor time, daily reports, and approved change orders."
        action={
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-blue-700/20 transition hover:bg-blue-800 disabled:opacity-50"
          >
            {isRefreshing ? "Refreshing..." : snapshot ? "Refresh Snapshot" : "Create Snapshot"}
          </button>
        }
      />

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">{label}</p>
            <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-blue-100 bg-white p-3 text-sm font-bold text-slate-500">
        Last refreshed: <ViewerDateTime value={snapshot?.updated_at} includeYear includeTimeZoneName={false} />
      </div>
      {message ? <p className="mt-2 text-sm font-bold text-slate-500">{message}</p> : null}
    </OperationalCard>
  );
}
