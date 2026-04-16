"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createIncident } from "@/lib/db/mutations";
import type { EmployeeOption, TimeOption } from "@/lib/db/queries";

export function IncidentForm({
  jobOptions,
  employeeOptions,
  initialJobId = "",
}: {
  jobOptions: TimeOption[];
  employeeOptions: EmployeeOption[];
  initialJobId?: string;
}) {
  const router = useRouter();
  const [jobId, setJobId] = useState(initialJobId);
  const [employeeId, setEmployeeId] = useState("");
  const [incidentType, setIncidentType] = useState("near_miss");
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [status, setStatus] = useState("open");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  async function handleSubmit() {
    if (!incidentDate || !description.trim()) {
      setMessageType("error");
      setMessage("Incident date and description are required.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const result = await createIncident({
      jobId: jobId || undefined,
      employeeId: employeeId || undefined,
      incidentType: incidentType as "near_miss" | "injury" | "property_damage" | "observation",
      incidentDate,
      description,
      correctiveAction,
      status: status as "open" | "under_review" | "closed",
    });

    if (result.error || !result.data) {
      setMessageType("error");
      setMessage(result.error || "Failed to create incident.");
      setLoading(false);
      return;
    }

    setMessageType("success");
    setMessage("Incident created.");
    setLoading(false);
    router.push(`/dashboard/incidents/${result.data.id}`);
  }

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm text-zinc-600">Job</p>
            <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="w-full rounded-2xl border px-4 py-3">
              <option value="">Select job</option>
              {jobOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-2 text-sm text-zinc-600">Employee involved</p>
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full rounded-2xl border px-4 py-3">
              <option value="">Select employee</option>
              {employeeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="mb-2 text-sm text-zinc-600">Incident type *</p>
            <select value={incidentType} onChange={(e) => setIncidentType(e.target.value)} className="w-full rounded-2xl border px-4 py-3">
              <option value="near_miss">Near Miss</option>
              <option value="injury">Injury</option>
              <option value="property_damage">Property Damage</option>
              <option value="observation">Observation</option>
            </select>
          </div>
          <div>
            <p className="mb-2 text-sm text-zinc-600">Incident date *</p>
            <input type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} className="w-full rounded-2xl border px-4 py-3" />
          </div>
          <div>
            <p className="mb-2 text-sm text-zinc-600">Status *</p>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-2xl border px-4 py-3">
              <option value="open">Open</option>
              <option value="under_review">Under Review</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-zinc-600">Description *</p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What happened, where it happened, and any immediate site conditions"
            className="min-h-32 w-full rounded-2xl border px-4 py-3"
          />
        </div>

        <div>
          <p className="mb-2 text-sm text-zinc-600">Corrective action</p>
          <textarea
            value={correctiveAction}
            onChange={(e) => setCorrectiveAction(e.target.value)}
            placeholder="Optional: steps taken or next action needed"
            className="min-h-24 w-full rounded-2xl border px-4 py-3"
          />
        </div>

        <button onClick={handleSubmit} disabled={loading} className="rounded-2xl bg-zinc-900 px-5 py-3 text-white disabled:opacity-50">
          {loading ? "Saving..." : "Create Incident"}
        </button>

        {message ? (
          <p className={`text-sm ${messageType === "error" ? "text-red-600" : messageType === "success" ? "text-green-700" : "text-zinc-600"}`}>{message}</p>
        ) : (
          <p className="text-sm text-zinc-500">Keep the first report short and factual so the foreman can log it quickly from the field.</p>
        )}
      </div>
    </div>
  );
}
