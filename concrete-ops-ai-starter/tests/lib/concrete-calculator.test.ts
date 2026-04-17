import { describe, expect, it } from "vitest";
import {
  calculateConcreteRowCubicFeet,
  calculateConcreteRowCubicYards,
  calculateConcreteTotals,
  parseConcreteShorthandBatch,
  parseConcreteShorthandLine,
} from "@/lib/concrete-calculator";

describe("concrete calculator math", () => {
  it("calculates cubic feet and cubic yards deterministically", () => {
    const row = {
      quantity: 20,
      lengthFeet: 5,
      widthFeet: 5,
      depthInches: 4,
    };

    expect(calculateConcreteRowCubicFeet(row)).toBeCloseTo(166.6667, 3);
    expect(calculateConcreteRowCubicYards(row)).toBeCloseTo(6.1728, 3);
  });

  it("applies waste factor to the running total", () => {
    const totals = calculateConcreteTotals(
      [
        { quantity: 1, lengthFeet: 20, widthFeet: 20, depthInches: 4 },
        { quantity: 2, lengthFeet: 3, widthFeet: 3, depthInches: 18 },
      ],
      8,
    );

    expect(totals.subtotalCubicYards).toBe(5.94);
    expect(totals.wasteCubicYards).toBe(0.48);
    expect(totals.totalCubicYards).toBe(6.41);
  });
});

describe("concrete calculator shorthand parser", () => {
  it("parses common panel shorthand with default units", () => {
    const parsed = parseConcreteShorthandLine("20 panels 5x5x4");

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.row).toMatchObject({
      description: "panels",
      quantity: 20,
      lengthFeet: 5,
      widthFeet: 5,
      depthInches: 4,
    });
  });

  it("defaults omitted units to feet, feet, and inches by position", () => {
    const parsed = parseConcreteShorthandLine("Ramp pour 12x8x6");

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.row).toMatchObject({
      description: "Ramp pour",
      quantity: 1,
      lengthFeet: 12,
      widthFeet: 8,
      depthInches: 6,
    });
  });

  it("parses explicit feet and inches units", () => {
    const parsed = parseConcreteShorthandLine("2 footings 3ft x 3ft x 18in");

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.row).toMatchObject({
      description: "footings",
      quantity: 2,
      lengthFeet: 3,
      widthFeet: 3,
      depthInches: 18,
    });
  });

  it("accepts shorthand unit aliases and symbol notation", () => {
    const parsed = parseConcreteShorthandLine("3 forms 6' x 2.5f x 6i");

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.row).toMatchObject({
      description: "forms",
      quantity: 3,
      lengthFeet: 6,
      widthFeet: 2.5,
      depthInches: 6,
    });
  });

  it("rejects inch-based length and width by default", () => {
    const parsed = parseConcreteShorthandLine("24in x 24in x 4in");

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error).toBe("Length and width must use feet (ft, f, '). Inches are only allowed for depth unless inch mode is enabled.");
  });

  it("converts inch-based length and width only when inch mode is enabled", () => {
    const parsed = parseConcreteShorthandLine("24\" x 30\" x 1.5'", { allowInchLengthWidth: true });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.row).toMatchObject({
      description: "Concrete item",
      quantity: 1,
      lengthFeet: 2,
      widthFeet: 2.5,
      depthInches: 18,
    });
  });

  it("returns row errors for invalid shorthand lines", () => {
    const parsed = parseConcreteShorthandBatch("20 panels 5x5x4\nbad line\nRamp 12x8x6");

    expect(parsed.rows).toHaveLength(2);
    expect(parsed.errors).toHaveLength(1);
    expect(parsed.errors[0]).toContain("Line 2");
  });
});
