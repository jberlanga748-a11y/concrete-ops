"use client";

import { useEffect, useState } from "react";
import { formatCurrentDateLabel, getViewerTimeZone } from "@/lib/time/formatting";

export type ViewerCurrentDateLabelProps = {
  includeWeekday?: boolean;
  monthStyle?: "long" | "short";
  className?: string;
  prefix?: string;
};

export function ViewerCurrentDateLabel({
  includeWeekday = true,
  monthStyle = "long",
  className,
  prefix,
}: ViewerCurrentDateLabelProps) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    setLabel(formatCurrentDateLabel({ timeZone: getViewerTimeZone(), includeWeekday, monthStyle }));
  }, [includeWeekday, monthStyle]);

  if (!label) return null;

  return (
    <span className={className} suppressHydrationWarning>
      {prefix}
      {label}
    </span>
  );
}
