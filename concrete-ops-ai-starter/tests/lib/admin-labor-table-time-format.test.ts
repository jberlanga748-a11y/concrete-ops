import { describe, expect, it } from "vitest";
import { formatLaborDateTime } from "@/components/time/AdminLaborTable";

describe("formatLaborDateTime", () => {
  it("formats timestamps using the supplied timezone instead of ambient runtime defaults", () => {
    const timestamp = "2026-04-17T15:30:00.000Z";

    const utc = formatLaborDateTime(timestamp, "UTC");
    const pacific = formatLaborDateTime(timestamp, "America/Los_Angeles");

    expect(utc).toContain("3:30");
    expect(utc).toContain("UTC");
    expect(pacific).toContain("8:30");
    expect(pacific).not.toEqual(utc);
  });

  it("handles empty and invalid values safely", () => {
    expect(formatLaborDateTime(null, "UTC")).toBe("—");
    expect(formatLaborDateTime("not-a-real-date", "UTC")).toBe("not-a-real-date");
  });
});
