"use client";

import { ViewerDateTime, type ViewerDateTimeProps } from "@/components/time/ViewerDateTime";

export function DashboardActivityTime({
  value,
  className,
  emptyLabel = "—",
}: ViewerDateTimeProps) {
  return <ViewerDateTime value={value} className={className} emptyLabel={emptyLabel} />;
}
