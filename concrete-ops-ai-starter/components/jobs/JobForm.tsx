"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJob, updateJob } from "@/lib/db/mutations";
import type { CustomerOption, EmployeeOption } from "@/lib/db/queries";
import type { JobStatus } from "@/lib/db/schema";
import { StatusChip } from "@/components/ui/feedback";
import { FieldLabel } from "@/components/ui/form";
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
  "w-full rounded-[20px] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-[0_8px_22px_rgba(15,23,42,0.04)] outline-none transition placeholder:text-zinc-400 focus:border-[#93c5fd] focus:ring-2 focus:ring-[#dbeafe]";
const textAreaClassName = `${fieldClassName} min-h-28 resize-y`;

const statusDetails: Record<JobStatus, { title: string; detail: string; tone: "neutral" | "success" | "warning" | "info" }> = {
  draft: {
    title: "Draft",
    detail: "Use this while the job is still being assembled or waiting on final scheduling details.",
    tone: "neutral",
  },
  scheduled: {
    title: "Scheduled",
    detail: "The job is planned and visible to the team, but active field execution has not started yet.",
    tone: "info",
  },
  in_progress: {
    title: "In progress",
    detail: "Use this once field execution is active and the record should reflect live jobsite work.",
    tone: "info",
  },
  on_hold: {
    title: "On hold",
    detail: "Pause active progress without losing the planning context or ownership already captured here.",
    tone: "warning",
  },
  completed: {
    title: "Completed",
    detail: "The field work is done and the job should read as closed out operationally.",
    tone: "success",
  },
  archived: {
    title: "Archived",
    detail: "Keep the record for reference while removing it from active operational focus.",
    tone: "neutral",
  },
};

function FormCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-zinc-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,248,249,0.92))] p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-6">
      <div>
        <p className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">{eyebrow}</p>
        <h2 className="mt-3 text-[1.35rem] font-semibold tracking-[-0.04em] text-[#101828]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
      </div>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function FieldHint({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-xs leading-5 text-zinc-500">{children}</p>;
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
  const selectedCustomer = customerOptions.find((customer) => customer.id === customerId)?.label ?? "No customer selected yet";
  const selectedForeman = employeeOptions.find((employee) => employee.id === foremanEmployeeId)?.label ?? "No foreman assigned";
  const planWindow = startDate || targetFinishDate ? [startDate || "TBD", targetFinishDate || "TBD"].join(" → ") : "Schedule not set";

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
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),320px] xl:items-start">
        <div className="space-y-6">
          <section className="rounded-[30px] border border-zinc-200/80 bg-white p-6 shadow-[0_20px_48px_rgba(15,23,42,0.08)] sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <p className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                  {jobId ? "Update job planning" : "New job setup"}
                </p>
                <h2 className="mt-3 text-[1.6rem] font-semibold tracking-[-0.05em] text-[#101828]">
                  Shape the record crews and office staff will rely on every day.
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  Keep this setup focused on ownership, schedule, and field context. The rest of the day-to-day workflow continues inside the Job Hub.
                </p>
              </div>
              <StatusChip tone={statusDetail.tone}>{statusDetail.title}</StatusChip>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-[22px] border border-zinc-200 bg-zinc-50/80 px-4 py-4">
                <p className="font-app-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Customer</p>
                <p className="mt-2 text-sm font-semibold text-zinc-950">{selectedCustomer}</p>
              </div>
              <div className="rounded-[22px] border border-zinc-200 bg-zinc-50/80 px-4 py-4">
                <p className="font-app-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Foreman</p>
                <p className="mt-2 text-sm font-semibold text-zinc-950">{selectedForeman}</p>
              </div>
              <div className="rounded-[22px] border border-zinc-200 bg-zinc-50/80 px-4 py-4">
                <p className="font-app-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Schedule</p>
                <p className="mt-2 text-sm font-semibold text-zinc-950">{planWindow}</p>
              </div>
            </div>
          </section>

          <FormCard
            eyebrow="Ownership"
            title="Project ownership and identity"
            description="Start with the record the office and field teams will recognize immediately."
          >
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
                <FieldHint>Choose the customer record that should anchor this job’s documents and reporting.</FieldHint>
              </div>

              <div>
                <FieldLabel>Foreman</FieldLabel>
                <select value={foremanEmployeeId} onChange={(e) => setForemanEmployeeId(e.target.value)} className={fieldClassName}>
                  <option value="">Select foreman</option>
                  {employeeOptions.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.label}
                    </option>
                  ))}
                </select>
                <FieldHint>Assign the field owner now or leave it open until staffing is finalized.</FieldHint>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[0.9fr,1.1fr]">
              <div>
                <FieldLabel required>Job number</FieldLabel>
                <input
                  value={jobNumber}
                  onChange={(e) => setJobNumber(e.target.value)}
                  className={fieldClassName}
                  placeholder="Example: 24-101"
                />
                <FieldHint>Use the identifier crews, office staff, and customers will consistently reference.</FieldHint>
              </div>

              <div>
                <FieldLabel required>Job name</FieldLabel>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={fieldClassName}
                  placeholder="Example: East Pad Repair"
                />
                <FieldHint>Name the scope plainly so the job reads clearly in lists, reports, and uploads.</FieldHint>
              </div>
            </div>
          </FormCard>

          <FormCard
            eyebrow="Planning"
            title="Status and schedule"
            description="Capture the operating state the rest of the workflow should assume."
          >
            <div className="grid gap-4 lg:grid-cols-[0.95fr,1.05fr,1.05fr]">
              <div>
                <FieldLabel>Status</FieldLabel>
                <select value={status} onChange={(e) => setStatus(e.target.value as JobStatus)} className={fieldClassName}>
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
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={fieldClassName} />
                <FieldHint>Use the expected field start if the exact date is already known.</FieldHint>
              </div>

              <div>
                <FieldLabel>Target finish date</FieldLabel>
                <input type="date" value={targetFinishDate} onChange={(e) => setTargetFinishDate(e.target.value)} className={fieldClassName} />
                <FieldHint>Keep this date current so office follow-up and site expectations stay aligned.</FieldHint>
              </div>
            </div>
          </FormCard>

          <FormCard
            eyebrow="Field context"
            title="Jobsite address and notes"
            description="Give the crew and office enough context to understand where the work is happening and what matters most."
          >
            <div>
              <FieldLabel>Address</FieldLabel>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} className={textAreaClassName} />
              <FieldHint>Use the full jobsite location or access notes the team needs on first open.</FieldHint>
            </div>

            <div>
              <FieldLabel>Description</FieldLabel>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${textAreaClassName} min-h-36`} />
              <FieldHint>Summarize the scope, special conditions, or planning notes that should stay visible in the Job Hub.</FieldHint>
            </div>
          </FormCard>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6">
          <section className="rounded-[28px] border border-[#18232d] bg-[#0f1820] p-5 text-zinc-100 shadow-[0_20px_48px_rgba(15,23,42,0.18)] sm:p-6">
            <p className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">Live summary</p>
            <h3 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-white">
              {jobNumber.trim() || "New job"} {name.trim() ? `· ${name.trim()}` : ""}
            </h3>
            <p className="mt-3 text-sm leading-6 text-zinc-300">{description.trim() || "Add a short scope summary so the job reads clearly once the team lands in the Job Hub."}</p>

            <div className="mt-5 space-y-3">
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Customer</p>
                <p className="mt-2 text-sm font-semibold text-white">{selectedCustomer}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Foreman</p>
                <p className="mt-2 text-sm font-semibold text-white">{selectedForeman}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Address</p>
                <p className="mt-2 text-sm font-semibold text-white">{address.trim() || "No address added yet"}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <p className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">Before you save</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-600">
              <li className="rounded-[20px] border border-zinc-200 bg-zinc-50/80 px-4 py-3">Confirm the customer, job number, and job name match the record the team will use daily.</li>
              <li className="rounded-[20px] border border-zinc-200 bg-zinc-50/80 px-4 py-3">Set the most accurate planning status so the board reflects where this job really stands.</li>
              <li className="rounded-[20px] border border-zinc-200 bg-zinc-50/80 px-4 py-3">Add enough address and scope context that crews do not need to guess after the job is created.</li>
            </ul>
          </section>
        </aside>
      </div>

      <div className="rounded-[28px] border border-zinc-200 bg-white px-5 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-2xl text-sm leading-6 text-zinc-600">
            Save once the planning record is stable enough for the rest of the workflow to build on top of it. Assignments, uploads, and field reporting will continue inside the Job Hub.
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-[22px] bg-[#101828] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1b2432] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Saving..." : jobId ? "Save job" : "Create job"}
          </button>
        </div>
      </div>
    </div>
  );
}
