"use client";

import { type ReactNode, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { postJson } from "@/lib/ai/client";
import { createChangeOrder } from "@/lib/db/mutations";
import type { DailyReportOption, JobFileRow, TimeOption } from "@/lib/db/queries";
import { FieldLabel, FormActions, FormSection } from "@/components/ui/form";

function FormShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold text-zinc-950">{title}</h2>
      <p className="mt-2 text-sm text-zinc-600">{description}</p>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

function FieldHint({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-xs text-zinc-500">{children}</p>;
}

function FormNotice({
  message,
  tone = "info",
}: {
  message: string;
  tone?: "success" | "error" | "info";
}) {
  return (
    <p className={`text-sm ${tone === "error" ? "text-red-600" : tone === "success" ? "text-green-700" : "text-zinc-500"}`}>
      {message}
    </p>
  );
}

export function ChangeOrderForm({
  jobOptions,
  dailyReportOptions,
  proofFiles,
  hideFinancials = false,
}: {
  jobOptions: TimeOption[];
  dailyReportOptions: DailyReportOption[];
  proofFiles: JobFileRow[];
  hideFinancials?: boolean;
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
  const [assistantLoading, setAssistantLoading] = useState(false);
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

  async function handleRewriteWithAI() {
    if (!description.trim() || description.trim().length < 10) {
      setMessageType("error");
      setMessage("Add a short rough description first before using Rewrite with AI.");
      return;
    }

    setAssistantLoading(true);
    setMessage(null);

    try {
      const selectedJob = jobOptions.find((job) => job.id === jobId);
      const selectedReport = scopedReportOptions.find((report) => report.id === dailyReportId);

      const { response, data: body } = await postJson<{
        rewritten?: {
          description: string;
          customerSummary?: string;
        };
        error?: string;
      }>("/api/ai/change-order-rewrite", {
        jobLabel: selectedJob?.label,
        dailyReportLabel: selectedReport?.label,
        title,
        description,
      });

      if (!response.ok || !body?.rewritten) {
        setMessageType("error");
        setMessage(body?.error || "Change Order Assistant is unavailable right now.");
        setAssistantLoading(false);
        return;
      }

      setDescription(body.rewritten.description);
      setMessageType("success");
      setMessage(body.rewritten.customerSummary || "Description rewritten in concise, customer-safe language.");
    } catch {
      setMessageType("error");
      setMessage("Change Order Assistant is unavailable right now.");
    } finally {
      setAssistantLoading(false);
    }
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
    <FormShell
      eyebrow="Commercial"
      title="New Change Order"
      description="Capture scope and pricing changes with optional report context and supporting field proof."
    >
      <div className="space-y-4">
        <FormSection
          title="Change details"
          description="Start with the job, the reason for the change, and the current lifecycle status."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel required>Job</FieldLabel>
              <select
                value={jobId}
                onChange={(e) => {
                  setJobId(e.target.value);
                  setDailyReportId("");
                }}
                className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
              >
                <option value="">Select job</option>
                {jobOptions.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel>Linked daily report</FieldLabel>
              <select
                value={dailyReportId}
                onChange={(e) => setDailyReportId(e.target.value)}
                className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
              >
                <option value="">Select daily report</option>
                {scopedReportOptions.map((report) => (
                  <option key={report.id} value={report.id}>
                    {report.label}
                  </option>
                ))}
              </select>
              {jobId && scopedReportOptions.length === 0 ? (
                <FieldHint>No reports for this job yet. You can still create the change order.</FieldHint>
              ) : null}
            </div>
          </div>

          <div>
            <FieldLabel required>Title</FieldLabel>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Example: Extra slab edge prep"
              className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Status</FieldLabel>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
              >
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="executed">Executed</option>
              </select>
            </div>
            <div>
              <FieldLabel>Description</FieldLabel>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What changed and why"
                className="min-h-24 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleRewriteWithAI}
                  disabled={assistantLoading || loading}
                  className="rounded-2xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-50"
                >
                  {assistantLoading ? "Rewriting..." : "Rewrite with AI"}
                </button>
                <p className="text-xs leading-5 text-zinc-500">Keeps tone factual and customer-safe without inventing scope or pricing.</p>
              </div>
            </div>
          </div>
        </FormSection>

        {!hideFinancials ? (
          <FormSection
            title="Pricing"
            description="Enter direct cost and markup. Total updates automatically so reviewers can validate quickly."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Direct cost total</FieldLabel>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={directCostTotal}
                  onChange={(e) => setDirectCostTotal(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
                />
              </div>
              <div>
                <FieldLabel>Markup percent</FieldLabel>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={markupPercent}
                  onChange={(e) => setMarkupPercent(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
                />
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-600">Total amount preview</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-950">${totalAmountPreview.toFixed(2)}</p>
            </div>
          </FormSection>
        ) : null}

        <FormSection
          title="Supporting files"
          description="Link optional photos or docs that justify the scope and cost change."
        >
          <div className="max-h-72 space-y-2 overflow-auto pr-1 text-sm">
            {filteredProofFiles.map((file) => (
              <label key={file.id} className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-3">
                <input type="checkbox" checked={proofFileIds.includes(file.id)} onChange={() => toggleProof(file.id)} />
                <span>
                  <span className="font-medium text-zinc-900">{file.file_name}</span>
                  <span className="mt-1 block text-zinc-600">
                    {file.tag} · {file.created_at}
                  </span>
                </span>
              </label>
            ))}
            {filteredProofFiles.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-4 text-zinc-600">
                No uploads available for the selected job.
              </p>
            ) : null}
          </div>
        </FormSection>

        <FormActions hint="Required fields: job and title. Add pricing and proof files when available to speed up review.">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Create Change Order"}
          </button>
        </FormActions>

        {message ? <FormNotice tone={messageType} message={message} /> : <FormNotice message="Required fields: job and title." />}
      </div>
    </FormShell>
  );
}
