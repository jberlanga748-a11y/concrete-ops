"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TimeOption } from "@/lib/db/queries";

const TAG_OPTIONS = [
  { value: "progress", label: "Progress" },
  { value: "issue", label: "Issue" },
  { value: "safety", label: "Safety" },
  { value: "delivery", label: "Delivery" },
  { value: "damage", label: "Damage" },
  { value: "change_order_support", label: "Change Order Support" },
];

export function EmployeeUploadForm({ jobOptions, dailyReportOptions }: { jobOptions: TimeOption[]; dailyReportOptions: TimeOption[] }) {
  const router = useRouter();
  const [jobId, setJobId] = useState("");
  const [dailyReportId, setDailyReportId] = useState("");
  const [tag, setTag] = useState("progress");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);


  async function handleSubmit() {
    if (!jobId || !file) {
      setMessage("Job and photo/document are required.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.set("jobId", jobId);
    formData.set("dailyReportId", dailyReportId);
    formData.set("tag", tag);
    formData.set("note", note);
    formData.set("file", file);

    const response = await fetch("/api/uploads", {
      method: "POST",
      body: formData,
    });

    const body = (await response.json()) as { error?: string };

    if (!response.ok) {
      setMessage(body.error || "Upload failed.");
      setLoading(false);
      return;
    }

    setMessage("Upload saved.");
    setNote("");
    setFile(null);
    setDailyReportId("");
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold">Employee Photo Upload</h2>
      <p className="mt-2 text-sm text-zinc-600">Attach field photos or docs to jobs and optional daily reports.</p>

      <div className="mt-5 space-y-4">
        <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="w-full rounded-2xl border px-4 py-3">
          <option value="">Select job</option>
          {jobOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>

        <select value={dailyReportId} onChange={(e) => setDailyReportId(e.target.value)} className="w-full rounded-2xl border px-4 py-3">
          <option value="">Link to daily report (optional)</option>
          {dailyReportOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>

        <select value={tag} onChange={(e) => setTag(e.target.value)} className="w-full rounded-2xl border px-4 py-3">
          {TAG_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          className="min-h-20 w-full rounded-2xl border px-4 py-3"
        />

        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full rounded-2xl border px-4 py-3"
        />

        <button onClick={handleSubmit} disabled={loading} className="rounded-2xl bg-zinc-900 px-5 py-3 text-white disabled:opacity-50">
          {loading ? "Uploading..." : "Upload"}
        </button>

        {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
      </div>
    </div>
  );
}
