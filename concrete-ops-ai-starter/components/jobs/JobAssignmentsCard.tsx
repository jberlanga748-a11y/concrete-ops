"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJobAssignment, updateJobAssignment } from "@/lib/db/mutations";
import type { EmployeeOption, JobAssignmentRow } from "@/lib/db/queries";
import type { AssignmentRole } from "@/lib/db/schema";
import { EmptyState, StatusChip } from "@/components/ui/feedback";
import { FieldLabel, FormActions, FormSection } from "@/components/ui/form";
import { useToast } from "@/components/ui/ToastProvider";

function getEmployeeDetails(assignment: JobAssignmentRow) {
  const employee = Array.isArray(assignment.employees) ? assignment.employees[0] : assignment.employees;
  return employee ?? null;
}

function AssignmentRow({
  assignment,
  jobId,
}: {
  assignment: JobAssignmentRow;
  jobId: string;
}) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [assignmentRole, setAssignmentRole] = useState<AssignmentRole>(assignment.assignment_role);
  const [startDate, setStartDate] = useState(assignment.start_date ?? "");
  const [endDate, setEndDate] = useState(assignment.end_date ?? "");
  const [isActive, setIsActive] = useState(assignment.is_active);
  const [loading, setLoading] = useState(false);
  const employee = getEmployeeDetails(assignment);

  async function handleSave() {
    setLoading(true);

    const result = await updateJobAssignment(assignment.id, {
      jobId,
      employeeId: assignment.employee_id,
      assignmentRole,
      startDate,
      endDate,
      isActive,
    });

    if (result.error) {
      pushToast({
        tone: "error",
        title: "Assignment not updated",
        description: "We couldn’t save that assignment right now. Try again in a moment.",
      });
      setLoading(false);
      return;
    }

    pushToast({
      tone: "success",
      title: "Assignment updated",
      description: "The crew assignment has been refreshed for this job.",
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="rounded-[24px] border border-zinc-200 bg-zinc-50/70 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-zinc-950">{employee?.full_name || "Employee"}</p>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            {[employee?.job_title, employee?.crew_name].filter(Boolean).join(" · ") || "No extra details"}
          </p>
        </div>
        <StatusChip tone={isActive ? "success" : "warning"}>{isActive ? "Active" : "Inactive"}</StatusChip>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <FieldLabel>Role</FieldLabel>
          <select
            value={assignmentRole}
            onChange={(e) => setAssignmentRole(e.target.value as AssignmentRole)}
            className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
          >
            <option value="foreman">Foreman</option>
            <option value="lead">Lead</option>
            <option value="crew">Crew</option>
          </select>
        </div>
        <div>
          <FieldLabel>Start date</FieldLabel>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
          />
        </div>
        <div>
          <FieldLabel>End date</FieldLabel>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
          />
        </div>
        <div>
          <FieldLabel>Status</FieldLabel>
          <select
            value={isActive ? "active" : "inactive"}
            onChange={(e) => setIsActive(e.target.value === "active")}
            className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={handleSave}
          disabled={loading}
          className="rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Assignment"}
        </button>
      </div>
    </div>
  );
}

export function JobAssignmentsCard({
  jobId,
  assignments,
  employeeOptions,
}: {
  jobId: string;
  assignments: JobAssignmentRow[];
  employeeOptions: EmployeeOption[];
}) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [employeeId, setEmployeeId] = useState("");
  const [assignmentRole, setAssignmentRole] = useState<AssignmentRole>("crew");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!employeeId) {
      pushToast({
        tone: "error",
        title: "Select an employee first",
        description: "Choose the employee you want to assign before saving the new job assignment.",
      });
      return;
    }

    setLoading(true);

    const result = await createJobAssignment({
      jobId,
      employeeId,
      assignmentRole,
      startDate,
      endDate,
      isActive,
    });

    if (result.error) {
      pushToast({
        tone: "error",
        title: "Assignment not created",
        description: "We couldn’t add that assignment right now. Try again in a moment.",
      });
      setLoading(false);
      return;
    }

    setEmployeeId("");
    setAssignmentRole("crew");
    setStartDate("");
    setEndDate("");
    setIsActive(true);
    pushToast({
      tone: "success",
      title: "Assignment added",
      description: "The selected employee is now attached to this job.",
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Assignments</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">Crew planning</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Manage who is assigned to this job and what role they carry before the field day starts.
        </p>
      </div>

      <div className="mt-5 space-y-4">
        <FormSection
          title="Add assignment"
          description="Choose the employee, role, and active dates for the new assignment."
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <FieldLabel required>Employee</FieldLabel>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
              >
                <option value="">Select employee</option>
                {employeeOptions.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Role</FieldLabel>
              <select
                value={assignmentRole}
                onChange={(e) => setAssignmentRole(e.target.value as AssignmentRole)}
                className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
              >
                <option value="foreman">Foreman</option>
                <option value="lead">Lead</option>
                <option value="crew">Crew</option>
              </select>
            </div>
            <div>
              <FieldLabel>Start date</FieldLabel>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
              />
            </div>
            <div>
              <FieldLabel>End date</FieldLabel>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
              />
            </div>
          </div>

          <div className="max-w-xs">
            <FieldLabel>Status</FieldLabel>
            <select
              value={isActive ? "active" : "inactive"}
              onChange={(e) => setIsActive(e.target.value === "active")}
              className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </FormSection>

        <FormActions hint="Assignments keep the Job Hub, daily report crew rows, and foreman workflow aligned around the same crew list.">
          <button
            onClick={handleCreate}
            disabled={loading}
            className="rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Add Assignment"}
          </button>
        </FormActions>

        <div className="space-y-3">
          {assignments.map((assignment) => (
            <AssignmentRow key={assignment.id} assignment={assignment} jobId={jobId} />
          ))}

          {assignments.length === 0 ? (
            <EmptyState
              icon="users"
              title="No assignments yet"
              description="Add the first crew assignment so the Job Hub, time entry, and daily report crew rows all point to the same team."
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
