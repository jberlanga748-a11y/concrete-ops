"use client";

import Link from "next/link";
import { useState } from "react";
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
      const response = await fetch("/api/ai/admin-ops-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const body = (await response.json().catch(() => null)) as
        | { answer?: CopilotAnswer; error?: string }
        | null;

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
    <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Admin Ops Copilot</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">Grounded operations Q&A</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Read-only pilot. Answers are concise and grounded in existing records only.
          </p>
        </div>
        <Badge variant="outline">Read-only beta</Badge>
      </div>

      <div className="mt-4 space-y-3">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Example: Which jobs had both a daily report and a change order in the last week?"
          className="min-h-24 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleAsk}
            disabled={loading}
            className="rounded-2xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Thinking..." : "Ask Copilot"}
          </button>
          <p className="text-xs leading-5 text-zinc-500">
            If data is missing, the answer will call that out explicitly.
          </p>
        </div>
      </div>

      {answer ? (
        <div className="mt-5 space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-zinc-950">Answer</p>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${confidenceTone(answer.confidence)}`}>
              {answer.confidence} confidence
            </span>
          </div>
          <p className="text-sm leading-6 text-zinc-700">{answer.answer}</p>
          {answer.uncertaintyNote ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {answer.uncertaintyNote}
            </p>
          ) : null}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Grounding records</p>
            {answer.citations.length > 0 ? (
              <ul className="space-y-2">
                {answer.citations.map((citation) => (
                  <li key={`${citation.entityType}:${citation.id}`} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-zinc-900">{citation.label}</span>
                      <Link href={citationHref(citation)} className="text-xs font-semibold text-orange-600 hover:text-orange-500">
                        Open
                      </Link>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-zinc-600">{citation.reason}</p>
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
