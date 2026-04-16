"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm text-zinc-600">Customer *</p>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full rounded-2xl border px-4 py-3">
              <option value="">Select customer</option>
              {customerOptions.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-2 text-sm text-zinc-600">Linked job</p>
            <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="w-full rounded-2xl border px-4 py-3">
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
            <p className="mb-2 text-sm text-zinc-600">Estimate title *</p>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-2xl border px-4 py-3" placeholder="Example: South Pad Demo and Re-Pour" />
          </div>
          <div>
            <p className="mb-2 text-sm text-zinc-600">Status</p>
            <select value={status} onChange={(e) => setStatus(e.target.value as EstimateStatus)} className="w-full rounded-2xl border px-4 py-3">
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-sm text-zinc-600">Notes</p>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-28 w-full rounded-2xl border px-4 py-3" placeholder="Scope assumptions, schedule notes, exclusions, or clarifying details" />
        </div>
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Line Items</h2>
            <p className="mt-1 text-sm text-zinc-600">Use labor, material, equipment, or other rows to build the estimate subtotal.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => addRow("labor")} className="rounded-xl border px-3 py-2 text-sm">Add Labor</button>
            <button onClick={() => addRow("material")} className="rounded-xl border px-3 py-2 text-sm">Add Material</button>
            <button onClick={() => addRow("equipment")} className="rounded-xl border px-3 py-2 text-sm">Add Equipment</button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {rows.map((row, index) => {
            const lineTotal = Number(((Number(row.quantity) || 0) * (Number(row.unitCost) || 0)).toFixed(2));
            return (
              <div key={index} className="rounded-2xl border p-4">
                <div className="grid gap-3 md:grid-cols-6">
                  <div>
                    <p className="mb-2 text-xs text-zinc-500">Type</p>
                    <select value={row.itemType} onChange={(e) => updateRow(index, { itemType: e.target.value as EstimateLineItemType })} className="w-full rounded-xl border px-3 py-2 text-sm">
                      <option value="labor">Labor</option>
                      <option value="material">Material</option>
                      <option value="equipment">Equipment</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <p className="mb-2 text-xs text-zinc-500">Description</p>
                    <input value={row.description} onChange={(e) => updateRow(index, { description: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Crew hours, rebar, skid steer, etc." />
                  </div>
                  <div>
                    <p className="mb-2 text-xs text-zinc-500">Qty</p>
                    <input type="number" min="0" step="0.01" value={row.quantity} onChange={(e) => updateRow(index, { quantity: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <p className="mb-2 text-xs text-zinc-500">Unit</p>
                    <input value={row.unit} onChange={(e) => updateRow(index, { unit: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="hrs, ea, days" />
                  </div>
                  <div>
                    <p className="mb-2 text-xs text-zinc-500">Unit Cost</p>
                    <input type="number" min="0" step="0.01" value={row.unitCost} onChange={(e) => updateRow(index, { unitCost: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-sm text-zinc-600">Line total: {lineTotal.toFixed(2)}</p>
                  <button onClick={() => removeRow(index)} className="rounded-xl border px-3 py-2 text-sm">
                    Remove Row
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl border bg-zinc-50 p-4">
          <p className="text-sm text-zinc-600">Subtotal</p>
          <p className="mt-1 text-2xl font-semibold">{subtotal.toFixed(2)}</p>
        </div>
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <button onClick={handleSubmit} disabled={loading} className="rounded-2xl bg-zinc-900 px-5 py-3 text-white disabled:opacity-50">
          {loading ? "Saving..." : estimate?.id ? "Save Estimate" : "Create Estimate"}
        </button>

        {message ? (
          <p className={`mt-3 text-sm ${messageType === "error" ? "text-red-600" : messageType === "success" ? "text-green-700" : "text-zinc-600"}`}>{message}</p>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">Keep line items readable for field and office teams reviewing labor, material, and equipment scope.</p>
        )}
      </div>
    </div>
  );
}
