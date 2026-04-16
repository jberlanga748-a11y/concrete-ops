"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJobAssignment, updateJobAssignment } from "@/lib/db/mutations";
import type { EmployeeOption, JobAssignmentRow } from "@/lib/db/queries";
import type { AssignmentRole } from "@/lib/db/schema";

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
  const [assignmentRole, setAssignmentRole] = useState<AssignmentRole>(assignment.assignment_role);
  const [startDate, setStartDate] = useState(assignment.start_date ?? "");
  const [endDate, setEndDate] = useState(assignment.end_date ?? "");
  const [isActive, setIsActive] = useState(assignment.is_active);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const employee = getEmployeeDetails(assignment);

  async function handleSave() {
    setLoading(true);
    setMessage(null);

    const result = await updateJobAssignment(assignment.id, {
      jobId,
      employeeId: assignment.employee_id,
      assignmentRole,
      startDate,
      endDate,
      isActive,
    });

    if (result.error) {
      setMessage(result.error);
      setLoading(false);
      return;
    }

    setMessage("Assignment updated.");
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{employee?.full_name || "Employee"}</p>
          <p className="text-sm text-zinc-600">
            {[employee?.job_title, employee?.crew_name].filter(Boolean).join(" · ") || "No extra details"}
          </p>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs uppercase tracking-wide text-zinc-600">
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <select value={assignmentRole} onChange={(e) => setAssignmentRole(e.target.value as AssignmentRole)} className="rounded-2xl border px-4 py-3">
          <option value="foreman">Foreman</option>
          <option value="lead">Lead</option>
          <option value="crew">Crew</option>
        </select>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-2xl border px-4 py-3" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-2xl border px-4 py-3" />
        <select value={isActive ? "active" : "inactive"} onChange={(e) => setIsActive(e.target.value === "active")} className="rounded-2xl border px-4 py-3">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={handleSave} disabled={loading} className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm text-white disabled:opacity-50">
          {loading ? "Saving..." : "Save Assignment"}
        </button>
        {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
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
  const [employeeId, setEmployeeId] = useState("");
  const [assignmentRole, setAssignmentRole] = useState<AssignmentRole>("crew");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleCreate() {
    if (!employeeId) {
      setMessage("Select an employee before adding an assignment.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const result = await createJobAssignment({
      jobId,
      employeeId,
      assignmentRole,
      startDate,
      endDate,
      isActive,
    });

    if (result.error) {
      setMessage(result.error);
      setLoading(false);
      return;
    }

    setEmployeeId("");
    setAssignmentRole("crew");
    setStartDate("");
    setEndDate("");
    setIsActive(true);
    setMessage("Assignment added.");
    setLoading(false);
    router.refresh();
  }

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Assignments</h2>
          <p className="mt-1 text-sm text-zinc-600">Manage who is assigned to this job and what role they carry.</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border p-4">
        <h3 className="text-sm font-medium">Add Assignment</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="rounded-2xl border px-4 py-3 xl:col-span-2">
            <option value="">Select employee</option>
            {employeeOptions.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.label}
              </option>
            ))}
          </select>
          <select value={assignmentRole} onChange={(e) => setAssignmentRole(e.target.value as AssignmentRole)} className="rounded-2xl border px-4 py-3">
            <option value="foreman">Foreman</option>
            <option value="lead">Lead</option>
            <option value="crew">Crew</option>
          </select>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-2xl border px-4 py-3" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-2xl border px-4 py-3" />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select value={isActive ? "active" : "inactive"} onChange={(e) => setIsActive(e.target.value === "active")} className="rounded-2xl border px-4 py-3">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button onClick={handleCreate} disabled={loading} className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm text-white disabled:opacity-50">
            {loading ? "Saving..." : "Add Assignment"}
          </button>
          {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {assignments.map((assignment) => (
          <AssignmentRow key={assignment.id} assignment={assignment} jobId={jobId} />
        ))}

        {assignments.length === 0 ? <p className="text-sm text-zinc-600">No job assignments yet.</p> : null}
      </div>
    </section>
  );
}
