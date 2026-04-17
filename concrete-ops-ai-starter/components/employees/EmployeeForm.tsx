"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEmployee, updateEmployee } from "@/lib/db/mutations";
import { FieldLabel, FormActions, FormSection } from "@/components/ui/form";
import { useToast } from "@/components/ui/ToastProvider";

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

  async function handleSubmit() {
    if (!fullName.trim()) {
      pushToast({
        tone: "error",
        title: "Employee name is required",
        description: "Add the employee’s full name before saving the record.",
      });
      return;
    }

    setLoading(true);

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
      pushToast({
        tone: "error",
        title: "Employee not saved",
        description: "We couldn’t save that employee right now. Try again in a moment.",
      });
      setLoading(false);
      return;
    }

    pushToast({
      tone: "success",
      title: employeeId ? "Employee updated" : "Employee created",
      description: employeeId ? "The employee record is updated." : "The employee is ready for assignments and time tracking.",
    });
    setLoading(false);

    if (employeeId) {
      router.refresh();
    } else {
      router.push(`/dashboard/employees/${result.data.id}`);
    }
  }

  return (
    <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
      <div className="space-y-4">
        <FormSection title="Employee details" description="Capture the information the field and office workflows need every day.">
          <div>
            <FieldLabel required>Full name</FieldLabel>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-2xl border border-zinc-300 px-4 py-3"
              placeholder="Example: Maria Santos"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Phone</FieldLabel>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-2xl border border-zinc-300 px-4 py-3" />
            </div>
            <div>
              <FieldLabel>Email</FieldLabel>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-2xl border border-zinc-300 px-4 py-3" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Crew name</FieldLabel>
              <input value={crewName} onChange={(e) => setCrewName(e.target.value)} className="w-full rounded-2xl border border-zinc-300 px-4 py-3" />
            </div>
            <div>
              <FieldLabel>Job title</FieldLabel>
              <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="w-full rounded-2xl border border-zinc-300 px-4 py-3" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Hire date</FieldLabel>
              <input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} className="w-full rounded-2xl border border-zinc-300 px-4 py-3" />
            </div>
            <div>
              <FieldLabel>Status</FieldLabel>
              <select value={isActive ? "active" : "inactive"} onChange={(e) => setIsActive(e.target.value === "active")} className="w-full rounded-2xl border border-zinc-300 px-4 py-3">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </FormSection>

        <FormActions hint="Hourly rate is intentionally not shown here. This form stays focused on assignment and field-operational details.">
          <button onClick={handleSubmit} disabled={loading} className="rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {loading ? "Saving..." : employeeId ? "Save Employee" : "Create Employee"}
          </button>
        </FormActions>
      </div>
    </div>
  );
}
