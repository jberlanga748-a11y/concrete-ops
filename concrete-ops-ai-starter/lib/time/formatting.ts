import { TZDate, tz, tzName } from "@date-fns/tz";
import { format } from "date-fns";

export const DEFAULT_TIME_ZONE = "UTC";

const DATE_ONLY_PATTERN = "MMM d, yyyy";
const DATE_TIME_PATTERN = "MMM d, h:mm aa";
const DATE_TIME_WITH_YEAR_PATTERN = "MMM d, yyyy, h:mm aa";

type TimestampFormatOptions = {
  timeZone?: string;
  includeYear?: boolean;
  includeTimeZoneName?: boolean;
  emptyLabel?: string;
};

type TimestampDateOnlyFormatOptions = {
  timeZone?: string;
  emptyLabel?: string;
};

type CurrentDateLabelOptions = {
  timeZone?: string;
  includeWeekday?: boolean;
  monthStyle?: "long" | "short";
  date?: Date;
};

function getDateTimePattern(includeYear: boolean) {
  return includeYear ? DATE_TIME_WITH_YEAR_PATTERN : DATE_TIME_PATTERN;
}

function getCurrentDateLabelPattern(includeWeekday: boolean, monthStyle: "long" | "short") {
  const monthPattern = monthStyle === "long" ? "MMMM" : "MMM";
  return includeWeekday ? `EEEE, ${monthPattern} d` : `${monthPattern} d`;
}

function parseDateOnlyValue(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new TZDate(year, month - 1, day, DEFAULT_TIME_ZONE);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function formatInTimeZone(date: Date, timeZone: string, pattern: string) {
  try {
    return format(date, pattern, { in: tz(timeZone) });
  } catch {
    return format(date, pattern, { in: tz(DEFAULT_TIME_ZONE) });
  }
}

function getTimeZoneLabel(date: Date, timeZone: string) {
  try {
    return tzName(timeZone, date, "short");
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

export function getViewerTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIME_ZONE;
}

export function formatDateOnly(value: string | null | undefined, emptyLabel = "—") {
  if (!value) return emptyLabel;

  const parsed = parseDateOnlyValue(value);
  if (!parsed) return value;

  return formatInTimeZone(parsed, DEFAULT_TIME_ZONE, DATE_ONLY_PATTERN);
}

export function formatTimestampInTimeZone(
  value: string | null | undefined,
  {
    timeZone,
    includeYear = false,
    includeTimeZoneName = true,
    emptyLabel = "—",
  }: {
    timeZone: string;
    includeYear?: boolean;
    includeTimeZoneName?: boolean;
    emptyLabel?: string;
  },
) {
  if (!value) return emptyLabel;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  const timestamp = formatInTimeZone(parsed, timeZone, getDateTimePattern(includeYear));
  if (!includeTimeZoneName) return timestamp;

  return `${timestamp} ${getTimeZoneLabel(parsed, timeZone)}`;
}

export function formatTimestamp(
  value: string | null | undefined,
  {
    timeZone = DEFAULT_TIME_ZONE,
    includeYear = true,
    includeTimeZoneName = false,
    emptyLabel = "—",
  }: TimestampFormatOptions = {},
) {
  return formatTimestampInTimeZone(value, {
    timeZone,
    includeYear,
    includeTimeZoneName,
    emptyLabel,
  });
}

export function formatTimestampDateOnly(
  value: string | null | undefined,
  {
    timeZone = DEFAULT_TIME_ZONE,
    emptyLabel = "—",
  }: TimestampDateOnlyFormatOptions = {},
) {
  if (!value) return emptyLabel;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return formatInTimeZone(parsed, timeZone, DATE_ONLY_PATTERN);
}

export function formatCurrentDateLabel(
  {
    timeZone = DEFAULT_TIME_ZONE,
    includeWeekday = true,
    monthStyle = "long",
    date = new Date(),
  }: CurrentDateLabelOptions = {},
) {
  return formatInTimeZone(date, timeZone, getCurrentDateLabelPattern(includeWeekday, monthStyle));
}
