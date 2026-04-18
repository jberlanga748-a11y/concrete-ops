import { formatTimestampInTimeZone } from "@/lib/time/formatting";

export type ZonedDateTimeProps = {
  value: string | null | undefined;
  timeZone: string;
  className?: string;
  emptyLabel?: string;
  includeYear?: boolean;
  includeTimeZoneName?: boolean;
};

export function ZonedDateTime({
  value,
  timeZone,
  className,
  emptyLabel = "—",
  includeYear = false,
  includeTimeZoneName = true,
}: ZonedDateTimeProps) {
  if (!value) return <span className={className}>{emptyLabel}</span>;

  return (
    <time dateTime={value} className={className}>
      {formatTimestampInTimeZone(value, {
        timeZone,
        includeYear,
        includeTimeZoneName,
        emptyLabel,
      })}
    </time>
  );
}
