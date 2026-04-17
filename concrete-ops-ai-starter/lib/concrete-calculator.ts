export type ConcreteCalculatorRow = {
  id: string;
  description: string;
  quantity: number;
  lengthFeet: number;
  widthFeet: number;
  depthInches: number;
};

export type ParsedConcreteRow = Omit<ConcreteCalculatorRow, "id">;

export type ConcreteTotals = {
  subtotalCubicFeet: number;
  subtotalCubicYards: number;
  wasteCubicYards: number;
  totalCubicYards: number;
};

export type ParsedConcreteShorthandLine =
  | { ok: true; row: ParsedConcreteRow }
  | { ok: false; error: string };

export type ParsedConcreteShorthandBatch = {
  rows: ParsedConcreteRow[];
  errors: string[];
};

type ParsedDimension =
  | { unit: "ft"; value: number }
  | { unit: "in"; value: number };

function roundTo(value: number, precision: number) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function createConcreteCalculatorRow(overrides?: Partial<ConcreteCalculatorRow>): ConcreteCalculatorRow {
  return {
    id: overrides?.id ?? `row-${Math.random().toString(36).slice(2, 10)}`,
    description: overrides?.description ?? "",
    quantity: overrides?.quantity ?? 1,
    lengthFeet: overrides?.lengthFeet ?? 0,
    widthFeet: overrides?.widthFeet ?? 0,
    depthInches: overrides?.depthInches ?? 0,
  };
}

export function calculateConcreteRowCubicFeet(row: Pick<ConcreteCalculatorRow, "quantity" | "lengthFeet" | "widthFeet" | "depthInches">) {
  return row.quantity * row.lengthFeet * row.widthFeet * (row.depthInches / 12);
}

export function calculateConcreteRowCubicYards(row: Pick<ConcreteCalculatorRow, "quantity" | "lengthFeet" | "widthFeet" | "depthInches">) {
  return calculateConcreteRowCubicFeet(row) / 27;
}

export function calculateConcreteTotals(
  rows: Array<Pick<ConcreteCalculatorRow, "quantity" | "lengthFeet" | "widthFeet" | "depthInches">>,
  wastePercent: number,
): ConcreteTotals {
  const subtotalCubicFeet = rows.reduce((sum, row) => sum + calculateConcreteRowCubicFeet(row), 0);
  const subtotalCubicYards = subtotalCubicFeet / 27;
  const wasteCubicYards = subtotalCubicYards * (Math.max(wastePercent, 0) / 100);

  return {
    subtotalCubicFeet: roundTo(subtotalCubicFeet, 2),
    subtotalCubicYards: roundTo(subtotalCubicYards, 2),
    wasteCubicYards: roundTo(wasteCubicYards, 2),
    totalCubicYards: roundTo(subtotalCubicYards + wasteCubicYards, 2),
  };
}

function parseDimensionValue(rawValue: string, rawUnit: string | undefined, defaultUnit: "ft" | "in"): ParsedDimension | null {
  const value = Number(rawValue);
  if (!Number.isFinite(value) || value <= 0) return null;

  const normalizedUnit = rawUnit?.toLowerCase();
  if (!normalizedUnit) {
    return defaultUnit === "ft" ? { unit: "ft", value } : { unit: "in", value };
  }

  if (normalizedUnit === "ft" || normalizedUnit === "f" || normalizedUnit === "'") {
    return { unit: "ft", value };
  }

  if (normalizedUnit === "in" || normalizedUnit === "i" || normalizedUnit === "\"") {
    return { unit: "in", value };
  }

  return null;
}

export function parseConcreteShorthandLine(input: string): ParsedConcreteShorthandLine {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: "Line is empty." };
  }

  const dimensionMatch = trimmed.match(
    /(\d+(?:\.\d+)?)\s*(ft|f|'|in|i|")?\s*[x×]\s*(\d+(?:\.\d+)?)\s*(ft|f|'|in|i|")?\s*[x×]\s*(\d+(?:\.\d+)?)\s*(ft|f|'|in|i|")?/i,
  );

  if (!dimensionMatch || dimensionMatch.index === undefined) {
    return {
      ok: false,
      error: `Couldn't find dimensions in "${trimmed}". Use a format like "20 panels 5x5x4".`,
    };
  }

  const lengthDimension = parseDimensionValue(dimensionMatch[1], dimensionMatch[2], "ft");
  const widthDimension = parseDimensionValue(dimensionMatch[3], dimensionMatch[4], "ft");
  const depthDimension = parseDimensionValue(dimensionMatch[5], dimensionMatch[6], "in");

  if (!lengthDimension || !widthDimension || !depthDimension) {
    return {
      ok: false,
      error: `Couldn't parse dimensions in "${trimmed}". Supported units are feet and inches.`,
    };
  }

  const lengthFeet = lengthDimension.unit === "ft" ? lengthDimension.value : lengthDimension.value / 12;
  const widthFeet = widthDimension.unit === "ft" ? widthDimension.value : widthDimension.value / 12;
  const depthInches = depthDimension.unit === "in" ? depthDimension.value : depthDimension.value * 12;
  const prefix = trimmed.slice(0, dimensionMatch.index).trim();
  const suffix = trimmed.slice(dimensionMatch.index + dimensionMatch[0].length).trim();
  const descriptorText = [prefix, suffix].filter(Boolean).join(" ").trim();

  const quantityMatch = descriptorText.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
  const quantity = quantityMatch ? Number(quantityMatch[1]) : 1;
  const description = (quantityMatch ? quantityMatch[2] : descriptorText).trim() || "Concrete item";

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return {
      ok: false,
      error: `Couldn't parse quantity in "${trimmed}".`,
    };
  }

  return {
    ok: true,
    row: {
      description,
      quantity,
      lengthFeet,
      widthFeet,
      depthInches,
    },
  };
}

export function parseConcreteShorthandBatch(input: string): ParsedConcreteShorthandBatch {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rows: ParsedConcreteRow[] = [];
  const errors: string[] = [];

  lines.forEach((line, index) => {
    const parsed = parseConcreteShorthandLine(line);
    if (parsed.ok) {
      rows.push(parsed.row);
      return;
    }

    errors.push(`Line ${index + 1}: ${parsed.error}`);
  });

  return { rows, errors };
}
