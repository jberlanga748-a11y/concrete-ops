"use client";

import Link from "next/link";
import { useState } from "react";
import { postJson } from "@/lib/ai/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const suggestedPrompts = [
  "Which jobs had both a daily report and a change order in the last week?",
  "Which active jobs look like they are missing a recent daily report?",
  "What uploads mention pending approvals or missing documents?",
];

function CopilotGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path d="M4 7.5A3.5 3.5 0 0 1 7.5 4h9A3.5 3.5 0 0 1 20 7.5v5A3.5 3.5 0 0 1 16.5 16H9l-5 4v-4.5A3.5 3.5 0 0 1 4 12.5Z" />
      <path d="M9 10h6" />
      <path d="M9 13h4" />
    </svg>
  );
}

function confidenceTone(confidence: CopilotAnswer["confidence"]) {
  if (confidence === "high") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (confidence === "medium") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
}

function citationTypeLabel(entityType: CopilotCitation["entityType"]) {
  if (entityType === "job") return "Job";
  if (entityType === "daily_report") return "Daily report";
  if (entityType === "change_order") return "Change order";
  return "Upload";
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function updateQuestion(value: string) {
    setQuestion(value);
    if (errorMessage) {
      setErrorMessage(null);
    }
  }

  async function handleAsk() {
    const trimmedQuestion = question.trim();

    if (trimmedQuestion.length < 5) {
      const description = "Use at least a short operational question so the copilot can ground the answer.";
      setErrorMessage(description);
      pushToast({
        tone: "error",
        title: "Add a clearer question",
        description,
      });
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const { response, data: body } = await postJson<{ answer?: CopilotAnswer; error?: string }>(
        "/api/ai/admin-ops-copilot",
        { question: trimmedQuestion },
      );

      if (!response.ok || !body?.answer) {
        const description = body?.error || "We couldn't answer that question right now.";
        setErrorMessage(description);
        pushToast({
          tone: "error",
          title: "Copilot unavailable",
          description,
        });
        return;
      }

      setAnswer(body.answer);
      pushToast({
        tone: "success",
        title: "Answer ready",
        description: "Grounded response generated from jobs, reports, uploads, and change orders.",
      });
    } catch {
      const description = "We couldn't reach the service right now.";
      setErrorMessage(description);
      pushToast({
        tone: "error",
        title: "Copilot unavailable",
        description,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <div className="border-b border-zinc-200 bg-[linear-gradient(135deg,rgba(249,115,22,0.12),rgba(255,255,255,0)_65%),linear-gradient(180deg,#fafaf9_0%,#ffffff_100%)] px-5 py-6 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Admin Ops Copilot</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">Grounded operations Q&amp;A</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-600">
              Read-only pilot. Answers stay concise, cite the records behind the response, and call out gaps instead of guessing.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-zinc-300 bg-white text-zinc-700">
              Read-only beta
            </Badge>
            <Badge variant="outline" className="border-zinc-300 bg-white text-zinc-700">
              Grounded records only
            </Badge>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <div className="rounded-[24px] border border-white/70 bg-white/85 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Best for</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-700">
              <li>Cross-check jobs against daily reports and change orders.</li>
              <li>Surface missing documentation before office follow-up slips.</li>
              <li>Summarize what the existing record actually supports.</li>
            </ul>
          </div>

          <div className="rounded-[24px] border border-orange-100 bg-white/85 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Answer policy</p>
            <p className="mt-3 text-sm leading-6 text-zinc-700">
              If the records are incomplete or conflicting, the copilot says that directly rather than filling the gap with assumptions.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid gap-6 xl:grid-cols-[1.02fr,0.98fr]">
          <div>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Ask a question</span>
              <textarea
                value={question}
                onChange={(event) => updateQuestion(event.target.value)}
                placeholder="Example: Which jobs had both a daily report and a change order in the last week?"
                className="mt-3 min-h-36 w-full rounded-[28px] border border-zinc-300 bg-zinc-50/50 px-4 py-4 text-sm leading-6 text-zinc-900 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  onClick={handleAsk}
                  disabled={loading}
                  className="h-11 rounded-2xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  {loading ? "Thinking..." : "Ask Copilot"}
                </Button>
                <p className="text-xs leading-5 text-zinc-500">
                  If data is missing, the answer will call that out explicitly.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Suggested prompts</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => updateQuestion(prompt)}
                    className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-left text-sm text-zinc-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-zinc-950"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {errorMessage ? (
              <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">Needs attention</p>
                <p className="mt-2 text-sm leading-6 text-rose-700">{errorMessage}</p>
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-[28px] border border-zinc-200 bg-zinc-50/80 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-zinc-700 shadow-sm">
                    <CopilotGlyph />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Working</p>
                    <h3 className="mt-1 text-lg font-semibold tracking-tight text-zinc-950">Reviewing grounded records</h3>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="h-3 w-11/12 animate-pulse rounded-full bg-zinc-200" />
                  <div className="h-3 w-full animate-pulse rounded-full bg-zinc-200" />
                  <div className="h-3 w-4/5 animate-pulse rounded-full bg-zinc-200" />
                </div>
              </div>
            ) : answer ? (
              <div className="rounded-[28px] border border-zinc-200 bg-zinc-50/80 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Latest answer</p>
                    <h3 className="mt-2 text-lg font-semibold tracking-tight text-zinc-950">Grounded response</h3>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${confidenceTone(answer.confidence)}`}
                  >
                    {answer.confidence} confidence
                  </span>
                </div>

                <div className="mt-4 rounded-[24px] border border-zinc-200 bg-white p-4">
                  <p className="text-sm leading-7 whitespace-pre-line text-zinc-700">{answer.answer}</p>
                </div>

                {answer.uncertaintyNote ? (
                  <p className="mt-4 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                    {answer.uncertaintyNote}
                  </p>
                ) : null}

                <div className="mt-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Grounding records</p>
                    <p className="text-xs text-zinc-500">
                      {answer.citations.length} source{answer.citations.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  {answer.citations.length > 0 ? (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {answer.citations.map((citation) => (
                        <article
                          key={`${citation.entityType}:${citation.id}`}
                          className="rounded-[24px] border border-zinc-200 bg-white p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="space-y-1">
                              <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                                {citationTypeLabel(citation.entityType)}
                              </span>
                              <p className="text-sm font-semibold text-zinc-950">{citation.label}</p>
                            </div>
                            <Link
                              href={citationHref(citation)}
                              className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600 hover:text-orange-500"
                            >
                              {citationCtaLabel(citation)}
                            </Link>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-zinc-600">{citation.reason}</p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-[24px] border border-dashed border-zinc-300 bg-white p-4 text-sm leading-6 text-zinc-600">
                      No direct citations were returned with this answer.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-zinc-300 bg-zinc-50/80 p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-700 shadow-sm">
                  <CopilotGlyph />
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-zinc-950">Ask from live operations records</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
                  Questions can span jobs, daily reports, uploads, and change orders. The card will return a grounded answer and show the records used to support it.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
