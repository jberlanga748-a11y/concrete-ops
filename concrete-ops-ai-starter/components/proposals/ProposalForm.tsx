"use client";

import { type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { postJson } from "@/lib/ai/client";
import { createProposal, updateProposal } from "@/lib/db/mutations";
import type { CustomerOption, ProposalDetailRow, ProposalSectionRow, TimeOption } from "@/lib/db/queries";
import type { ProposalSectionType, ProposalStatus } from "@/lib/db/schema";
import { FieldLabel, FormActions, FormSection } from "@/components/ui/form";
import { OperationalCard, SectionHeader } from "@/components/ui/page-primitives";
import { useToast } from "@/components/ui/ToastProvider";

const fieldClassName =
  "w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500";
const compactFieldClassName =
  "w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500";
const secondaryButtonClassName =
  "inline-flex items-center justify-center rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-blue-50 disabled:opacity-50";

function FormShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <OperationalCard className="p-4">
        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-blue-700">{eyebrow}</p>
        <SectionHeader title={title} description={description} />
      </OperationalCard>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function FieldHint({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-sm font-medium text-slate-500">{children}</p>;
}

function FormNotice({
  message,
  tone = "info",
}: {
  message: string;
  tone?: "success" | "error" | "info";
}) {
  return (
    <p className={`text-sm font-bold ${tone === "error" ? "text-red-600" : tone === "success" ? "text-emerald-700" : "text-slate-500"}`}>
      {message}
    </p>
  );
}

type ProposalSectionFormRow = {
  sectionType: ProposalSectionType;
  heading: string;
  content: string;
};

function buildInitialSections(sections?: ProposalSectionRow[]) {
  if (!sections?.length) {
    return [
      { sectionType: "scope" as ProposalSectionType, heading: "Scope", content: "" },
      { sectionType: "exclusion" as ProposalSectionType, heading: "Exclusions", content: "" },
      { sectionType: "term" as ProposalSectionType, heading: "Terms", content: "" },
    ];
  }

  return sections.map((section) => ({
    sectionType: section.section_type,
    heading: section.heading || "",
    content: section.content,
  }));
}

export function ProposalForm({
  proposal,
  sections,
  customerOptions,
  jobOptions,
}: {
  proposal?: ProposalDetailRow | null;
  sections?: ProposalSectionRow[];
  customerOptions: CustomerOption[];
  jobOptions: TimeOption[];
}) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [customerId, setCustomerId] = useState(proposal?.customer_id ?? "");
  const [jobId, setJobId] = useState(proposal?.job_id ?? "");
  const [title, setTitle] = useState(proposal?.title ?? "");
  const [status, setStatus] = useState<ProposalStatus>(proposal?.status ?? "draft");
  const [notes, setNotes] = useState(proposal?.notes ?? "");
  const [rows, setRows] = useState<ProposalSectionFormRow[]>(buildInitialSections(sections));
  const [assistantRowIndex, setAssistantRowIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  function updateRow(index: number, patch: Partial<ProposalSectionFormRow>) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  function addRow(sectionType: ProposalSectionType = "scope") {
    setRows((current) => [...current, { sectionType, heading: "", content: "" }]);
  }

  function removeRow(index: number) {
    setRows((current) => (current.length === 1 ? current : current.filter((_, rowIndex) => rowIndex !== index)));
  }

  async function handleRewriteScopeWithAI(index: number) {
    const row = rows[index];
    if (!row || row.sectionType !== "scope") return;

    if (!row.content.trim() || row.content.trim().length < 10) {
      pushToast({
        tone: "error",
        title: "Add rough scope text first",
        description: "Enter at least a short scope draft before using Rewrite with AI.",
      });
      return;
    }

    setAssistantRowIndex(index);
    setMessage(null);

    try {
      const selectedCustomer = customerOptions.find((customer) => customer.id === customerId);
      const selectedJob = jobOptions.find((job) => job.id === jobId);

      const { response, data: body } = await postJson<{
        rewritten?: {
          heading?: string;
          content: string;
          customerSummary?: string;
        };
        error?: string;
      }>("/api/ai/proposal-scope", {
        customerLabel: selectedCustomer?.label,
        jobLabel: selectedJob?.label,
        proposalTitle: title,
        notes,
        sectionHeading: row.heading,
        roughScopeText: row.content,
      });

      if (!response.ok || !body?.rewritten) {
        pushToast({
          tone: "error",
          title: "Proposal Scope Assistant unavailable",
          description: body?.error || "We couldn't rewrite the scope text right now. Please try again.",
        });
        setAssistantRowIndex(null);
        return;
      }

      updateRow(index, {
        heading: body.rewritten.heading || row.heading,
        content: body.rewritten.content,
      });

      pushToast({
        tone: "success",
        title: "Scope rewritten for customer review",
        description:
          body.rewritten.customerSummary ||
          "The scope section is now concise, professional, and customer-facing.",
      });
    } catch {
      pushToast({
        tone: "error",
        title: "Proposal Scope Assistant unavailable",
        description: "We couldn't reach the assistant service right now. Please try again.",
      });
    } finally {
      setAssistantRowIndex(null);
    }
  }

  async function handleSubmit() {
    if (!customerId || !title.trim()) {
      setMessageType("error");
      setMessage("Customer and proposal title are required.");
      return;
    }

    const validSections = rows.filter((row) => row.content.trim());
    if (validSections.length === 0) {
      setMessageType("error");
      setMessage("Add at least one proposal section.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const payload = {
      customerId,
      jobId: jobId || undefined,
      title,
      status,
      notes,
      sections: validSections.map((row) => ({
        sectionType: row.sectionType,
        heading: row.heading || undefined,
        content: row.content,
      })),
    };

    const result = proposal?.id ? await updateProposal(proposal.id, payload) : await createProposal(payload);

    if (result.error || !result.data) {
      setMessageType("error");
      setMessage(result.error || "Failed to save proposal.");
      setLoading(false);
      return;
    }

    setMessageType("success");
    setMessage(proposal?.id ? "Proposal updated." : "Proposal created.");
    setLoading(false);
    router.push(`/dashboard/proposals/${result.data.id}`);
    router.refresh();
  }

  return (
    <FormShell
      eyebrow="Preconstruction"
      title={proposal?.id ? "Update Proposal" : "New Proposal"}
      description="Build a client-facing proposal with clear scope, exclusions, and terms that are easy to review."
    >
      <div className="space-y-4">
        <FormSection
          title="Proposal details"
          description="Set the customer, optional linked job, proposal status, and supporting notes."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel required>Customer</FieldLabel>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className={fieldClassName}
              >
                <option value="">Select customer</option>
                {customerOptions.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Linked job</FieldLabel>
              <select
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className={fieldClassName}
              >
                <option value="">Select job</option>
                {jobOptions.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel required>Proposal title</FieldLabel>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={fieldClassName}
                placeholder="Example: Concrete Removal and Replacement Proposal"
              />
            </div>
            <div>
              <FieldLabel>Status</FieldLabel>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProposalStatus)}
                className={fieldClassName}
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div>
            <FieldLabel>Notes</FieldLabel>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${fieldClassName} min-h-24 resize-y`}
              placeholder="Internal notes or context for the office team"
            />
          </div>
        </FormSection>

        <FormSection
          title="Proposal sections"
          description="Structure the narrative with section rows so customers can scan scope, exclusions, and terms quickly."
        >
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => addRow("scope")} className={secondaryButtonClassName}>
              Add Scope
            </button>
            <button type="button" onClick={() => addRow("exclusion")} className={secondaryButtonClassName}>
              Add Exclusion
            </button>
            <button type="button" onClick={() => addRow("term")} className={secondaryButtonClassName}>
              Add Term
            </button>
          </div>

          <div className="space-y-3">
            {rows.map((row, index) => (
              <div key={index} className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-950/5">
                <div className="grid gap-3 md:grid-cols-4">
                  <div>
                    <FieldLabel>Section type</FieldLabel>
                    <select
                      value={row.sectionType}
                      onChange={(e) => updateRow(index, { sectionType: e.target.value as ProposalSectionType })}
                      className={compactFieldClassName}
                    >
                      <option value="scope">Scope</option>
                      <option value="exclusion">Exclusion</option>
                      <option value="term">Term</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <FieldLabel>Heading</FieldLabel>
                    <input
                      value={row.heading}
                      onChange={(e) => updateRow(index, { heading: e.target.value })}
                      className={compactFieldClassName}
                      placeholder="Example: Work Scope, Exclusions, Payment Terms"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <FieldLabel>Content</FieldLabel>
                  <textarea
                    value={row.content}
                    onChange={(e) => updateRow(index, { content: e.target.value })}
                    className={`${compactFieldClassName} min-h-28 resize-y`}
                    placeholder="Write section details"
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {row.sectionType === "scope" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRewriteScopeWithAI(index)}
                          disabled={assistantRowIndex === index || loading}
                          className={secondaryButtonClassName}
                        >
                          {assistantRowIndex === index ? "Rewriting..." : "Rewrite with AI"}
                        </button>
                        <p className="text-xs font-medium leading-5 text-slate-500">
                          Rewrites rough scope text into concise, customer-facing language without inventing scope details.
                        </p>
                      </>
                    ) : (
                      <p className="text-xs font-medium leading-5 text-slate-500">AI rewrite is available for scope sections.</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button type="button" onClick={() => removeRow(index)} className={secondaryButtonClassName}>
                    Remove Section
                  </button>
                </div>
              </div>
            ))}
          </div>

          <FieldHint>Add at least one section with content before saving.</FieldHint>
        </FormSection>

        <FormActions hint="Use concise sections so scope and terms are easy for customers to approve.">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-blue-700/20 transition hover:bg-blue-800 disabled:opacity-50"
          >
            {loading ? "Saving..." : proposal?.id ? "Save Proposal" : "Create Proposal"}
          </button>
        </FormActions>

        {message ? (
          <FormNotice tone={messageType} message={message} />
        ) : (
          <FormNotice message="Required fields: customer and proposal title, plus at least one section with content." />
        )}
      </div>
    </FormShell>
  );
}
