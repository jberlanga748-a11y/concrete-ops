"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createToolboxTalk } from "@/lib/db/mutations";
import type { EmployeeOption, ToolboxTalkAttendeeOptionRow } from "@/lib/db/queries";

export function ToolboxTalkForm({
  foremanOptions,
  attendeeOptions,
}: {
  foremanOptions: EmployeeOption[];
  attendeeOptions: ToolboxTalkAttendeeOptionRow[];
}) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [talkDate, setTalkDate] = useState(new Date().toISOString().slice(0, 10));
  const [foremanEmployeeId, setForemanEmployeeId] = useState("");
  const [notes, setNotes] = useState("");
  const [attendeeEmployeeIds, setAttendeeEmployeeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  function toggleAttendee(employeeId: string) {
    setAttendeeEmployeeIds((current) =>
      current.includes(employeeId)
        ? current.filter((id) => id !== employeeId)
        : [...current, employeeId],
    );
  }

  async function handleSubmit() {
    if (!topic.trim() || !talkDate) {
      setMessageType("error");
      setMessage("Topic and talk date are required.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const result = await createToolboxTalk({
      topic,
      talkDate,
      foremanEmployeeId: foremanEmployeeId || undefined,
      notes,
      attendeeEmployeeIds,
    });

    if (result.error || !result.data) {
      setMessageType("error");
      setMessage(result.error || "Failed to create toolbox talk.");
      setLoading(false);
      return;
    }

    setMessageType("success");
    setMessage("Toolbox talk created.");
    setLoading(false);
    router.push(`/dashboard/toolbox-talks/${result.data.id}`);
  }

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm text-zinc-600">Topic *</p>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Example: Ladder safety and site housekeeping"
            className="w-full rounded-2xl border px-4 py-3"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm text-zinc-600">Talk date *</p>
            <input type="date" value={talkDate} onChange={(e) => setTalkDate(e.target.value)} className="w-full rounded-2xl border px-4 py-3" />
          </div>
          <div>
            <p className="mb-2 text-sm text-zinc-600">Foreman</p>
            <select value={foremanEmployeeId} onChange={(e) => setForemanEmployeeId(e.target.value)} className="w-full rounded-2xl border px-4 py-3">
              <option value="">Select foreman</option>
              {foremanOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-zinc-600">Notes</p>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-28 w-full rounded-2xl border px-4 py-3" placeholder="Key reminders, weather, PPE, or site-specific hazards" />
        </div>

        <div className="rounded-2xl border p-4">
          <p className="font-medium">Initial Attendees</p>
          <p className="mt-1 text-sm text-zinc-600">Optional: preselect anyone already gathered so the foreman can move faster.</p>
          <div className="mt-3 max-h-64 space-y-2 overflow-auto text-sm">
            {attendeeOptions.map((option) => (
              <label key={option.employeeId} className="flex items-start gap-2 rounded-xl border p-3">
                <input type="checkbox" checked={attendeeEmployeeIds.includes(option.employeeId)} onChange={() => toggleAttendee(option.employeeId)} />
                <span>{option.employeeLabel}</span>
              </label>
            ))}
            {attendeeOptions.length === 0 ? <p className="text-zinc-600">No active employees available to add yet.</p> : null}
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} className="rounded-2xl bg-zinc-900 px-5 py-3 text-white disabled:opacity-50">
          {loading ? "Saving..." : "Create Toolbox Talk"}
        </button>

        {message ? (
          <p className={`text-sm ${messageType === "error" ? "text-red-600" : messageType === "success" ? "text-green-700" : "text-zinc-600"}`}>{message}</p>
        ) : (
          <p className="text-sm text-zinc-500">Keep toolbox talks lightweight and field-friendly so attendance is easy to capture on site.</p>
        )}
      </div>
    </div>
  );
}
