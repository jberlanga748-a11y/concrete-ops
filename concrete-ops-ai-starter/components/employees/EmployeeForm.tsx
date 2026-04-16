"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEmployee, updateEmployee } from "@/lib/db/mutations";
import { useToast } from "@/components/ui/ToastProvider";
import {
  InlineNotice,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  selectClassName,
  surfaceClassName,
} from "@/components/ui/primitives";

type EmployeeFormValues = {
  fullName: string;
  phone: string | null;
  email: string | null;
  crewName: string | null;
  jobTitle: string | null;
  hireDate: string | null;
  isActive: boolean;
};

export function EmployeeForm({
  employeeId,
  initialValues,
}: {
  employeeId?: string;
  initialValues?: EmployeeFormValues;
}) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [fullName, setFullName] = useState(initialValues?.fullName ?? "");
  const [phone, setPhone] = useState(initialValues?.phone ?? "");
  const [email, setEmail] = useState(initialValues?.email ?? "");
  const [crewName, setCrewName] = useState(initialValues?.crewName ?? "");
  const [jobTitle, setJobTitle] = useState(initialValues?.jobTitle ?? "");
  const [hireDate, setHireDate] = useState(initialValues?.hireDate ?? "");
  const [isActive, setIsActive] = useState(initialValues?.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  async function handleSubmit() {
    if (!fullName.trim()) {
      setMessageType("error");
      setMessage("Employee name is required.");
      pushToast({ tone: "error", title: "Employee name is required." });
      return;
    }

    setLoading(true);
    setMessage(null);

    const payload = {
      fullName,
      phone,
      email,
      crewName,
      jobTitle,
      hireDate,
      isActive,
    };

    const result = employeeId ? await updateEmployee(employeeId, payload) : await createEmployee(payload);

    if (result.error || !result.data) {
      setMessageType("error");
      setMessage(result.error || "Failed to save employee.");
      pushToast({ tone: "error", title: "Could not save employee.", description: "Check the required fields and try again." });
      setLoading(false);
      return;
    }

    setMessageType("success");
    setMessage(employeeId ? "Employee updated." : "Employee created.");
    pushToast({
      tone: "success",
      title: employeeId ? "Employee updated." : "Employee created.",
      description: employeeId ? "The changes are now live." : "You can add assignments or link user access next.",
    });
    setLoading(false);

    if (employeeId) {
      router.refresh();
    } else {
      router.push(`/dashboard/employees/${result.data.id}`);
    }
  }

  return (
    <div className={`${surfaceClassName} p-6`}>
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700">Full name *</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClassName}
            placeholder="Example: Maria Santos"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClassName} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClassName} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Crew name</label>
            <input value={crewName} onChange={(e) => setCrewName(e.target.value)} className={inputClassName} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Job title</label>
            <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputClassName} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Hire date</label>
            <input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} className={inputClassName} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Status</label>
            <select value={isActive ? "active" : "inactive"} onChange={(e) => setIsActive(e.target.value === "active")} className={selectClassName}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleSubmit} disabled={loading} className={primaryButtonClassName}>
            {loading ? "Saving..." : employeeId ? "Save Employee" : "Create Employee"}
          </button>
          <span className="text-sm text-zinc-500">Hourly rate stays intentionally hidden from this screen.</span>
        </div>

        {message ? (
          <InlineNotice tone={messageType === "error" ? "error" : messageType === "success" ? "success" : "neutral"}>
            {message}
          </InlineNotice>
        ) : (
          <InlineNotice tone="neutral">Keep crew and title details current so assignments and daily reports stay easy to manage.</InlineNotice>
        )}
      </div>
    </div>
  );
}
