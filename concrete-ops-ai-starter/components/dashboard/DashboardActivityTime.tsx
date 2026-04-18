"use client";

import { useEffect, useState } from "react";

function getViewerTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function formatDashboardActivityDateTime(value: string | null | undefined, timeZone: string) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  }).format(parsed);
}

export function DashboardActivityTime({
  value,
  className,
  emptyLabel = "—",
}: {
  value: string | null | undefined;
  className?: string;
  emptyLabel?: string;
}) {
  const [timeZone, setTimeZone] = useState("UTC");

  useEffect(() => {
    setTimeZone(getViewerTimeZone());
  }, []);

  if (!value) return <span className={className}>{emptyLabel}</span>;

  return (
    <time dateTime={value} className={className}>
      {formatDashboardActivityDateTime(value, timeZone)}
    </time>
  );
}
