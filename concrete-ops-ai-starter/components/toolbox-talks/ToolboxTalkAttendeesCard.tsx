"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ViewerDateTime } from "@/components/time/ViewerDateTime";
import { createToolboxTalkAttendee, updateToolboxTalkAttendeeSignedAt } from "@/lib/db/mutations";
import type { ToolboxTalkAttendeeOptionRow, ToolboxTalkAttendeeRow } from "@/lib/db/queries";

function getEmployee(attendee: ToolboxTalkAttendeeRow["employees"]) {
  if (!attendee) return null;
  if (Array.isArray(attendee)) return attendee[0] ?? null;
  return attendee;
}

function AttendeeRow({ attendee }: { attendee: ToolboxTalkAttendeeRow }) {
  const router = useRouter();
  const employee = getEmployee(attendee.employees);
  const [loading, setLoading] = useState(false);
  const isSigned = Boolean(attendee.signed_at);

  async function handleToggleSigned() {
    setLoading(true);
    const result = await updateToolboxTalkAttendeeSignedAt({
      attendeeId: attendee.id,
      signed: !isSigned,
    });
    setLoading(false);
    if (!result.error) {
      router.refresh();
    }
  }

  return (
    <li className="rounded-2xl border p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{employee?.full_name || "Employee"}</p>
          <p className="mt-1 text-sm text-zinc-600">{[employee?.job_title, employee?.crew_name].filter(Boolean).join(" · ") || "—"}</p>
        </div>
        <button onClick={handleToggleSigned} disabled={loading} className={`rounded-xl px-4 py-2 text-sm disabled:opacity-50 ${isSigned ? "border border-zinc-300" : "bg-zinc-900 text-white"}`}>
          {loading ? "Saving..." : isSigned ? "Clear Signature" : "Mark Signed"}
        </button>
      </div>
      <p className="mt-3 text-sm text-zinc-500">
        Signed: <ViewerDateTime value={attendee.signed_at} includeYear={false} includeTimeZoneName={false} emptyLabel="Not signed" />
      </p>
    </li>
  );
}

export function ToolboxTalkAttendeesCard({
  toolboxTalkId,
  attendees,
  attendeeOptions,
}: {
  toolboxTalkId: string;
  attendees: ToolboxTalkAttendeeRow[];
  attendeeOptions: ToolboxTalkAttendeeOptionRow[];
}) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const usedEmployeeIds = new Set(attendees.map((attendee) => attendee.employee_id));
  const availableOptions = attendeeOptions.filter((option) => !usedEmployeeIds.has(option.employeeId));

  async function handleAddAttendee() {
    if (!employeeId) {
      setMessage("Select an attendee before adding.");
      return;
    }

    setLoading(true);
    setMessage(null);
    const result = await createToolboxTalkAttendee({
      toolboxTalkId,
      employeeId,
    });
    setLoading(false);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setEmployeeId("");
    router.refresh();
  }

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Attendees</h2>
          <p className="mt-1 text-sm text-zinc-600">Add attendees and mark signatures as the talk wraps up.</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="rounded-2xl border px-4 py-3">
            <option value="">Select attendee</option>
            {availableOptions.map((option) => (
              <option key={option.employeeId} value={option.employeeId}>
                {option.employeeLabel}
              </option>
            ))}
          </select>
          <button onClick={handleAddAttendee} disabled={loading} className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm text-white disabled:opacity-50">
            {loading ? "Saving..." : "Add Attendee"}
          </button>
        </div>
        {message ? <p className="mt-3 text-sm text-zinc-600">{message}</p> : null}
      </div>

      <ul className="mt-4 space-y-3 text-sm">
        {attendees.map((attendee) => (
          <AttendeeRow key={attendee.id} attendee={attendee} />
        ))}
        {attendees.length === 0 ? <li className="text-zinc-600">No attendees added yet.</li> : null}
      </ul>
    </section>
  );
}
