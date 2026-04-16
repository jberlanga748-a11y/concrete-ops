"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCustomer, updateCustomer } from "@/lib/db/mutations";

type CustomerFormValues = {
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  billingAddress: string | null;
  notes: string | null;
  status: "active" | "inactive";
};

export function CustomerForm({
  customerId,
  initialValues,
}: {
  customerId?: string;
  initialValues?: CustomerFormValues;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialValues?.name ?? "");
  const [contactName, setContactName] = useState(initialValues?.contactName ?? "");
  const [email, setEmail] = useState(initialValues?.email ?? "");
  const [phone, setPhone] = useState(initialValues?.phone ?? "");
  const [billingAddress, setBillingAddress] = useState(initialValues?.billingAddress ?? "");
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [status, setStatus] = useState<"active" | "inactive">(initialValues?.status ?? "active");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  async function handleSubmit() {
    if (!name.trim()) {
      setMessageType("error");
      setMessage("Customer name is required.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const payload = {
      name,
      contactName,
      email,
      phone,
      billingAddress,
      notes,
      status,
    };

    const result = customerId ? await updateCustomer(customerId, payload) : await createCustomer(payload);

    if (result.error || !result.data) {
      setMessageType("error");
      setMessage(result.error || "Failed to save customer.");
      setLoading(false);
      return;
    }

    setMessageType("success");
    setMessage(customerId ? "Customer updated." : "Customer created.");
    setLoading(false);

    if (customerId) {
      router.refresh();
    } else {
      router.push(`/dashboard/customers/${result.data.id}`);
    }
  }

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm text-zinc-600">Customer name *</p>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl border px-4 py-3" placeholder="Example: Northshore Properties" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm text-zinc-600">Primary contact</p>
            <input value={contactName} onChange={(e) => setContactName(e.target.value)} className="w-full rounded-2xl border px-4 py-3" />
          </div>
          <div>
            <p className="mb-2 text-sm text-zinc-600">Status</p>
            <select value={status} onChange={(e) => setStatus(e.target.value as "active" | "inactive")} className="w-full rounded-2xl border px-4 py-3">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm text-zinc-600">Email</p>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-2xl border px-4 py-3" />
          </div>
          <div>
            <p className="mb-2 text-sm text-zinc-600">Phone</p>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-2xl border px-4 py-3" />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-zinc-600">Billing address</p>
          <textarea value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} className="min-h-24 w-full rounded-2xl border px-4 py-3" />
        </div>

        <div>
          <p className="mb-2 text-sm text-zinc-600">Notes</p>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-28 w-full rounded-2xl border px-4 py-3" />
        </div>

        <button onClick={handleSubmit} disabled={loading} className="rounded-2xl bg-zinc-900 px-5 py-3 text-white disabled:opacity-50">
          {loading ? "Saving..." : customerId ? "Save Customer" : "Create Customer"}
        </button>

        {message ? (
          <p className={`text-sm ${messageType === "error" ? "text-red-600" : messageType === "success" ? "text-green-700" : "text-zinc-600"}`}>{message}</p>
        ) : (
          <p className="text-sm text-zinc-500">Keep customer setup simple now; deeper billing settings can come later.</p>
        )}
      </div>
    </div>
  );
}
