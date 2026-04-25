"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FieldLabel } from "@/components/ui/form";
import { OperationalCard, SectionHeader } from "@/components/ui/page-primitives";
import { createEstimate, updateEstimate } from "@/lib/db/mutations";
import type { CustomerOption, EstimateDetailRow, EstimateLineItemRow, TimeOption } from "@/lib/db/queries";
import type { EstimateLineItemType, EstimateStatus } from "@/lib/db/schema";

type EstimateLineItemFormRow = {
  itemType: EstimateLineItemType;
  description: string;
  quantity: string;
  unit: string;
  unitCost: string;
};

const fieldClassName =
  "w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500";
const compactFieldClassName =
  "w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500";
const secondaryButtonClassName =
  "inline-flex items-center justify-center rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-blue-50";

function buildInitialLineItems(lineItems?: EstimateLineItemRow[]) {
  if (!lineItems?.length) {
    return [
      { itemType: "labor" as EstimateLineItemType, description: "", quantity: "1", unit: "hrs", unitCost: "0" },
    ];
  }

  return lineItems.map((item) => ({
    itemType: item.item_type,
    description: item.description,
    quantity: String(item.quantity),
    unit: item.unit || "",
    unitCost: String(item.unit_cost),
  }));
}

export function EstimateForm({
  estimate,
  lineItems,
  customerOptions,
  jobOptions,
}: {
  estimate?: EstimateDetailRow | null;
  lineItems?: EstimateLineItemRow[];
  customerOptions: CustomerOption[];
  jobOptions: TimeOption[];
}) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState(estimate?.customer_id ?? "");
  const [jobId, setJobId] = useState(estimate?.job_id ?? "");
  const [title, setTitle] = useState(estimate?.title ?? "");
  const [status, setStatus] = useState<EstimateStatus>(estimate?.status ?? "draft");
  const [notes, setNotes] = useState(estimate?.notes ?? "");
  const [rows, setRows] = useState<EstimateLineItemFormRow[]>(buildInitialLineItems(lineItems));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  const subtotal = useMemo(
    () =>
      Number(
        rows
          .reduce((sum, row) => sum + (Number(row.quantity) || 0) * (Number(row.unitCost) || 0), 0)
          .toFixed(2),
      ),
    [rows],
  );

  function updateRow(index: number, patch: Partial<EstimateLineItemFormRow>) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  function addRow(itemType: EstimateLineItemType = "other") {
    setRows((current) => [...current, { itemType, description: "", quantity: "1", unit: "", unitCost: "0" }]);
  }

  function removeRow(index: number) {
    setRows((current) => (current.length === 1 ? current : current.filter((_, rowIndex) => rowIndex !== index)));
  }

  async function handleSubmit() {
    if (!customerId || !title.trim()) {
      setMessageType("error");
      setMessage("Customer and estimate title are required.");
      return;
    }

    const validRows = rows.filter((row) => row.description.trim());
    if (validRows.length === 0) {
      setMessageType("error");
      setMessage("Add at least one line item.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const payload = {
      customerId,
      jobId: jobId || undefined,
      title,
      status,
      notes,
      lineItems: validRows.map((row) => ({
        itemType: row.itemType,
        description: row.description,
        quantity: Number(row.quantity) || 0,
        unit: row.unit || undefined,
        unitCost: Number(row.unitCost) || 0,
      })),
    };

    const result = estimate?.id ? await updateEstimate(estimate.id, payload) : await createEstimate(payload);

    if (result.error || !result.data) {
      setMessageType("error");
      setMessage(result.error || "Failed to save estimate.");
      setLoading(false);
      return;
    }

    setMessageType("success");
    setMessage(estimate?.id ? "Estimate updated." : "Estimate created.");
    setLoading(false);
    router.push(`/dashboard/estimates/${result.data.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <OperationalCard className="p-4">
        <SectionHeader
          title="Estimate basics"
          description="Set the customer, linked job, status, and scope notes before pricing line items."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel required>Customer</FieldLabel>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={fieldClassName}>
              <option value="">Select customer</option>
              {customerOptions.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>Linked job</FieldLabel>
            <select value={jobId} onChange={(e) => setJobId(e.target.value)} className={fieldClassName}>
              <option value="">Select job</option>
              {jobOptions.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel required>Estimate title</FieldLabel>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClassName} placeholder="Example: South Pad Demo and Re-Pour" />
          </div>
          <div>
            <FieldLabel>Status</FieldLabel>
            <select value={status} onChange={(e) => setStatus(e.target.value as EstimateStatus)} className={fieldClassName}>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <FieldLabel>Notes</FieldLabel>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={`${fieldClassName} min-h-28 resize-y`} placeholder="Scope assumptions, schedule notes, exclusions, or clarifying details" />
        </div>
      </OperationalCard>

      <OperationalCard className="p-4">
        <SectionHeader
          title="Line Items"
          description="Use labor, material, equipment, or other rows to build the estimate subtotal."
          action={
          <div className="flex gap-2">
            <button type="button" onClick={() => addRow("labor")} className={secondaryButtonClassName}>Add Labor</button>
            <button type="button" onClick={() => addRow("material")} className={secondaryButtonClassName}>Add Material</button>
            <button type="button" onClick={() => addRow("equipment")} className={secondaryButtonClassName}>Add Equipment</button>
          </div>
          }
        />

        <div className="mt-4 space-y-3">
          {rows.map((row, index) => {
            const lineTotal = Number(((Number(row.quantity) || 0) * (Number(row.unitCost) || 0)).toFixed(2));
            return (
              <div key={index} className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <div className="grid gap-3 md:grid-cols-6">
                  <div>
                    <FieldLabel>Type</FieldLabel>
                    <select value={row.itemType} onChange={(e) => updateRow(index, { itemType: e.target.value as EstimateLineItemType })} className={compactFieldClassName}>
                      <option value="labor">Labor</option>
                      <option value="material">Material</option>
                      <option value="equipment">Equipment</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <FieldLabel>Description</FieldLabel>
                    <input value={row.description} onChange={(e) => updateRow(index, { description: e.target.value })} className={compactFieldClassName} placeholder="Crew hours, rebar, skid steer, etc." />
                  </div>
                  <div>
                    <FieldLabel>Qty</FieldLabel>
                    <input type="number" min="0" step="0.01" value={row.quantity} onChange={(e) => updateRow(index, { quantity: e.target.value })} className={compactFieldClassName} />
                  </div>
                  <div>
                    <FieldLabel>Unit</FieldLabel>
                    <input value={row.unit} onChange={(e) => updateRow(index, { unit: e.target.value })} className={compactFieldClassName} placeholder="hrs, ea, days" />
                  </div>
                  <div>
                    <FieldLabel>Unit Cost</FieldLabel>
                    <input type="number" min="0" step="0.01" value={row.unitCost} onChange={(e) => updateRow(index, { unitCost: e.target.value })} className={compactFieldClassName} />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-700">Line total: {lineTotal.toFixed(2)}</p>
                  <button type="button" onClick={() => removeRow(index)} className={secondaryButtonClassName}>
                    Remove Row
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Subtotal</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{subtotal.toFixed(2)}</p>
        </div>
      </OperationalCard>

      <div className="rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-sm shadow-blue-950/5">
        <button type="button" onClick={handleSubmit} disabled={loading} className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800 disabled:opacity-50">
          {loading ? "Saving..." : estimate?.id ? "Save Estimate" : "Create Estimate"}
        </button>

        {message ? (
          <p className={`mt-3 text-sm font-bold ${messageType === "error" ? "text-red-600" : messageType === "success" ? "text-emerald-700" : "text-slate-600"}`}>{message}</p>
        ) : (
          <p className="mt-3 text-sm font-medium text-slate-500">Keep line items readable for field and office teams reviewing labor, material, and equipment scope.</p>
        )}
      </div>
    </div>
  );
}
