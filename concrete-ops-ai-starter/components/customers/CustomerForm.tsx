"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCustomer, updateCustomer } from "@/lib/db/mutations";
import { FieldLabel, FormActions, FormSection } from "@/components/ui/form";
import { useToast } from "@/components/ui/ToastProvider";

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
  const { pushToast } = useToast();
  const [name, setName] = useState(initialValues?.name ?? "");
  const [contactName, setContactName] = useState(initialValues?.contactName ?? "");
  const [email, setEmail] = useState(initialValues?.email ?? "");
  const [phone, setPhone] = useState(initialValues?.phone ?? "");
  const [billingAddress, setBillingAddress] = useState(initialValues?.billingAddress ?? "");
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [status, setStatus] = useState<"active" | "inactive">(initialValues?.status ?? "active");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) {
      pushToast({
        tone: "error",
        title: "Customer name is required",
        description: "Add the customer name before saving this record.",
      });
      return;
    }

    setLoading(true);

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
      pushToast({
        tone: "error",
        title: "Customer not saved",
        description: "We couldn’t save that customer right now. Try again in a moment.",
      });
      setLoading(false);
      return;
    }

    pushToast({
      tone: "success",
      title: customerId ? "Customer updated" : "Customer created",
      description: customerId ? "The customer record is updated." : "The new customer is ready for jobs and office workflows.",
    });
    setLoading(false);

    if (customerId) {
      router.refresh();
    } else {
      router.push(`/dashboard/customers/${result.data.id}`);
    }
  }

  return (
    <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
      <div className="space-y-4">
        <FormSection title="Customer details" description="Keep customer setup simple, readable, and useful for the teams that work with it daily.">
          <div>
            <FieldLabel required>Customer name</FieldLabel>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl border border-zinc-300 px-4 py-3" placeholder="Example: Northshore Properties" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Primary contact</FieldLabel>
              <input value={contactName} onChange={(e) => setContactName(e.target.value)} className="w-full rounded-2xl border border-zinc-300 px-4 py-3" />
            </div>
            <div>
              <FieldLabel>Status</FieldLabel>
              <select value={status} onChange={(e) => setStatus(e.target.value as "active" | "inactive")} className="w-full rounded-2xl border border-zinc-300 px-4 py-3">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Email</FieldLabel>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-2xl border border-zinc-300 px-4 py-3" />
            </div>
            <div>
              <FieldLabel>Phone</FieldLabel>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-2xl border border-zinc-300 px-4 py-3" />
            </div>
          </div>

          <div>
            <FieldLabel>Billing address</FieldLabel>
            <textarea value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} className="min-h-24 w-full rounded-2xl border border-zinc-300 px-4 py-3" />
          </div>

          <div>
            <FieldLabel>Notes</FieldLabel>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-28 w-full rounded-2xl border border-zinc-300 px-4 py-3" />
          </div>
        </FormSection>

        <FormActions hint="Keep customer setup practical for now. Deeper billing workflows can layer on later without changing this core record.">
          <button onClick={handleSubmit} disabled={loading} className="rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {loading ? "Saving..." : customerId ? "Save Customer" : "Create Customer"}
          </button>
        </FormActions>
      </div>
    </div>
  );
}
