"use client";

import { useEffect, useState } from "react";
import { DEFAULT_TIME_ZONE, getViewerTimeZone } from "@/lib/time/formatting";
import { ZonedDateTime, type ZonedDateTimeProps } from "@/components/time/ZonedDateTime";

export type ViewerDateTimeProps = Omit<ZonedDateTimeProps, "timeZone">;

export function ViewerDateTime(props: ViewerDateTimeProps) {
  const [timeZone, setTimeZone] = useState(DEFAULT_TIME_ZONE);

  useEffect(() => {
    setTimeZone(getViewerTimeZone());
  }, []);

  return <ZonedDateTime {...props} timeZone={timeZone} />;
}
