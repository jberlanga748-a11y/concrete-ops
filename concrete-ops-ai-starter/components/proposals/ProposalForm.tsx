"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProposal, updateProposal } from "@/lib/db/mutations";
import type { CustomerOption, ProposalDetailRow, ProposalSectionRow, TimeOption } from "@/lib/db/queries";
import type { ProposalSectionType, ProposalStatus } from "@/lib/db/schema";

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
  const [customerId, setCustomerId] = useState(proposal?.customer_id ?? "");
  const [jobId, setJobId] = useState(proposal?.job_id ?? "");
  const [title, setTitle] = useState(proposal?.title ?? "");
  const [status, setStatus] = useState<ProposalStatus>(proposal?.status ?? "draft");
  const [notes, setNotes] = useState(proposal?.notes ?? "");
  const [rows, setRows] = useState<ProposalSectionFormRow[]>(buildInitialSections(sections));
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
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm text-zinc-600">Customer *</p>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full rounded-2xl border px-4 py-3">
              <option value="">Select customer</option>
              {customerOptions.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-2 text-sm text-zinc-600">Linked job</p>
            <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="w-full rounded-2xl border px-4 py-3">
              <option value="">Select job</option>
              {jobOptions.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm text-zinc-600">Proposal title *</p>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-2xl border px-4 py-3" placeholder="Example: Concrete Removal and Replacement Proposal" />
          </div>
          <div>
            <p className="mb-2 text-sm text-zinc-600">Status</p>
            <select value={status} onChange={(e) => setStatus(e.target.value as ProposalStatus)} className="w-full rounded-2xl border px-4 py-3">
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-sm text-zinc-600">Notes</p>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-24 w-full rounded-2xl border px-4 py-3" placeholder="Internal notes, proposal assumptions, or context for the office team" />
        </div>
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Sections</h2>
            <p className="mt-1 text-sm text-zinc-600">Build the proposal narrative with scope, exclusions, and terms.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => addRow("scope")} className="rounded-xl border px-3 py-2 text-sm">Add Scope</button>
            <button onClick={() => addRow("exclusion")} className="rounded-xl border px-3 py-2 text-sm">Add Exclusion</button>
            <button onClick={() => addRow("term")} className="rounded-xl border px-3 py-2 text-sm">Add Term</button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {rows.map((row, index) => (
            <div key={index} className="rounded-2xl border p-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <p className="mb-2 text-xs text-zinc-500">Section Type</p>
                  <select value={row.sectionType} onChange={(e) => updateRow(index, { sectionType: e.target.value as ProposalSectionType })} className="w-full rounded-xl border px-3 py-2 text-sm">
                    <option value="scope">Scope</option>
                    <option value="exclusion">Exclusion</option>
                    <option value="term">Term</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <p className="mb-2 text-xs text-zinc-500">Heading</p>
                  <input value={row.heading} onChange={(e) => updateRow(index, { heading: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Example: Work Scope, Exclusions, Payment Terms" />
                </div>
              </div>
              <div className="mt-3">
                <p className="mb-2 text-xs text-zinc-500">Content</p>
                <textarea value={row.content} onChange={(e) => updateRow(index, { content: e.target.value })} className="min-h-28 w-full rounded-xl border px-3 py-2 text-sm" placeholder="Write the section content here." />
              </div>
              <div className="mt-3 flex justify-end">
                <button onClick={() => removeRow(index)} className="rounded-xl border px-3 py-2 text-sm">
                  Remove Section
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <button onClick={handleSubmit} disabled={loading} className="rounded-2xl bg-zinc-900 px-5 py-3 text-white disabled:opacity-50">
          {loading ? "Saving..." : proposal?.id ? "Save Proposal" : "Create Proposal"}
        </button>

        {message ? (
          <p className={`mt-3 text-sm ${messageType === "error" ? "text-red-600" : messageType === "success" ? "text-green-700" : "text-zinc-600"}`}>{message}</p>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">Keep proposal sections concise and client-friendly so scope, exclusions, and terms are easy to review.</p>
        )}
      </div>
    </div>
  );
}
