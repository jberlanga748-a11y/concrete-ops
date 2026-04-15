"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createChangeOrder } from "@/lib/db/mutations";
import type { DailyReportOption, JobFileRow, TimeOption } from "@/lib/db/queries";

export function ChangeOrderForm({
  jobOptions,
  dailyReportOptions,
  proofFiles,
}: {
  jobOptions: TimeOption[];
  dailyReportOptions: DailyReportOption[];
  proofFiles: JobFileRow[];
}) {
  const router = useRouter();
  const [jobId, setJobId] = useState("");
  const [dailyReportId, setDailyReportId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "submitted" | "approved" | "rejected" | "executed">("draft");
  const [directCostTotal, setDirectCostTotal] = useState("0");
  const [markupPercent, setMarkupPercent] = useState("0");
  const [proofFileIds, setProofFileIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  const filteredProofFiles = useMemo(() => {
    if (!jobId) return proofFiles;
    return proofFiles.filter((file) => file.job_id === jobId);
  }, [proofFiles, jobId]);

  const scopedReportOptions = useMemo(() => {
    if (!jobId) return dailyReportOptions;
    return dailyReportOptions.filter((report) => report.jobId === jobId);
  }, [dailyReportOptions, jobId]);

  const totalAmountPreview = useMemo(() => {
    const direct = Number(directCostTotal) || 0;
    const markup = Number(markupPercent) || 0;
    return Number((direct * (1 + markup / 100)).toFixed(2));
  }, [directCostTotal, markupPercent]);

  function toggleProof(fileId: string) {
    setProofFileIds((current) => (current.includes(fileId) ? current.filter((id) => id !== fileId) : [...current, fileId]));
  }

  async function handleSubmit() {
    if (!jobId || !title.trim()) {
      setMessageType("error");
      setMessage("Job and title are required.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const result = await createChangeOrder({
      jobId,
      dailyReportId: dailyReportId || undefined,
      title,
      description,
      status,
      directCostTotal: Number(directCostTotal) || 0,
      markupPercent: Number(markupPercent) || 0,
      totalAmount: totalAmountPreview,
      proofFileIds,
    });

    if (result.error || !result.data) {
      setMessageType("error");
      setMessage(result.error || "Failed to create change order.");
      setLoading(false);
      return;
    }

    setMessageType("success");
    setMessage("Change order created.");
    setLoading(false);
    router.push(`/dashboard/change-orders/${result.data.id}`);
  }

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold">New Change Order</h2>
      <p className="mt-2 text-sm text-zinc-600">Link to job context, optional daily report context, and optional field proof uploads.</p>

      <div className="mt-5 space-y-4">
        <div>
          <p className="mb-2 text-sm text-zinc-600">Job *</p>
          <select value={jobId} onChange={(e) => { setJobId(e.target.value); setDailyReportId(""); }} className="w-full rounded-2xl border px-4 py-3">
            <option value="">Select job</option>
            {jobOptions.map((job) => (
              <option key={job.id} value={job.id}>{job.label}</option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-2 text-sm text-zinc-600">Linked daily report (optional)</p>
          <select value={dailyReportId} onChange={(e) => setDailyReportId(e.target.value)} className="w-full rounded-2xl border px-4 py-3">
            <option value="">Select daily report</option>
            {scopedReportOptions.map((report) => (
              <option key={report.id} value={report.id}>{report.label}</option>
            ))}
          </select>
          {jobId && scopedReportOptions.length === 0 ? <p className="mt-2 text-xs text-zinc-500">No reports for selected job yet. You can still create the change order.</p> : null}
        </div>

        <div>
          <p className="mb-2 text-sm text-zinc-600">Title *</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Example: Extra slab edge prep" className="w-full rounded-2xl border px-4 py-3" />
        </div>

        <div>
          <p className="mb-2 text-sm text-zinc-600">Description</p>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What changed and why" className="min-h-28 w-full rounded-2xl border px-4 py-3" />
        </div>

        <div>
          <p className="mb-2 text-sm text-zinc-600">Status</p>
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="w-full rounded-2xl border px-4 py-3">
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="executed">Executed</option>
          </select>
        </div>

        <div className="rounded-2xl border p-4">
          <p className="font-medium">Totals</p>
          <p className="mt-1 text-sm text-zinc-600">Enter direct cost and markup. Total is previewed automatically.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input type="number" min="0" step="0.01" value={directCostTotal} onChange={(e) => setDirectCostTotal(e.target.value)} placeholder="Direct cost total" className="w-full rounded-2xl border px-4 py-3" />
            <input type="number" min="0" step="0.01" value={markupPercent} onChange={(e) => setMarkupPercent(e.target.value)} placeholder="Markup percent" className="w-full rounded-2xl border px-4 py-3" />
          </div>
          <p className="mt-3 text-sm text-zinc-600">Total amount preview: {totalAmountPreview.toFixed(2)}</p>
        </div>

        <div className="rounded-2xl border p-4">
          <p className="font-medium">Link field proof (optional)</p>
          <p className="mt-1 text-sm text-zinc-600">Select photos/documents that support this change order.</p>
          <div className="mt-3 max-h-60 space-y-2 overflow-auto text-sm">
            {filteredProofFiles.map((file) => (
              <label key={file.id} className="flex items-start gap-2 rounded-xl border p-2">
                <input type="checkbox" checked={proofFileIds.includes(file.id)} onChange={() => toggleProof(file.id)} />
                <span>
                  <span className="font-medium">{file.file_name}</span>
                  <span className="block text-zinc-600">{file.tag} · {file.created_at}</span>
                </span>
              </label>
            ))}
            {filteredProofFiles.length === 0 ? <p className="text-zinc-600">No uploads available for selected job.</p> : null}
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} className="rounded-2xl bg-zinc-900 px-5 py-3 text-white disabled:opacity-50">
          {loading ? "Saving..." : "Create Change Order"}
        </button>

        {message ? (
          <p className={`text-sm ${messageType === "error" ? "text-red-600" : messageType === "success" ? "text-green-700" : "text-zinc-600"}`}>{message}</p>
        ) : (
          <p className="text-sm text-zinc-500">Required fields: job and title.</p>
        )}
      </div>
    </div>
  );
}
