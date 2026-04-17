"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/ToastProvider";
import {
  calculateConcreteRowCubicFeet,
  calculateConcreteRowCubicYards,
  calculateConcreteTotals,
  createConcreteCalculatorRow,
  parseConcreteShorthandBatch,
  type ConcreteCalculatorRow,
} from "@/lib/concrete-calculator";

function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}

function isStartedRow(row: ConcreteCalculatorRow) {
  return Boolean(row.description.trim()) || row.lengthFeet > 0 || row.widthFeet > 0 || row.depthInches > 0;
}

function isCompleteRow(row: ConcreteCalculatorRow) {
  return row.quantity > 0 && row.lengthFeet > 0 && row.widthFeet > 0 && row.depthInches > 0;
}

function SummaryMetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <article className="rounded-[24px] border border-zinc-200 bg-zinc-50/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
    </article>
  );
}

export function ConcreteCalculator() {
  const { pushToast } = useToast();
  const [rows, setRows] = useState<ConcreteCalculatorRow[]>([
    createConcreteCalculatorRow({
      description: "Main slab",
      quantity: 1,
      lengthFeet: 20,
      widthFeet: 20,
      depthInches: 4,
    }),
  ]);
  const [wastePercent, setWastePercent] = useState("8");
  const [shorthandInput, setShorthandInput] = useState("");
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [lastParsedRowCount, setLastParsedRowCount] = useState<number | null>(null);

  const rawWastePercent = Number.parseFloat(wastePercent);
  const effectiveWastePercent = Number.isFinite(rawWastePercent) ? Math.max(rawWastePercent, 0) : 0;
  const hasStartedRows = rows.some(isStartedRow);
  const readyRowCount = rows.filter(isCompleteRow).length;
  const wasteIsNegative = Number.isFinite(rawWastePercent) && rawWastePercent < 0;

  const totals = useMemo(
    () => calculateConcreteTotals(rows, effectiveWastePercent),
    [rows, effectiveWastePercent],
  );

  function updateRow(id: string, patch: Partial<ConcreteCalculatorRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addBlankRow() {
    setRows((current) => [...current, createConcreteCalculatorRow()]);
  }

  function removeRow(id: string) {
    setRows((current) =>
      current.length === 1 ? [createConcreteCalculatorRow()] : current.filter((row) => row.id !== id),
    );
  }

  function clearAllRows() {
    setRows([createConcreteCalculatorRow()]);
  }

  function handleParseShorthand() {
    const parsed = parseConcreteShorthandBatch(shorthandInput);
    setParseErrors(parsed.errors);
    setLastParsedRowCount(parsed.rows.length);

    if (parsed.rows.length === 0) {
      pushToast({
        tone: "error",
        title: "No calculator rows added",
        description: parsed.errors[0] || "Enter shorthand lines like “20 panels 5x5x4” to parse rows.",
      });
      return;
    }

    setRows((current) => [
      ...current.filter((row) => row.description || row.lengthFeet || row.widthFeet || row.depthInches),
      ...parsed.rows.map((row) => createConcreteCalculatorRow(row)),
    ]);
    setShorthandInput("");

    pushToast({
      tone: parsed.errors.length > 0 ? "info" : "success",
      title: parsed.errors.length > 0 ? "Rows added with a few skips" : "Calculator rows added",
      description:
        parsed.errors.length > 0
          ? `${parsed.rows.length} row(s) added. ${parsed.errors[0]}`
          : `${parsed.rows.length} shorthand row(s) converted into calculator entries.`,
    });
  }

  const calculatorState = (() => {
    if (!hasStartedRows) {
      return {
        eyebrow: "Ready for takeoff",
        title: "Start with measurements or paste shorthand notes",
        description: "The calculator keeps a blank row ready for you. Add dimensions manually or import shorthand to build the order total.",
        className: "border-zinc-200 bg-zinc-50 text-zinc-700",
      };
    }

    if (wasteIsNegative) {
      return {
        eyebrow: "Heads up",
        title: "Negative waste is treated as zero",
        description: "The total stays deterministic by clamping waste to 0% until you enter a positive value again.",
        className: "border-amber-200 bg-amber-50 text-amber-800",
      };
    }

    return {
      eyebrow: "Estimate ready",
      title: "Review the final yardage before ordering",
      description: "Subtotal, waste, and final order quantity are all updating from the same worksheet so the office and field stay aligned.",
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    };
  })();

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Field Tool</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">Concrete Calculator</h1>
            <p className="mt-3 text-sm leading-7 text-zinc-600">
              Build row-based pours, apply waste, and keep a deterministic cubic-yard total for office ordering.
              Math stays grounded in the same formula every time:{" "}
              <span className="font-medium text-zinc-900">quantity × length × width × depth ÷ 12 ÷ 27</span>.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="border-zinc-300 bg-white text-zinc-700">
                Deterministic math
              </Badge>
              <Badge variant="outline" className="border-zinc-300 bg-white text-zinc-700">
                Feet x feet x inches
              </Badge>
              <Badge variant="outline" className="border-zinc-300 bg-white text-zinc-700">
                Mobile worksheet
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={addBlankRow}
              className="h-11 rounded-2xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Add row
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={clearAllRows}
              className="h-11 rounded-2xl border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 hover:border-orange-200 hover:bg-orange-50 hover:text-zinc-950"
            >
              Reset rows
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr,0.84fr]">
        <section className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Worksheet</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">Row-by-row concrete takeoff</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
                Keep one row per slab, footing, panel group, or other rectangular pour so the running total stays easy to audit.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-zinc-300 bg-white text-zinc-700">
                {rows.length} row{rows.length === 1 ? "" : "s"}
              </Badge>
              <Badge variant="outline" className="border-zinc-300 bg-white text-zinc-700">
                {readyRowCount} ready
              </Badge>
            </div>
          </div>

          <div className="mt-5 space-y-4 lg:hidden">
            {rows.map((row, index) => {
              const rowFeet = calculateConcreteRowCubicFeet(row);
              const rowYards = calculateConcreteRowCubicYards(row);

              return (
                <article
                  key={row.id}
                  className="rounded-[28px] border border-zinc-200 bg-zinc-50/80 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Row {index + 1}</p>
                      <h3 className="mt-1 text-base font-semibold text-zinc-950">
                        {row.description.trim() || "Concrete item"}
                      </h3>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRow(row.id)}
                      className="rounded-2xl px-3 text-sm font-semibold text-zinc-600 hover:bg-white hover:text-zinc-950"
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <FieldLabel>Description</FieldLabel>
                      <Input
                        value={row.description}
                        onChange={(event) => updateRow(row.id, { description: event.target.value })}
                        placeholder="Example: Main slab"
                        className="h-11 rounded-2xl border-zinc-300 bg-white px-4 text-sm text-zinc-900 shadow-sm shadow-zinc-200/60"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel>Quantity</FieldLabel>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={row.quantity}
                          onChange={(event) => updateRow(row.id, { quantity: Number(event.target.value) || 0 })}
                          className="h-11 rounded-2xl border-zinc-300 bg-white px-4 text-sm text-zinc-900 shadow-sm shadow-zinc-200/60"
                        />
                      </div>
                      <div>
                        <FieldLabel>Depth (in)</FieldLabel>
                        <Input
                          type="number"
                          min="0"
                          step="0.25"
                          value={row.depthInches}
                          onChange={(event) => updateRow(row.id, { depthInches: Number(event.target.value) || 0 })}
                          className="h-11 rounded-2xl border-zinc-300 bg-white px-4 text-sm text-zinc-900 shadow-sm shadow-zinc-200/60"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel>Length (ft)</FieldLabel>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.lengthFeet}
                          onChange={(event) => updateRow(row.id, { lengthFeet: Number(event.target.value) || 0 })}
                          className="h-11 rounded-2xl border-zinc-300 bg-white px-4 text-sm text-zinc-900 shadow-sm shadow-zinc-200/60"
                        />
                      </div>
                      <div>
                        <FieldLabel>Width (ft)</FieldLabel>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.widthFeet}
                          onChange={(event) => updateRow(row.id, { widthFeet: Number(event.target.value) || 0 })}
                          className="h-11 rounded-2xl border-zinc-300 bg-white px-4 text-sm text-zinc-900 shadow-sm shadow-zinc-200/60"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[24px] border border-zinc-200 bg-white px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Row volume</p>
                      <p className="text-lg font-semibold tracking-tight text-zinc-950">
                        {formatNumber(rowYards, 3)} yd
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">{formatNumber(rowFeet, 2)} cubic feet</p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-5 hidden overflow-hidden rounded-[28px] border border-zinc-200 lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-100/80">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Description</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Qty</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Length (ft)</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Width (ft)</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Depth (in)</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Volume</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {rows.map((row) => {
                    const rowFeet = calculateConcreteRowCubicFeet(row);
                    const rowYards = calculateConcreteRowCubicYards(row);

                    return (
                      <tr key={row.id} className="align-top transition hover:bg-zinc-50/80">
                        <td className="px-4 py-4">
                          <Input
                            value={row.description}
                            onChange={(event) => updateRow(row.id, { description: event.target.value })}
                            placeholder="Example: North slab panels"
                            className="h-11 rounded-2xl border-zinc-300 bg-white px-4 text-sm text-zinc-900 shadow-sm shadow-zinc-200/60"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={row.quantity}
                            onChange={(event) => updateRow(row.id, { quantity: Number(event.target.value) || 0 })}
                            className="h-11 rounded-2xl border-zinc-300 bg-white px-4 text-sm text-zinc-900 shadow-sm shadow-zinc-200/60"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.lengthFeet}
                            onChange={(event) => updateRow(row.id, { lengthFeet: Number(event.target.value) || 0 })}
                            className="h-11 rounded-2xl border-zinc-300 bg-white px-4 text-sm text-zinc-900 shadow-sm shadow-zinc-200/60"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.widthFeet}
                            onChange={(event) => updateRow(row.id, { widthFeet: Number(event.target.value) || 0 })}
                            className="h-11 rounded-2xl border-zinc-300 bg-white px-4 text-sm text-zinc-900 shadow-sm shadow-zinc-200/60"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <Input
                            type="number"
                            min="0"
                            step="0.25"
                            value={row.depthInches}
                            onChange={(event) => updateRow(row.id, { depthInches: Number(event.target.value) || 0 })}
                            className="h-11 rounded-2xl border-zinc-300 bg-white px-4 text-sm text-zinc-900 shadow-sm shadow-zinc-200/60"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-lg font-semibold tracking-tight text-zinc-950">{formatNumber(rowYards, 3)} yd</p>
                          <p className="mt-2 text-xs leading-5 text-zinc-500">{formatNumber(rowFeet, 2)} cubic feet</p>
                        </td>
                        <td className="px-4 py-4">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeRow(row.id)}
                            className="rounded-2xl border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-900 hover:border-orange-200 hover:bg-orange-50 hover:text-zinc-950"
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-zinc-200 bg-zinc-50/70 px-4 py-3 text-sm leading-6 text-zinc-600">
            Use feet for length and width, inches for depth, and keep each distinct pour on its own row so the office total stays easy to verify.
          </div>
        </section>

        <div className="space-y-4">
          <div className="rounded-[32px] border border-orange-200 bg-[linear-gradient(160deg,rgba(249,115,22,0.16),rgba(255,255,255,0.96)_58%),#ffffff] p-6 shadow-[0_18px_40px_rgba(249,115,22,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">Final Order Target</p>
            <p className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950">
              {formatNumber(totals.totalCubicYards)} cubic yards
            </p>
            <p className="mt-3 text-sm leading-6 text-zinc-700">
              Waste is already rolled into this total so field math, purchasing, and office review are all looking at the same number.
            </p>
          </div>

          <div className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Project Totals</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">Track subtotal and waste</h2>
              </div>

              <div className="rounded-[24px] border border-zinc-200 bg-zinc-50/80 p-4">
                <FieldLabel>Waste percent</FieldLabel>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={wastePercent}
                  onChange={(event) => setWastePercent(event.target.value)}
                  className="h-11 max-w-[220px] rounded-2xl border-zinc-300 bg-white px-4 text-sm text-zinc-900 shadow-sm shadow-zinc-200/60"
                />
                <p className={`mt-2 text-xs leading-5 ${wasteIsNegative ? "text-amber-700" : "text-zinc-500"}`}>
                  {wasteIsNegative
                    ? "Negative waste is clamped to 0% until you enter a positive value."
                    : "Applied after the subtotal so the final order target stays easy to review."}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                <SummaryMetricCard
                  label="Subtotal Cubic Feet"
                  value={formatNumber(totals.subtotalCubicFeet)}
                  description="Raw volume before converting to yards."
                />
                <SummaryMetricCard
                  label="Subtotal Cubic Yards"
                  value={formatNumber(totals.subtotalCubicYards)}
                  description="Base ordering number before waste is added."
                />
                <SummaryMetricCard
                  label="Waste Yards"
                  value={formatNumber(totals.wasteCubicYards)}
                  description={`Applied from ${formatNumber(effectiveWastePercent, 1)}% waste and ${readyRowCount} completed row${readyRowCount === 1 ? "" : "s"}.`}
                />
              </div>
            </div>
          </div>

          <div className={`rounded-[28px] border p-5 ${calculatorState.className}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">{calculatorState.eyebrow}</p>
            <h3 className="mt-2 text-lg font-semibold tracking-tight text-zinc-950">{calculatorState.title}</h3>
            <p className="mt-2 text-sm leading-6">{calculatorState.description}</p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <div className="grid gap-0 xl:grid-cols-[0.9fr,1.1fr]">
          <div className="border-b border-zinc-200 bg-[linear-gradient(135deg,rgba(249,115,22,0.12),rgba(255,255,255,0)_65%),linear-gradient(180deg,#fff7ed_0%,#ffffff_100%)] p-6 sm:p-7 xl:border-b-0 xl:border-r">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Shorthand Workspace</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">Convert field notes into clean rows</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-600">
              Paste one line per item when you need speed. The parser converts common shorthand into structured calculator rows without changing the underlying math.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {["20 panels 5x5x4", "Ramp pour 12x8x6", "2 footings 3ft x 3ft x 18in"].map((example) => (
                <div key={example} className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm shadow-orange-100/40">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Example</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-zinc-900">{example}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[24px] border border-orange-100 bg-white/85 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Parser Notes</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-700">
                <li>Default shorthand assumes length and width are in feet while depth is in inches when units are omitted.</li>
                <li>Leading numbers are treated as quantity when they appear before the description.</li>
                <li>Rows that do not parse stay visible so you can fix them without losing the rest of the batch.</li>
              </ul>
            </div>
          </div>

          <div className="p-6 sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Paste Lines</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">Import shorthand entries</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
                  Keep one row per line. The parser adds clean rows to the worksheet and flags anything that still needs review.
                </p>
              </div>

              <Button
                type="button"
                onClick={handleParseShorthand}
                className="h-11 rounded-2xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Add parsed rows
              </Button>
            </div>

            <textarea
              value={shorthandInput}
              onChange={(event) => setShorthandInput(event.target.value)}
              placeholder={`20 panels 5x5x4\nRamp pour 12x8x6\n2 footings 3ft x 3ft x 18in`}
              className="mt-5 min-h-52 w-full rounded-[28px] border border-zinc-300 bg-zinc-50/50 px-4 py-4 text-sm leading-6 text-zinc-900 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
            />

            {parseErrors.length > 0 ? (
              <div className="mt-4 rounded-[24px] border border-rose-200 bg-rose-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">Parser needs review</p>
                <p className="mt-2 text-sm leading-6 text-rose-700">
                  {lastParsedRowCount && lastParsedRowCount > 0
                    ? `Added ${lastParsedRowCount} row${lastParsedRowCount === 1 ? "" : "s"} successfully. Fix the remaining lines below.`
                    : "Fix these lines and run the parser again."}
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-rose-700">
                  {parseErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            ) : lastParsedRowCount && lastParsedRowCount > 0 ? (
              <div className="mt-4 rounded-[24px] border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Rows added</p>
                <p className="mt-2 text-sm leading-6 text-emerald-800">
                  Added {lastParsedRowCount} parsed row{lastParsedRowCount === 1 ? "" : "s"} to the worksheet.
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-[24px] border border-dashed border-zinc-300 bg-zinc-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Accepted format</p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Combine an optional quantity, a short description, and three dimensions such as 20 panels 5x5x4.
                </p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={handleParseShorthand}
                className="h-11 rounded-2xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Add parsed rows
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShorthandInput("")}
                className="h-11 rounded-2xl border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 hover:border-orange-200 hover:bg-orange-50 hover:text-zinc-950"
              >
                Clear shorthand
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
