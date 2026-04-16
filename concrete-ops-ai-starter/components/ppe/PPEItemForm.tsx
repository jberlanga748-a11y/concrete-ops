"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPPEItem, updatePPEItem } from "@/lib/db/mutations";
import type { PPEItemStatus } from "@/lib/db/schema";
import type { EmployeeOption, PPEDetailRow } from "@/lib/db/queries";

export function PPEItemForm({
  employeeOptions,
  item,
}: {
  employeeOptions: EmployeeOption[];
  item?: PPEDetailRow | null;
}) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState(item?.employee_id ?? "");
  const [itemName, setItemName] = useState(item?.item_name ?? "");
  const [status, setStatus] = useState<PPEItemStatus>(item?.status ?? "issued");
  const [fitNotes, setFitNotes] = useState(item?.fit_notes ?? "");
  const [issuedAt, setIssuedAt] = useState(item?.issued_at ?? "");
  const [replacementDueAt, setReplacementDueAt] = useState(item?.replacement_due_at ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  async function handleSubmit() {
    if (!employeeId || !itemName.trim()) {
      setMessageType("error");
      setMessage("Employee and item name are required.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const result = item
      ? await updatePPEItem(item.id, {
          employeeId,
          itemName,
          status: status as "issued" | "needs_replacement" | "pending_fit_check",
          fitNotes,
          issuedAt,
          replacementDueAt,
        })
      : await createPPEItem({
          employeeId,
          itemName,
          status: status as "issued" | "needs_replacement" | "pending_fit_check",
          fitNotes,
          issuedAt,
          replacementDueAt,
        });

    if (result.error || !result.data) {
      setMessageType("error");
      setMessage(result.error || "Failed to save PPE item.");
      setLoading(false);
      return;
    }

    setMessageType("success");
    setMessage(item ? "PPE item updated." : "PPE item created.");
    setLoading(false);
    router.push(`/dashboard/ppe/${result.data.id}`);
    router.refresh();
  }

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm text-zinc-600">Employee *</p>
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full rounded-2xl border px-4 py-3">
              <option value="">Select employee</option>
              {employeeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-2 text-sm text-zinc-600">Item name *</p>
            <input value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full rounded-2xl border px-4 py-3" placeholder="Hard hat, safety vest, respirator, gloves" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="mb-2 text-sm text-zinc-600">Status *</p>
            <select value={status} onChange={(e) => setStatus(e.target.value as PPEItemStatus)} className="w-full rounded-2xl border px-4 py-3">
              <option value="issued">Issued</option>
              <option value="needs_replacement">Needs Replacement</option>
              <option value="pending_fit_check">Pending Fit Check</option>
            </select>
          </div>
          <div>
            <p className="mb-2 text-sm text-zinc-600">Issued at</p>
            <input type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} className="w-full rounded-2xl border px-4 py-3" />
          </div>
          <div>
            <p className="mb-2 text-sm text-zinc-600">Replacement due</p>
            <input type="date" value={replacementDueAt} onChange={(e) => setReplacementDueAt(e.target.value)} className="w-full rounded-2xl border px-4 py-3" />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-zinc-600">Fit notes</p>
          <textarea value={fitNotes} onChange={(e) => setFitNotes(e.target.value)} className="min-h-28 w-full rounded-2xl border px-4 py-3" placeholder="Optional fit details, size notes, training reminder, or follow-up" />
        </div>

        <button onClick={handleSubmit} disabled={loading} className="rounded-2xl bg-zinc-900 px-5 py-3 text-white disabled:opacity-50">
          {loading ? "Saving..." : item ? "Save PPE Item" : "Create PPE Item"}
        </button>

        {message ? (
          <p className={`text-sm ${messageType === "error" ? "text-red-600" : messageType === "success" ? "text-green-700" : "text-zinc-600"}`}>{message}</p>
        ) : (
          <p className="text-sm text-zinc-500">Use short, practical notes so replacement and fit-check follow-up is obvious in the field.</p>
        )}
      </div>
    </div>
  );
}
