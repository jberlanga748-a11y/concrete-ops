"use client";

import Link from "next/link";
import { useState } from "react";
import { postJson } from "@/lib/ai/client";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/ToastProvider";

type CopilotCitation = {
  entityType: "job" | "daily_report" | "upload" | "change_order";
  id: string;
  label: string;
  reason: string;
};

type CopilotAnswer = {
  answer: string;
  confidence: "high" | "medium" | "low";
  uncertaintyNote?: string;
  citations: CopilotCitation[];
};

function citationTypeLabel(entityType: CopilotCitation["entityType"]) {
  if (entityType === "job") return "Job";
  if (entityType === "daily_report") return "Daily report";
  if (entityType === "change_order") return "Change order";
  return "Upload";
}

function confidenceTone(confidence: CopilotAnswer["confidence"]) {
  if (confidence === "high") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (confidence === "medium") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
}

function citationHref(citation: CopilotCitation) {
  if (citation.entityType === "job") return `/dashboard/jobs/${citation.id}`;
  if (citation.entityType === "daily_report") return `/dashboard/daily-reports/${citation.id}`;
  if (citation.entityType === "change_order") return `/dashboard/change-orders/${citation.id}`;
  return "/dashboard/uploads";
}

function citationCtaLabel(citation: CopilotCitation) {
  if (citation.entityType === "job") return "Open job";
  if (citation.entityType === "daily_report") return "Open report";
  if (citation.entityType === "change_order") return "Open change order";
  return "Open uploads";
}

export function AdminOpsCopilotCard() {
  const { pushToast } = useToast();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<CopilotAnswer | null>(null);

  async function handleAsk() {
    if (question.trim().length < 5) {
      pushToast({
        tone: "error",
        title: "Add a clearer question",
        description: "Use at least a short operational question so the copilot can ground the answer.",
      });
      return;
    }

    setLoading(true);

    try {
      const { response, data: body } = await postJson<{ answer?: CopilotAnswer; error?: string }>(
        "/api/ai/admin-ops-copilot",
        { question },
      );

      if (!response.ok || !body?.answer) {
        pushToast({
          tone: "error",
          title: "Copilot unavailable",
          description: body?.error || "We couldn't answer that question right now.",
        });
        setLoading(false);
        return;
      }

      setAnswer(body.answer);
      pushToast({
        tone: "success",
        title: "Answer ready",
        description: "Grounded response generated from jobs, reports, uploads, and change orders.",
      });
    } catch {
      pushToast({
        tone: "error",
        title: "Copilot unavailable",
        description: "We couldn't reach the service right now.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-zinc-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,249,0.94))] p-6 shadow-[0_26px_60px_rgba(15,23,42,0.08)] sm:p-7">
      <div className="absolute inset-x-16 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.4),transparent)]" />
      <div className="absolute right-0 top-0 h-40 w-40 bg-[radial-gradient(circle,rgba(37,99,235,0.12),transparent_68%)]" />

      <div className="relative grid gap-6 xl:grid-cols-[1.25fr,0.9fr]">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-app-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Admin Ops Copilot</p>
              <h2 className="mt-3 text-[1.9rem] font-semibold tracking-[-0.05em] text-zinc-950">Grounded operations Q&amp;A</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600">
                Read-only pilot. Ask one sharp operational question and get a concise answer grounded only in jobs, reports, uploads, and change orders already in the system.
              </p>
            </div>
            <Badge
              variant="outline"
              className="rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-700"
            >
              Read-only beta
            </Badge>
          </div>

          <div className="mt-6 rounded-[28px] border border-zinc-200/80 bg-white/90 p-4 shadow-[0_16px_32px_rgba(15,23,42,0.05)] sm:p-5">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Example: Which jobs had both a daily report and a change order in the last week?"
              className="min-h-28 w-full rounded-[22px] border border-zinc-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfbfa_100%)] px-4 py-4 text-sm leading-6 text-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition placeholder:text-zinc-400 focus:border-[#93c5fd]"
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleAsk}
                disabled={loading}
                className="rounded-[20px] bg-[linear-gradient(135deg,#101828_0%,#1f2937_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(15,23,42,0.18)] transition hover:brightness-110 disabled:opacity-50"
              >
                {loading ? "Thinking..." : "Ask Copilot"}
              </button>
              <p className="text-xs leading-6 text-zinc-500">
                If data is missing, the answer will call that out explicitly.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#bfdbfe] bg-[linear-gradient(180deg,rgba(255,248,242,0.96),rgba(255,255,255,0.94))] p-5 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
          <p className="font-app-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">How to use it well</p>
          <div className="mt-5 space-y-3">
            {[
              "Ask one operational question at a time so the answer stays grounded and readable.",
              "Use it for follow-up, prioritization, and recent activity checks rather than speculative planning.",
              "Treat citations as the handoff point back into the real record.",
            ].map((tip) => (
              <div key={tip} className="rounded-[22px] border border-white bg-white/88 p-4 shadow-[0_12px_24px_rgba(15,23,42,0.04)]">
                <p className="text-sm leading-7 text-zinc-700">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {answer ? (
        <div className="mt-6 space-y-5 rounded-[30px] border border-zinc-200/90 bg-[linear-gradient(180deg,rgba(245,247,248,0.96),rgba(255,255,255,0.94))] p-5 shadow-[0_20px_40px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-zinc-950">Answer</p>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize shadow-[0_8px_18px_rgba(15,23,42,0.05)] ${confidenceTone(answer.confidence)}`}
              >
                {answer.confidence} confidence
              </span>
            </div>
            <p className="font-app-mono text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              {answer.citations.length} source{answer.citations.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="rounded-[24px] border border-white bg-white/92 p-5 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
            <p className="text-sm leading-7 text-zinc-700">{answer.answer}</p>
          </div>
          {answer.uncertaintyNote ? (
            <p className="rounded-[22px] border border-amber-200 bg-[linear-gradient(180deg,rgba(255,251,235,0.96),rgba(254,243,199,0.88))] px-4 py-3 text-sm leading-7 text-amber-800">
              {answer.uncertaintyNote}
            </p>
          ) : null}
          <div className="space-y-2">
            <p className="font-app-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Grounding records</p>
            {answer.citations.length > 0 ? (
              <ul className="space-y-3">
                {answer.citations.map((citation) => (
                  <li key={`${citation.entityType}:${citation.id}`} className="rounded-[24px] border border-zinc-200 bg-white px-4 py-4 text-sm shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
                          {citationTypeLabel(citation.entityType)}
                        </span>
                        <p className="font-medium text-zinc-900">{citation.label}</p>
                      </div>
                      <Link href={citationHref(citation)} className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700 hover:text-blue-800">
                        {citationCtaLabel(citation)}
                      </Link>
                    </div>
                    <p className="mt-3 text-xs leading-6 text-zinc-600">{citation.reason}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-600">No direct citations were returned.</p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
