"use client";

import { useState } from "react";
import { AppIcon } from "@/components/ui/icons";
import { cn } from "@/components/ui/cn";
import {
  InlineNotice,
  SectionCard,
  StatCard,
  StatusPill,
  inputClassName,
  secondaryButtonClassName,
  subtleButtonClassName,
} from "@/components/ui/primitives";

type CalculatorTab = "slab" | "wall" | "round";

type SlabForm = {
  length: string;
  width: string;
  thickness: string;
  waste: string;
};

type WallForm = {
  length: string;
  height: string;
  thickness: string;
  waste: string;
};

type RoundForm = {
  diameter: string;
  height: string;
  count: string;
  waste: string;
};

type OpeningRow = {
  id: number;
  width: string;
  height: string;
  count: string;
};

type CalculationResult = {
  cubicFeet: number;
  cubicYards: number;
  truckLoads: number;
  roundedTruckLoads: number;
  errors: string[];
};

const TAB_LABELS: Record<CalculatorTab, string> = {
  slab: "Slab",
  wall: "Wall",
  round: "Round",
};

const TAB_DESCRIPTIONS: Record<CalculatorTab, string> = {
  slab: "Estimate pads, patios, floors, and slab pours with waste built in.",
  wall: "Account for wall openings so your order reflects doors, windows, and penetrations.",
  round: "Size sonotubes, piers, and round pours by diameter, height, and count.",
};

function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits,
  }).format(value);
}

function allBlank(values: string[]) {
  return values.every((value) => value.trim() === "");
}

function readNumber(
  label: string,
  rawValue: string,
  options?: {
    min?: number;
    integer?: boolean;
    allowBlank?: boolean;
    defaultValue?: number;
  },
) {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    if (options?.allowBlank) {
      return { value: options.defaultValue ?? 0, error: null as string | null };
    }

    return { value: null, error: `${label} is required.` };
  }

  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return { value: null, error: `${label} must be a valid number.` };
  }

  if (options?.integer && !Number.isInteger(value)) {
    return { value: null, error: `${label} must be a whole number.` };
  }

  const min = options?.min;
  if (min !== undefined && value < min) {
    return { value: null, error: `${label} must be at least ${min}.` };
  }

  return { value, error: null as string | null };
}

function calculateSlab(form: SlabForm): CalculationResult {
  if (allBlank([form.length, form.width, form.thickness])) {
    return { cubicFeet: 0, cubicYards: 0, truckLoads: 0, roundedTruckLoads: 0, errors: [] };
  }

  const length = readNumber("Length", form.length, { min: 0.01 });
  const width = readNumber("Width", form.width, { min: 0.01 });
  const thickness = readNumber("Thickness", form.thickness, { min: 0.01 });
  const waste = readNumber("Waste percentage", form.waste, { min: 0, allowBlank: true, defaultValue: 10 });
  const errors = [length.error, width.error, thickness.error, waste.error].filter(Boolean) as string[];

  if (errors.length > 0 || length.value === null || width.value === null || thickness.value === null || waste.value === null) {
    return { cubicFeet: 0, cubicYards: 0, truckLoads: 0, roundedTruckLoads: 0, errors };
  }

  const cubicFeet = length.value * width.value * (thickness.value / 12) * (1 + waste.value / 100);
  const cubicYards = cubicFeet / 27;
  const truckLoads = cubicYards / 10;

  return {
    cubicFeet,
    cubicYards,
    truckLoads,
    roundedTruckLoads: Math.ceil(truckLoads),
    errors: [],
  };
}

function calculateWall(form: WallForm, openings: OpeningRow[]): CalculationResult {
  const openingValues = openings.flatMap((opening) => [opening.width, opening.height, opening.count]);
  if (allBlank([form.length, form.height, form.thickness, ...openingValues])) {
    return { cubicFeet: 0, cubicYards: 0, truckLoads: 0, roundedTruckLoads: 0, errors: [] };
  }

  const length = readNumber("Length", form.length, { min: 0.01 });
  const height = readNumber("Height", form.height, { min: 0.01 });
  const thickness = readNumber("Thickness", form.thickness, { min: 0.01 });
  const waste = readNumber("Waste percentage", form.waste, { min: 0, allowBlank: true, defaultValue: 10 });
  const errors = [length.error, height.error, thickness.error, waste.error].filter(Boolean) as string[];

  let openingVolume = 0;

  openings.forEach((opening, index) => {
    if (allBlank([opening.width, opening.height, opening.count])) {
      return;
    }

    const width = readNumber(`Opening ${index + 1} width`, opening.width, { min: 0.01 });
    const heightValue = readNumber(`Opening ${index + 1} height`, opening.height, { min: 0.01 });
    const count = readNumber(`Opening ${index + 1} count`, opening.count, { min: 1, integer: true });

    if (width.error) errors.push(width.error);
    if (heightValue.error) errors.push(heightValue.error);
    if (count.error) errors.push(count.error);

    if (
      width.value !== null &&
      heightValue.value !== null &&
      count.value !== null &&
      thickness.value !== null
    ) {
      openingVolume += width.value * heightValue.value * (thickness.value / 12) * count.value;
    }
  });

  if (
    errors.length > 0 ||
    length.value === null ||
    height.value === null ||
    thickness.value === null ||
    waste.value === null
  ) {
    return { cubicFeet: 0, cubicYards: 0, truckLoads: 0, roundedTruckLoads: 0, errors };
  }

  const grossVolume = length.value * height.value * (thickness.value / 12);
  if (openingVolume >= grossVolume) {
    return {
      cubicFeet: 0,
      cubicYards: 0,
      truckLoads: 0,
      roundedTruckLoads: 0,
      errors: ["Openings cannot subtract more concrete than the full wall volume."],
    };
  }

  const cubicFeet = (grossVolume - openingVolume) * (1 + waste.value / 100);
  const cubicYards = cubicFeet / 27;
  const truckLoads = cubicYards / 10;

  return {
    cubicFeet,
    cubicYards,
    truckLoads,
    roundedTruckLoads: Math.ceil(truckLoads),
    errors: [],
  };
}

function calculateRound(form: RoundForm): CalculationResult {
  if (allBlank([form.diameter, form.height, form.count])) {
    return { cubicFeet: 0, cubicYards: 0, truckLoads: 0, roundedTruckLoads: 0, errors: [] };
  }

  const diameter = readNumber("Diameter", form.diameter, { min: 0.01 });
  const height = readNumber("Height", form.height, { min: 0.01 });
  const count = readNumber("Count", form.count, { min: 1, integer: true });
  const waste = readNumber("Waste percentage", form.waste, { min: 0, allowBlank: true, defaultValue: 10 });
  const errors = [diameter.error, height.error, count.error, waste.error].filter(Boolean) as string[];

  if (errors.length > 0 || diameter.value === null || height.value === null || count.value === null || waste.value === null) {
    return { cubicFeet: 0, cubicYards: 0, truckLoads: 0, roundedTruckLoads: 0, errors };
  }

  const radiusFeet = diameter.value / 24;
  const cubicFeet = Math.PI * radiusFeet * radiusFeet * height.value * count.value * (1 + waste.value / 100);
  const cubicYards = cubicFeet / 27;
  const truckLoads = cubicYards / 10;

  return {
    cubicFeet,
    cubicYards,
    truckLoads,
    roundedTruckLoads: Math.ceil(truckLoads),
    errors: [],
  };
}

export function ConcreteCalculator() {
  const [activeTab, setActiveTab] = useState<CalculatorTab>("slab");
  const [slab, setSlab] = useState<SlabForm>({ length: "", width: "", thickness: "", waste: "10" });
  const [wall, setWall] = useState<WallForm>({ length: "", height: "", thickness: "", waste: "10" });
  const [round, setRound] = useState<RoundForm>({ diameter: "", height: "", count: "", waste: "10" });
  const [openings, setOpenings] = useState<OpeningRow[]>([]);
  const [nextOpeningId, setNextOpeningId] = useState(1);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const result =
    activeTab === "slab"
      ? calculateSlab(slab)
      : activeTab === "wall"
        ? calculateWall(wall, openings)
        : calculateRound(round);

  const summaryText = [
    `${TAB_LABELS[activeTab]} concrete estimate`,
    `Cubic yards: ${formatNumber(result.cubicYards)}`,
    `Cubic feet: ${formatNumber(result.cubicFeet)}`,
    `10-yard truck loads: ${formatNumber(result.truckLoads)} (round up to ${result.roundedTruckLoads || 0})`,
  ].join("\n");

  async function copyResults() {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("failed");
    }
  }

  function addOpening() {
    setOpenings((current) => [...current, { id: nextOpeningId, width: "", height: "", count: "1" }]);
    setNextOpeningId((current) => current + 1);
  }

  function updateOpening(id: number, field: keyof Omit<OpeningRow, "id">, value: string) {
    setOpenings((current) =>
      current.map((opening) => (opening.id === id ? { ...opening, [field]: value } : opening)),
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <div className="space-y-6">
        <SectionCard
          title="Calculator type"
          description="Switch between slab, wall, and round pours without losing the values you already entered."
        >
          <div className="grid gap-3 md:grid-cols-3">
            {(Object.keys(TAB_LABELS) as CalculatorTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setCopyState("idle");
                }}
                className={cn(
                  "rounded-3xl border px-4 py-4 text-left transition",
                  activeTab === tab
                    ? "border-orange-300 bg-orange-50 shadow-[0_10px_30px_rgba(249,115,22,0.12)]"
                    : "border-zinc-200 bg-white hover:border-orange-200 hover:bg-orange-50/40",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-zinc-950">{TAB_LABELS[tab]}</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">{TAB_DESCRIPTIONS[tab]}</p>
                  </div>
                  <StatusPill tone={activeTab === tab ? "warning" : "neutral"}>
                    {activeTab === tab ? "Active" : "Use"}
                  </StatusPill>
                </div>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title={`${TAB_LABELS[activeTab]} inputs`}
          description="Enter your measurements in feet and inches, then review the order-ready volume on the right."
        >
          {activeTab === "slab" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-zinc-800">Length (ft)</span>
                <input
                  value={slab.length}
                  onChange={(event) => setSlab((current) => ({ ...current, length: event.target.value }))}
                  inputMode="decimal"
                  placeholder="40"
                  className={inputClassName}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-zinc-800">Width (ft)</span>
                <input
                  value={slab.width}
                  onChange={(event) => setSlab((current) => ({ ...current, width: event.target.value }))}
                  inputMode="decimal"
                  placeholder="24"
                  className={inputClassName}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-zinc-800">Thickness (in)</span>
                <input
                  value={slab.thickness}
                  onChange={(event) => setSlab((current) => ({ ...current, thickness: event.target.value }))}
                  inputMode="decimal"
                  placeholder="4"
                  className={inputClassName}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-zinc-800">Waste (%)</span>
                <input
                  value={slab.waste}
                  onChange={(event) => setSlab((current) => ({ ...current, waste: event.target.value }))}
                  inputMode="decimal"
                  placeholder="10"
                  className={inputClassName}
                />
              </label>
            </div>
          ) : null}

          {activeTab === "wall" ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-zinc-800">Length (ft)</span>
                  <input
                    value={wall.length}
                    onChange={(event) => setWall((current) => ({ ...current, length: event.target.value }))}
                    inputMode="decimal"
                    placeholder="60"
                    className={inputClassName}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-zinc-800">Height (ft)</span>
                  <input
                    value={wall.height}
                    onChange={(event) => setWall((current) => ({ ...current, height: event.target.value }))}
                    inputMode="decimal"
                    placeholder="8"
                    className={inputClassName}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-zinc-800">Thickness (in)</span>
                  <input
                    value={wall.thickness}
                    onChange={(event) => setWall((current) => ({ ...current, thickness: event.target.value }))}
                    inputMode="decimal"
                    placeholder="8"
                    className={inputClassName}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-zinc-800">Waste (%)</span>
                  <input
                    value={wall.waste}
                    onChange={(event) => setWall((current) => ({ ...current, waste: event.target.value }))}
                    inputMode="decimal"
                    placeholder="10"
                    className={inputClassName}
                  />
                </label>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-zinc-50/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-zinc-950">Openings</h3>
                    <p className="mt-1 text-sm text-zinc-600">
                      Subtract doors, windows, or penetrations from the wall volume.
                    </p>
                  </div>
                  <button type="button" onClick={addOpening} className={secondaryButtonClassName}>
                    Add opening
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {openings.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-5 text-sm text-zinc-600">
                      No openings added. Leave this empty if the wall is a continuous pour.
                    </div>
                  ) : null}

                  {openings.map((opening, index) => (
                    <div key={opening.id} className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 lg:grid-cols-4">
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-zinc-800">Width (ft)</span>
                        <input
                          value={opening.width}
                          onChange={(event) => updateOpening(opening.id, "width", event.target.value)}
                          inputMode="decimal"
                          placeholder="3"
                          className={inputClassName}
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-zinc-800">Height (ft)</span>
                        <input
                          value={opening.height}
                          onChange={(event) => updateOpening(opening.id, "height", event.target.value)}
                          inputMode="decimal"
                          placeholder="7"
                          className={inputClassName}
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-zinc-800">Count</span>
                        <input
                          value={opening.count}
                          onChange={(event) => updateOpening(opening.id, "count", event.target.value)}
                          inputMode="numeric"
                          placeholder="1"
                          className={inputClassName}
                        />
                      </label>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => setOpenings((current) => current.filter((item) => item.id !== opening.id))}
                          className={cn(subtleButtonClassName, "w-full text-red-600 hover:bg-red-50 hover:text-red-700")}
                        >
                          Remove opening {index + 1}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "round" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-zinc-800">Diameter (in)</span>
                <input
                  value={round.diameter}
                  onChange={(event) => setRound((current) => ({ ...current, diameter: event.target.value }))}
                  inputMode="decimal"
                  placeholder="24"
                  className={inputClassName}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-zinc-800">Height (ft)</span>
                <input
                  value={round.height}
                  onChange={(event) => setRound((current) => ({ ...current, height: event.target.value }))}
                  inputMode="decimal"
                  placeholder="6"
                  className={inputClassName}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-zinc-800">Count</span>
                <input
                  value={round.count}
                  onChange={(event) => setRound((current) => ({ ...current, count: event.target.value }))}
                  inputMode="numeric"
                  placeholder="8"
                  className={inputClassName}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-zinc-800">Waste (%)</span>
                <input
                  value={round.waste}
                  onChange={(event) => setRound((current) => ({ ...current, waste: event.target.value }))}
                  inputMode="decimal"
                  placeholder="10"
                  className={inputClassName}
                />
              </label>
            </div>
          ) : null}
        </SectionCard>
      </div>

      <div className="space-y-6">
        <SectionCard
          title="Results"
          description="Use this output when reviewing order quantities with the yard or dispatcher."
          action={
            <button type="button" onClick={copyResults} className={secondaryButtonClassName}>
              <AppIcon icon="clipboard" className="h-4 w-4" />
              Copy results
            </button>
          }
        >
          <div className="grid gap-4">
            <StatCard
              label="Cubic yards"
              value={formatNumber(result.cubicYards)}
              hint="Order-ready volume with waste included."
              icon="calculator"
              tone="warning"
            />
            <StatCard
              label="Cubic feet"
              value={formatNumber(result.cubicFeet)}
              hint="Useful for quick field checks and conversions."
              icon="briefcase"
            />
            <StatCard
              label="10-yard truck loads"
              value={formatNumber(result.truckLoads)}
              hint={`Round up to ${result.roundedTruckLoads || 0} truck${result.roundedTruckLoads === 1 ? "" : "s"} for dispatch planning.`}
              icon="truck"
              tone="info"
            />
          </div>

          <div className="mt-4 space-y-3">
            {copyState === "copied" ? (
              <InlineNotice tone="success">Results copied to your clipboard.</InlineNotice>
            ) : null}
            {copyState === "failed" ? (
              <InlineNotice tone="error">
                Copy failed in this browser. You can still read the results here and copy them manually.
              </InlineNotice>
            ) : null}
            {result.errors.length > 0 ? (
              <InlineNotice tone="warning">
                <ul className="space-y-1">
                  {result.errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </InlineNotice>
            ) : (
              <InlineNotice tone="info">
                Double-check site conditions before ordering. This calculator is meant for planning, not structural engineering.
              </InlineNotice>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Quick references" description="Common measurement reminders for field use.">
          <div className="space-y-3 text-sm leading-6 text-zinc-700">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="font-semibold text-zinc-950">Slab formula</p>
              <p className="mt-1">Length × Width × (Thickness ÷ 12) × Waste factor</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="font-semibold text-zinc-950">Wall formula</p>
              <p className="mt-1">Length × Height × (Thickness ÷ 12), then subtract openings before waste.</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="font-semibold text-zinc-950">Round formula</p>
              <p className="mt-1">π × Radius² × Height × Count, then apply waste.</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
