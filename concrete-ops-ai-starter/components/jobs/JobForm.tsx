"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJob, updateJob } from "@/lib/db/mutations";
import type { CustomerOption, EmployeeOption } from "@/lib/db/queries";
import type { JobStatus } from "@/lib/db/schema";

type JobFormValues = {
  customerId: string;
  jobNumber: string;
  name: string;
  foremanEmployeeId: string | null;
  status: JobStatus;
  startDate: string | null;
  targetFinishDate: string | null;
  address: string | null;
  description: string | null;
};

const statusOptions: JobStatus[] = [
  "draft",
  "scheduled",
  "in_progress",
  "on_hold",
  "completed",
  "archived",
];

export function JobForm({
  jobId,
  initialValues,
  customerOptions,
  employeeOptions,
}: {
  jobId?: string;
  initialValues?: JobFormValues;
  customerOptions: CustomerOption[];
  employeeOptions: EmployeeOption[];
}) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState(initialValues?.customerId ?? "");
  const [jobNumber, setJobNumber] = useState(initialValues?.jobNumber ?? "");
  const [name, setName] = useState(initialValues?.name ?? "");
  const [foremanEmployeeId, setForemanEmployeeId] = useState(initialValues?.foremanEmployeeId ?? "");
  const [status, setStatus] = useState<JobStatus>(initialValues?.status ?? "scheduled");
  const [startDate, setStartDate] = useState(initialValues?.startDate ?? "");
  const [targetFinishDate, setTargetFinishDate] = useState(initialValues?.targetFinishDate ?? "");
  const [address, setAddress] = useState(initialValues?.address ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  async function handleSubmit() {
    if (!customerId || !jobNumber.trim() || !name.trim()) {
      setMessageType("error");
      setMessage("Customer, job number, and name are required.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const payload = {
      customerId,
      jobNumber,
      name,
      foremanEmployeeId: foremanEmployeeId || undefined,
      status,
      startDate: startDate || undefined,
      targetFinishDate: targetFinishDate || undefined,
      address,
      description,
    };

    const result = jobId ? await updateJob(jobId, payload) : await createJob(payload);

    if (result.error || !result.data) {
      setMessageType("error");
      setMessage(result.error || "Failed to save job.");
      setLoading(false);
      return;
    }

    setMessageType("success");
    setMessage(jobId ? "Job updated." : "Job created.");
    setLoading(false);

    if (jobId) {
      router.push(`/dashboard/jobs/${jobId}`);
      router.refresh();
    } else {
      router.push(`/dashboard/jobs/${result.data.id}`);
    }
  }

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="space-y-4">
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
            <p className="mb-2 text-sm text-zinc-600">Foreman</p>
            <select value={foremanEmployeeId} onChange={(e) => setForemanEmployeeId(e.target.value)} className="w-full rounded-2xl border px-4 py-3">
              <option value="">Select foreman</option>
              {employeeOptions.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm text-zinc-600">Job number *</p>
            <input value={jobNumber} onChange={(e) => setJobNumber(e.target.value)} className="w-full rounded-2xl border px-4 py-3" placeholder="Example: 24-101" />
          </div>
          <div>
            <p className="mb-2 text-sm text-zinc-600">Job name *</p>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl border px-4 py-3" placeholder="Example: East Pad Repair" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="mb-2 text-sm text-zinc-600">Status</p>
            <select value={status} onChange={(e) => setStatus(e.target.value as JobStatus)} className="w-full rounded-2xl border px-4 py-3">
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-2 text-sm text-zinc-600">Start date</p>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-2xl border px-4 py-3" />
          </div>
          <div>
            <p className="mb-2 text-sm text-zinc-600">Target finish date</p>
            <input type="date" value={targetFinishDate} onChange={(e) => setTargetFinishDate(e.target.value)} className="w-full rounded-2xl border px-4 py-3" />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-zinc-600">Address</p>
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="min-h-24 w-full rounded-2xl border px-4 py-3" />
        </div>

        <div>
          <p className="mb-2 text-sm text-zinc-600">Description</p>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-32 w-full rounded-2xl border px-4 py-3" />
        </div>

        <button onClick={handleSubmit} disabled={loading} className="rounded-2xl bg-zinc-900 px-5 py-3 text-white disabled:opacity-50">
          {loading ? "Saving..." : jobId ? "Save Job" : "Create Job"}
        </button>

        {message ? (
          <p className={`text-sm ${messageType === "error" ? "text-red-600" : messageType === "success" ? "text-green-700" : "text-zinc-600"}`}>{message}</p>
        ) : (
          <p className="text-sm text-zinc-500">Keep job setup focused on field operations and scheduling details.</p>
        )}
      </div>
    </div>
  );
}
