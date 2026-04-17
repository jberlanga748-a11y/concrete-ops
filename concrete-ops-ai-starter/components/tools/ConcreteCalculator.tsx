"use client";

import { useMemo, useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldLabel, FormActions, FormSection } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-6 text-sm text-zinc-600">
      Add a row or paste shorthand entries to start calculating yardage.
    </div>
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

  const totals = useMemo(
    () => calculateConcreteTotals(rows, Number(wastePercent) || 0),
    [rows, wastePercent],
  );

  function updateRow(id: string, patch: Partial<ConcreteCalculatorRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addBlankRow() {
    setRows((current) => [...current, createConcreteCalculatorRow()]);
  }

  function removeRow(id: string) {
    setRows((current) => (current.length === 1 ? [createConcreteCalculatorRow()] : current.filter((row) => row.id !== id)));
  }

  function clearAllRows() {
    setRows([createConcreteCalculatorRow()]);
  }

  function handleParseShorthand() {
    const parsed = parseConcreteShorthandBatch(shorthandInput);
    setParseErrors(parsed.errors);

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

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Field Tool</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">Concrete Calculator</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
          Build row-based pours, apply a waste factor, and keep a deterministic cubic-yard total for office ordering.
          Math is standard volume conversion: <span className="font-medium text-zinc-900">quantity × length × width × depth ÷ 12 ÷ 27</span>.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr,0.8fr]">
        <FormSection
          title="Calculator rows"
          description="Use one row per slab, panel group, footing, or other rectangular pour area."
        >
          <div className="hidden overflow-hidden rounded-[24px] border border-zinc-200 xl:block">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-100/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Length (ft)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Width (ft)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Depth (in)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Yards</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Cubic feet</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {rows.map((row) => {
                  const rowFeet = calculateConcreteRowCubicFeet(row);
                  const rowYards = calculateConcreteRowCubicYards(row);
                  return (
                    <tr key={row.id} className="align-top">
                      <td className="px-4 py-3">
                        <Input
                          value={row.description}
                          onChange={(event) => updateRow(row.id, { description: event.target.value })}
                          placeholder="Example: North slab panels"
                          className="h-10"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={row.quantity}
                          onChange={(event) => updateRow(row.id, { quantity: Number(event.target.value) || 0 })}
                          className="h-10"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.lengthFeet}
                          onChange={(event) => updateRow(row.id, { lengthFeet: Number(event.target.value) || 0 })}
                          className="h-10"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.widthFeet}
                          onChange={(event) => updateRow(row.id, { widthFeet: Number(event.target.value) || 0 })}
                          className="h-10"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min="0"
                          step="0.25"
                          value={row.depthInches}
                          onChange={(event) => updateRow(row.id, { depthInches: Number(event.target.value) || 0 })}
                          className="h-10"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-zinc-900">{formatNumber(rowYards)}</td>
                      <td className="px-4 py-3 text-right text-zinc-600">{formatNumber(rowFeet)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button type="button" variant="outline" size="sm" onClick={() => removeRow(row.id)}>
                          Remove
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 xl:hidden">
            {rows.length === 0 ? <EmptyState /> : null}
            {rows.map((row, index) => {
              const rowFeet = calculateConcreteRowCubicFeet(row);
              const rowYards = calculateConcreteRowCubicYards(row);
              return (
                <Card key={row.id} className="border border-zinc-200 bg-white py-0 ring-0">
                  <CardHeader className="border-b border-zinc-100 py-4">
                    <CardTitle className="text-sm text-zinc-900">Row {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 py-4">
                    <div>
                      <FieldLabel>Description</FieldLabel>
                      <Input
                        value={row.description}
                        onChange={(event) => updateRow(row.id, { description: event.target.value })}
                        placeholder="Example: Main slab"
                        className="h-10"
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
                          className="h-10"
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
                          className="h-10"
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
                          className="h-10"
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
                          className="h-10"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                      <span className="text-sm font-medium text-zinc-700">Row volume</span>
                      <span className="text-sm font-semibold text-zinc-950">
                        {formatNumber(rowFeet)} ft³ / {formatNumber(rowYards)} yd³
                      </span>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => removeRow(row.id)}>
                      Remove row
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <FormActions hint="Use feet for length and width, and inches for depth, so the conversion stays consistent across every row.">
            <Button type="button" onClick={addBlankRow}>
              Add row
            </Button>
            <Button type="button" variant="outline" onClick={clearAllRows}>
              Reset rows
            </Button>
          </FormActions>
        </FormSection>

        <div className="space-y-6">
          <FormSection
            title="Waste factor"
            description="Apply job-specific waste after the subtotal so your final order target is easy to review."
          >
            <div>
              <FieldLabel>Waste percent</FieldLabel>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={wastePercent}
                onChange={(event) => setWastePercent(event.target.value)}
                className="h-10 max-w-[180px]"
              />
            </div>
          </FormSection>

          <Card className="rounded-[28px] border border-zinc-200 bg-white py-0 shadow-[0_14px_34px_rgba(15,23,42,0.06)] ring-0">
            <CardHeader className="border-b border-zinc-100 py-5">
              <CardTitle className="text-lg text-zinc-950">Running total</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 py-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600">Subtotal cubic feet</span>
                <span className="text-sm font-semibold text-zinc-950">{formatNumber(totals.subtotalCubicFeet)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600">Subtotal cubic yards</span>
                <span className="text-sm font-semibold text-zinc-950">{formatNumber(totals.subtotalCubicYards)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600">Waste yards</span>
                <span className="text-sm font-semibold text-zinc-950">{formatNumber(totals.wasteCubicYards)}</span>
              </div>
              <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4">
                <p className="text-sm text-zinc-600">Total with waste</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
                  {formatNumber(totals.totalCubicYards)} yd³
                </p>
              </div>
            </CardContent>
          </Card>

          <FormSection
            title="Shorthand parser"
            description="Paste one line per item to convert common field shorthand into structured rows."
          >
            <div>
              <FieldLabel>Shorthand entries</FieldLabel>
              <textarea
                value={shorthandInput}
                onChange={(event) => setShorthandInput(event.target.value)}
                placeholder={`20 panels 5x5x4\nRamp pour 12x8x6\n2 footings 3ft x 3ft x 18in\n24in x 24in x 4in`}
                className="min-h-32 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-500"
              />
              <p className="mt-2 text-xs leading-5 text-zinc-500">
                Default shorthand assumes <span className="font-medium text-zinc-700">length × width in feet</span> and{" "}
                <span className="font-medium text-zinc-700">depth in inches</span> when units are omitted, so
                <span className="font-medium text-zinc-700"> 5x5x4</span> means 5 ft × 5 ft × 4 in. Explicit inch-based
                length and width entries like <span className="font-medium text-zinc-700">24in x 24in x 4in</span> are converted to feet automatically.
              </p>
              {parseErrors.length > 0 ? (
                <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                  <p className="text-sm font-semibold text-rose-700">Parsing issues</p>
                  <ul className="mt-2 space-y-1 text-sm text-rose-700">
                    {parseErrors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <FormActions hint="Keep one row per line. Leading numbers are treated as quantity when they appear before the description.">
              <Button type="button" onClick={handleParseShorthand}>
                Add parsed rows
              </Button>
              <Button type="button" variant="outline" onClick={() => setShorthandInput("")}>
                Clear shorthand
              </Button>
            </FormActions>
          </FormSection>
        </div>
      </section>
    </div>
  );
}
