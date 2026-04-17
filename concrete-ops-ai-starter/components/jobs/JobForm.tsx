"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJob, updateJob } from "@/lib/db/mutations";
import type { CustomerOption, EmployeeOption } from "@/lib/db/queries";
import type { JobStatus } from "@/lib/db/schema";
import { FieldLabel, FormActions, FormSection } from "@/components/ui/form";
import { useToast } from "@/components/ui/ToastProvider";

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

const statusOptions: JobStatus[] = ["draft", "scheduled", "in_progress", "on_hold", "completed", "archived"];

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
  const { pushToast } = useToast();
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

  async function handleSubmit() {
    if (!customerId || !jobNumber.trim() || !name.trim()) {
      pushToast({
        tone: "error",
        title: "Job details are incomplete",
        description: "Customer, job number, and job name are required before saving.",
      });
      return;
    }

    setLoading(true);

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
      pushToast({
        tone: "error",
        title: "Job not saved",
        description: "We couldn’t save that job right now. Try again in a moment.",
      });
      setLoading(false);
      return;
    }

    pushToast({
      tone: "success",
      title: jobId ? "Job updated" : "Job created",
      description: jobId ? "The Job Hub reflects the latest planning details." : "The new job is ready for assignments, uploads, and reporting.",
    });
    setLoading(false);

    if (jobId) {
      router.push(`/dashboard/jobs/${jobId}`);
      router.refresh();
    } else {
      router.push(`/dashboard/jobs/${result.data.id}`);
    }
  }

  return (
    <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
      <div className="space-y-4">
        <FormSection title="Planning details" description="Set the core job details that shape scheduling, assignments, and field reporting.">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel required>Customer</FieldLabel>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full rounded-2xl border border-zinc-300 px-4 py-3">
                <option value="">Select customer</option>
                {customerOptions.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Foreman</FieldLabel>
              <select value={foremanEmployeeId} onChange={(e) => setForemanEmployeeId(e.target.value)} className="w-full rounded-2xl border border-zinc-300 px-4 py-3">
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
              <FieldLabel required>Job number</FieldLabel>
              <input value={jobNumber} onChange={(e) => setJobNumber(e.target.value)} className="w-full rounded-2xl border border-zinc-300 px-4 py-3" placeholder="Example: 24-101" />
            </div>
            <div>
              <FieldLabel required>Job name</FieldLabel>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl border border-zinc-300 px-4 py-3" placeholder="Example: East Pad Repair" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <FieldLabel>Status</FieldLabel>
              <select value={status} onChange={(e) => setStatus(e.target.value as JobStatus)} className="w-full rounded-2xl border border-zinc-300 px-4 py-3">
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Start date</FieldLabel>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-2xl border border-zinc-300 px-4 py-3" />
            </div>
            <div>
              <FieldLabel>Target finish date</FieldLabel>
              <input type="date" value={targetFinishDate} onChange={(e) => setTargetFinishDate(e.target.value)} className="w-full rounded-2xl border border-zinc-300 px-4 py-3" />
            </div>
          </div>
        </FormSection>

        <FormSection title="Field context" description="Give the team the site address and project notes they need when they open the Job Hub.">
          <div>
            <FieldLabel>Address</FieldLabel>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="min-h-24 w-full rounded-2xl border border-zinc-300 px-4 py-3" />
          </div>

          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-32 w-full rounded-2xl border border-zinc-300 px-4 py-3" />
          </div>
        </FormSection>

        <FormActions hint="Keep setup focused on scheduling, ownership, and jobsite context. The Job Hub handles the day-to-day field workflow after that.">
          <button onClick={handleSubmit} disabled={loading} className="rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {loading ? "Saving..." : jobId ? "Save Job" : "Create Job"}
          </button>
        </FormActions>
      </div>
    </div>
  );
}
