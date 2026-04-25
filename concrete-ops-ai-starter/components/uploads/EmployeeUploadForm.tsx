"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FieldLabel } from "@/components/ui/form";
import { OperationalCard, SectionHeader } from "@/components/ui/page-primitives";
import type { DailyReportOption, TimeOption } from "@/lib/db/queries";

const TAG_OPTIONS = [
  { value: "progress", label: "Progress" },
  { value: "issue", label: "Issue" },
  { value: "safety", label: "Safety" },
  { value: "delivery", label: "Delivery" },
  { value: "damage", label: "Damage" },
  { value: "change_order_support", label: "Change Order Support" },
];

const fieldClassName =
  "w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

type EmployeeUploadFormProps = {
  jobOptions: TimeOption[];
  dailyReportOptions: DailyReportOption[];
  title?: string;
  description?: string;
  successMessage?: string;
  jobRequirementHint?: string;
  tipMessage?: string;
};

export function EmployeeUploadForm({
  jobOptions,
  dailyReportOptions,
  title = "Employee Photo Upload",
  description = "Attach field photos or docs to jobs and optional daily reports.",
  successMessage = "Upload saved and linked to the selected job.",
  jobRequirementHint = "Uploads need an assigned job so the office can trace field proof back to the right project.",
  tipMessage = "Tip: choose a clear note so admins can quickly use this as field proof later.",
}: EmployeeUploadFormProps) {
  const router = useRouter();
  const [jobId, setJobId] = useState("");
  const [dailyReportId, setDailyReportId] = useState("");
  const [tag, setTag] = useState("progress");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const hasJobs = jobOptions.length > 0;

  const scopedReportOptions = useMemo(() => {
    if (!jobId) return dailyReportOptions;
    return dailyReportOptions.filter((option) => option.jobId === jobId);
  }, [dailyReportOptions, jobId]);

  async function handleSubmit() {
    if (!hasJobs) {
      setMessageType("error");
      setMessage("You do not have any active job assignments yet, so uploads cannot be linked to a job.");
      return;
    }

    if (!jobId || !file) {
      setMessageType("error");
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

    const response = await fetch("/api/uploads", { method: "POST", body: formData });
    const body = (await response.json()) as { error?: string };

    if (!response.ok) {
      setMessageType("error");
      setMessage(body.error || "Upload failed.");
      setLoading(false);
      return;
    }

    setMessageType("success");
    setMessage(successMessage);
    setNote("");
    setFile(null);
    setDailyReportId("");
    setLoading(false);
    router.refresh();
  }

  return (
    <OperationalCard className="p-4">
      <SectionHeader title={title} description={description} />

      <div className="mt-4 space-y-4">
        <div>
          <FieldLabel>Job</FieldLabel>
          <select
            value={jobId}
            onChange={(e) => { setJobId(e.target.value); setDailyReportId(""); }}
            disabled={!hasJobs || loading}
            className={fieldClassName}
          >
            <option value="">{hasJobs ? "Select job" : "No active job assignments"}</option>
            {jobOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
          {!hasJobs ? <p className="mt-2 text-xs text-amber-700">{jobRequirementHint}</p> : null}
        </div>

        <div>
          <FieldLabel>Linked daily report (optional)</FieldLabel>
          <select
            value={dailyReportId}
            onChange={(e) => setDailyReportId(e.target.value)}
            disabled={!hasJobs || loading}
            className={fieldClassName}
          >
            <option value="">Select daily report</option>
            {scopedReportOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
          {jobId && scopedReportOptions.length === 0 ? <p className="mt-2 text-xs font-medium text-slate-500">No reports for this job yet. You can still upload proof now.</p> : null}
        </div>

        <div>
          <FieldLabel>Tag</FieldLabel>
          <select value={tag} onChange={(e) => setTag(e.target.value)} disabled={loading} className={fieldClassName}>
            {TAG_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel>Note (optional)</FieldLabel>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Short context for what this file shows" disabled={loading} className={`${fieldClassName} min-h-20 resize-y`} />
        </div>

        <div>
          <FieldLabel>Photo / document</FieldLabel>
          <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} disabled={loading || !hasJobs} className={fieldClassName} />
          <p className="mt-2 text-xs font-medium text-slate-500">Accepted: image files and PDF.</p>
        </div>

        <button type="button" onClick={handleSubmit} disabled={loading || !hasJobs} className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800 disabled:opacity-50">
          {loading ? "Uploading..." : "Save Upload"}
        </button>

        {message ? (
          <p className={`text-sm font-bold ${messageType === "error" ? "text-red-600" : messageType === "success" ? "text-emerald-700" : "text-slate-600"}`}>{message}</p>
        ) : (
          <p className="text-sm font-medium text-slate-500">{tipMessage}</p>
        )}
      </div>
    </OperationalCard>
  );
}
