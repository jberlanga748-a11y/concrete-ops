"use client";

import { type ReactNode, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { postJson } from "@/lib/ai/client";
import { createChangeOrder, updateChangeOrder } from "@/lib/db/mutations";
import type { ChangeOrderDetailRow, ChangeOrderLineItemRow, DailyReportOption, JobFileRow, TimeOption } from "@/lib/db/queries";
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

type ChangeOrderFormInitialValues = Pick<
  ChangeOrderDetailRow,
  "job_id" | "daily_report_id" | "title" | "description" | "status" | "direct_cost_total" | "markup_percent"
>;

type ChangeOrderLineItemFormRow = {
  description: string;
  quantity: string;
  unitCost: string;
};

function buildInitialLineItems(lineItems?: ChangeOrderLineItemRow[]) {
  if (!lineItems?.length) {
    return [{ description: "", quantity: "1", unitCost: "0" }];
  }

  return lineItems.map((lineItem) => ({
    description: lineItem.description,
    quantity: String(lineItem.quantity),
    unitCost: String(lineItem.unit_cost),
  }));
}

export function ChangeOrderForm({
  changeOrderId,
  jobOptions,
  dailyReportOptions,
  proofFiles,
  hideFinancials = false,
  initialValues,
  initialProofFileIds = [],
  initialLineItems,
}: {
  changeOrderId?: string;
  jobOptions: TimeOption[];
  dailyReportOptions: DailyReportOption[];
  proofFiles: JobFileRow[];
  hideFinancials?: boolean;
  initialValues?: ChangeOrderFormInitialValues | null;
  initialProofFileIds?: string[];
  initialLineItems?: ChangeOrderLineItemRow[];
}) {
  const router = useRouter();
  const isEditing = Boolean(changeOrderId);
  const [jobId, setJobId] = useState(initialValues?.job_id ?? "");
  const [dailyReportId, setDailyReportId] = useState(initialValues?.daily_report_id ?? "");
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [status, setStatus] = useState<"draft" | "submitted" | "approved" | "rejected" | "executed">(initialValues?.status ?? "draft");
  const [directCostTotal, setDirectCostTotal] = useState(String(initialValues?.direct_cost_total ?? 0));
  const [markupPercent, setMarkupPercent] = useState(String(initialValues?.markup_percent ?? 0));
  const [lineItems, setLineItems] = useState<ChangeOrderLineItemFormRow[]>(buildInitialLineItems(initialLineItems));
  const [proofFileIds, setProofFileIds] = useState<string[]>(initialProofFileIds);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  const formTitle = isEditing ? "Update Change Order" : "New Change Order";
  const formDescription = isEditing
    ? "Adjust scope, pricing, report context, and supporting field proof without losing the original record."
    : "Capture scope and pricing changes with optional report context and supporting field proof.";
  const submitLabel = isEditing ? "Save Change Order" : "Create Change Order";

  const filteredProofFiles = useMemo(() => {
    if (!jobId) return proofFiles;
    return proofFiles.filter((file) => file.job_id === jobId);
  }, [proofFiles, jobId]);

  const scopedReportOptions = useMemo(() => {
    if (!jobId) return dailyReportOptions;
    return dailyReportOptions.filter((report) => report.jobId === jobId);
  }, [dailyReportOptions, jobId]);

  const normalizedLineItems = useMemo(
    () =>
      lineItems
        .filter((row) => row.description.trim())
        .map((row) => ({
          description: row.description.trim(),
          quantity: Number(row.quantity) || 0,
          unitCost: Number(row.unitCost) || 0,
        })),
    [lineItems],
  );

  const lineItemSubtotal = useMemo(
    () =>
      Number(
        normalizedLineItems
          .reduce((sum, row) => sum + row.quantity * row.unitCost, 0)
          .toFixed(2),
      ),
    [normalizedLineItems],
  );

  const effectiveDirectCostTotal = normalizedLineItems.length > 0 ? lineItemSubtotal : Number(directCostTotal) || 0;

  const totalAmountPreview = useMemo(() => {
    const markup = Number(markupPercent) || 0;
    return Number((effectiveDirectCostTotal * (1 + markup / 100)).toFixed(2));
  }, [effectiveDirectCostTotal, markupPercent]);

  function toggleProof(fileId: string) {
    setProofFileIds((current) => (current.includes(fileId) ? current.filter((id) => id !== fileId) : [...current, fileId]));
  }

  function updateLineItem(index: number, patch: Partial<ChangeOrderLineItemFormRow>) {
    setLineItems((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  function addLineItem() {
    setLineItems((current) => [...current, { description: "", quantity: "1", unitCost: "0" }]);
  }

  function removeLineItem(index: number) {
    setLineItems((current) => (current.length === 1 ? current : current.filter((_, rowIndex) => rowIndex !== index)));
  }

  function handleJobChange(nextJobId: string) {
    setJobId(nextJobId);
    setDailyReportId("");
    setProofFileIds(
      (current) =>
        nextJobId
          ? current.filter((fileId) => proofFiles.some((file) => file.id === fileId && file.job_id === nextJobId))
          : [],
    );
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

    const payload = {
      jobId,
      dailyReportId: dailyReportId || undefined,
      title,
      description,
      status,
      directCostTotal: effectiveDirectCostTotal,
      markupPercent: Number(markupPercent) || 0,
      totalAmount: totalAmountPreview,
      proofFileIds,
      lineItems: normalizedLineItems,
    };

    const result = changeOrderId ? await updateChangeOrder(changeOrderId, payload) : await createChangeOrder(payload);

    if (result.error || !result.data) {
      setMessageType("error");
      setMessage(result.error || `Failed to ${isEditing ? "update" : "create"} change order.`);
      setLoading(false);
      return;
    }

    setMessageType("success");
    setMessage(isEditing ? "Change order updated." : "Change order created.");
    setLoading(false);
    router.push(`/dashboard/change-orders/${result.data.id}`);
    router.refresh();
  }

  return (
    <FormShell
      eyebrow="Commercial"
      title={formTitle}
      description={formDescription}
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
                onChange={(e) => handleJobChange(e.target.value)}
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
            title="Line items"
            description="Add an optional cost breakdown. When present, line items drive the direct cost subtotal automatically."
          >
            <div className="space-y-3">
              {lineItems.map((row, index) => {
                const lineTotal = Number(((Number(row.quantity) || 0) * (Number(row.unitCost) || 0)).toFixed(2));

                return (
                  <div key={index} className="rounded-2xl border border-zinc-200 bg-white p-4">
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_140px]">
                      <div>
                        <FieldLabel>Description</FieldLabel>
                        <input
                          value={row.description}
                          onChange={(e) => updateLineItem(index, { description: e.target.value })}
                          placeholder="Concrete saw cutting, additional rebar, pump mobilization"
                          className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
                        />
                      </div>
                      <div>
                        <FieldLabel>Qty</FieldLabel>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.quantity}
                          onChange={(e) => updateLineItem(index, { quantity: e.target.value })}
                          className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
                        />
                      </div>
                      <div>
                        <FieldLabel>Unit cost</FieldLabel>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.unitCost}
                          onChange={(e) => updateLineItem(index, { unitCost: e.target.value })}
                          className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-sm text-zinc-600">Line total: ${lineTotal.toFixed(2)}</p>
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="rounded-2xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
                      >
                        Remove line
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div>
                <p className="text-sm text-zinc-600">Line item subtotal</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-950">${lineItemSubtotal.toFixed(2)}</p>
              </div>
              <button
                type="button"
                onClick={addLineItem}
                className="rounded-2xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
              >
                Add line item
              </button>
            </div>
          </FormSection>
        ) : null}

        {!hideFinancials ? (
          <FormSection
            title="Pricing"
            description="Use markup to calculate the customer-facing total. Direct cost is driven by line items when any are provided."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Direct cost total</FieldLabel>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={normalizedLineItems.length > 0 ? effectiveDirectCostTotal.toFixed(2) : directCostTotal}
                  onChange={(e) => setDirectCostTotal(e.target.value)}
                  disabled={normalizedLineItems.length > 0}
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3"
                />
                {normalizedLineItems.length > 0 ? (
                  <FieldHint>Direct cost is currently driven by the line items above.</FieldHint>
                ) : null}
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
            {loading ? "Saving..." : submitLabel}
          </button>
        </FormActions>

        {message ? (
          <FormNotice tone={messageType} message={message} />
        ) : (
          <FormNotice message={`Required fields: job and title.${isEditing ? " Editing preserves the original change order record." : ""}`} />
        )}
      </div>
    </FormShell>
  );
}
