"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createJob, updateJob } from "@/lib/db/mutations";
import type { CustomerOption, EmployeeOption } from "@/lib/db/queries";
import type { JobStatus } from "@/lib/db/schema";
import { StatusChip } from "@/components/ui/feedback";
import { FieldLabel } from "@/components/ui/form";
import { OperationalCard, RecordPreview, SectionHeader } from "@/components/ui/page-primitives";
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

const fieldClassName =
  "w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500";
const textAreaClassName = `${fieldClassName} min-h-28 resize-y`;

const statusDetails: Record<JobStatus, { title: string; detail: string; tone: "neutral" | "success" | "warning" | "info" }> = {
  draft: {
    title: "Draft",
    detail: "Use this while the job is still being assembled.",
    tone: "neutral",
  },
  scheduled: {
    title: "Scheduled",
    detail: "The job is planned and visible to the team.",
    tone: "info",
  },
  in_progress: {
    title: "In progress",
    detail: "Field execution is active.",
    tone: "info",
  },
  on_hold: {
    title: "On hold",
    detail: "Progress is paused but planning context remains visible.",
    tone: "warning",
  },
  completed: {
    title: "Completed",
    detail: "Field work is done.",
    tone: "success",
  },
  archived: {
    title: "Archived",
    detail: "Reference only, outside active operations.",
    tone: "neutral",
  },
};

function FieldHint({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{children}</p>;
}

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

  const statusDetail = statusDetails[status];
  const selectedCustomer = customerOptions.find((customer) => customer.id === customerId)?.label ?? "No customer selected";
  const selectedForeman = employeeOptions.find((employee) => employee.id === foremanEmployeeId)?.label ?? "No foreman assigned";
  const planWindow = startDate || targetFinishDate ? [startDate || "TBD", targetFinishDate || "TBD"].join(" to ") : "Schedule not set";

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
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <OperationalCard className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <SectionHeader
              title={jobId ? "Update job planning" : "New job setup"}
              description="Capture the identity, owner, schedule, and field context the rest of the workflow depends on."
              className="mb-0"
            />
            <StatusChip tone={statusDetail.tone}>{statusDetail.title}</StatusChip>
          </div>
        </OperationalCard>

        <OperationalCard className="p-4">
          <SectionHeader title="Ownership" description="Start with the customer, job identity, and field owner." />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel required>Customer</FieldLabel>
              <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} className={fieldClassName}>
                <option value="">Select customer</option>
                {customerOptions.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.label}
                  </option>
                ))}
              </select>
              <FieldHint>Choose the customer record that anchors this job.</FieldHint>
            </div>

            <div>
              <FieldLabel>Foreman</FieldLabel>
              <select value={foremanEmployeeId} onChange={(event) => setForemanEmployeeId(event.target.value)} className={fieldClassName}>
                <option value="">Select foreman</option>
                {employeeOptions.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.label}
                  </option>
                ))}
              </select>
              <FieldHint>Assign the field owner now or leave it open.</FieldHint>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
            <div>
              <FieldLabel required>Job number</FieldLabel>
              <input value={jobNumber} onChange={(event) => setJobNumber(event.target.value)} className={fieldClassName} placeholder="Example: 24-101" />
            </div>

            <div>
              <FieldLabel required>Job name</FieldLabel>
              <input value={name} onChange={(event) => setName(event.target.value)} className={fieldClassName} placeholder="Example: East Pad Repair" />
            </div>
          </div>
        </OperationalCard>

        <OperationalCard className="p-4">
          <SectionHeader title="Planning" description="Set the operating state and schedule window." />
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <FieldLabel>Status</FieldLabel>
              <select value={status} onChange={(event) => setStatus(event.target.value as JobStatus)} className={fieldClassName}>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
              <FieldHint>{statusDetail.detail}</FieldHint>
            </div>

            <div>
              <FieldLabel>Start date</FieldLabel>
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={fieldClassName} />
            </div>

            <div>
              <FieldLabel>Target finish date</FieldLabel>
              <input type="date" value={targetFinishDate} onChange={(event) => setTargetFinishDate(event.target.value)} className={fieldClassName} />
            </div>
          </div>
        </OperationalCard>

        <OperationalCard className="p-4">
          <SectionHeader title="Field Context" description="Add the site details and work notes the crew needs when they open the job." />
          <div className="space-y-4">
            <div>
              <FieldLabel>Address</FieldLabel>
              <textarea value={address} onChange={(event) => setAddress(event.target.value)} className={textAreaClassName} />
            </div>

            <div>
              <FieldLabel>Description</FieldLabel>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} className={`${textAreaClassName} min-h-36`} />
            </div>
          </div>
        </OperationalCard>

        <OperationalCard className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm font-medium leading-6 text-slate-600">
              Save once the planning record is stable enough for assignments, uploads, and field reporting to build on top of it.
            </p>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-700 px-4 text-sm font-black text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Saving..." : jobId ? "Save job" : "Create job"}
            </button>
          </div>
        </OperationalCard>
      </div>

      <RecordPreview
        title={jobNumber.trim() || name.trim() ? `${jobNumber.trim() || "New job"} ${name.trim()}` : "Job Preview"}
        rows={[
          ["Customer", selectedCustomer],
          ["Foreman", selectedForeman],
          ["Status", statusDetail.title],
          ["Schedule", planWindow],
          ["Address", address.trim() || "No address added"],
        ]}
      />
    </div>
  );
}
