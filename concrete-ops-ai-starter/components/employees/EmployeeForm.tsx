"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEmployee, updateEmployee } from "@/lib/db/mutations";

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
      setLoading(false);
      return;
    }

    setMessageType("success");
    setMessage(employeeId ? "Employee updated." : "Employee created.");
    setLoading(false);

    if (employeeId) {
      router.refresh();
    } else {
      router.push(`/dashboard/employees/${result.data.id}`);
    }
  }

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm text-zinc-600">Full name *</p>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-2xl border px-4 py-3"
            placeholder="Example: Maria Santos"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm text-zinc-600">Phone</p>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-2xl border px-4 py-3" />
          </div>
          <div>
            <p className="mb-2 text-sm text-zinc-600">Email</p>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-2xl border px-4 py-3" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm text-zinc-600">Crew name</p>
            <input value={crewName} onChange={(e) => setCrewName(e.target.value)} className="w-full rounded-2xl border px-4 py-3" />
          </div>
          <div>
            <p className="mb-2 text-sm text-zinc-600">Job title</p>
            <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="w-full rounded-2xl border px-4 py-3" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm text-zinc-600">Hire date</p>
            <input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} className="w-full rounded-2xl border px-4 py-3" />
          </div>
          <div>
            <p className="mb-2 text-sm text-zinc-600">Status</p>
            <select value={isActive ? "active" : "inactive"} onChange={(e) => setIsActive(e.target.value === "active")} className="w-full rounded-2xl border px-4 py-3">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} className="rounded-2xl bg-zinc-900 px-5 py-3 text-white disabled:opacity-50">
          {loading ? "Saving..." : employeeId ? "Save Employee" : "Create Employee"}
        </button>

        {message ? (
          <p className={`text-sm ${messageType === "error" ? "text-red-600" : messageType === "success" ? "text-green-700" : "text-zinc-600"}`}>{message}</p>
        ) : (
          <p className="text-sm text-zinc-500">Hourly rate is intentionally not shown here.</p>
        )}
      </div>
    </div>
  );
}
