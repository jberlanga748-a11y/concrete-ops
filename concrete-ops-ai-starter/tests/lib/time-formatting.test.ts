import { describe, expect, it } from "vitest";
import {
  formatCurrentDateLabel,
  formatDateOnly,
  formatTimestamp,
  formatTimestampDateOnly,
  formatTimestampInTimeZone,
} from "@/lib/time/formatting";

describe("time formatting", () => {
  it("keeps date-only values pinned to the intended UTC calendar day", () => {
    expect(formatDateOnly("2026-04-14")).toBe("Apr 14, 2026");
  });

  it("returns the original date-only value when the calendar date is invalid", () => {
    expect(formatDateOnly("2026-02-30")).toBe("2026-02-30");
  });

  it("formats timestamps in the supplied timezone with an explicit zone label", () => {
    const timestamp = "2026-11-01T08:30:00.000Z";

    expect(formatTimestampInTimeZone(timestamp, { timeZone: "UTC" })).toBe("Nov 1, 8:30 AM UTC");
    expect(formatTimestampInTimeZone(timestamp, { timeZone: "America/Los_Angeles" })).toBe("Nov 1, 1:30 AM PDT");
    expect(formatTimestampInTimeZone(timestamp, { timeZone: "America/New_York" })).toBe("Nov 1, 3:30 AM EST");
  });

  it("formats shared timestamp helpers without repeating ad hoc Intl logic", () => {
    const timestamp = "2026-11-01T08:30:00.000Z";

    expect(formatTimestamp(timestamp)).toBe("Nov 1, 2026, 8:30 AM");
    expect(formatTimestamp(timestamp, { includeYear: false })).toBe("Nov 1, 8:30 AM");
    expect(formatTimestampDateOnly(timestamp)).toBe("Nov 1, 2026");
  });

  it("formats current date labels through the shared helper", () => {
    const date = new Date("2026-04-18T12:00:00.000Z");

    expect(formatCurrentDateLabel({ date })).toBe("Saturday, April 18");
    expect(formatCurrentDateLabel({ date, monthStyle: "short" })).toBe("Saturday, Apr 18");
    expect(formatCurrentDateLabel({ date, includeWeekday: false })).toBe("April 18");
  });

  it("handles empty and invalid timestamp values safely", () => {
    expect(formatTimestampInTimeZone(null, { timeZone: "UTC" })).toBe("—");
    expect(formatTimestampInTimeZone("not-a-real-date", { timeZone: "UTC" })).toBe("not-a-real-date");
    expect(formatTimestamp(null)).toBe("—");
    expect(formatTimestampDateOnly("still-not-a-date")).toBe("still-not-a-date");
  });
});
