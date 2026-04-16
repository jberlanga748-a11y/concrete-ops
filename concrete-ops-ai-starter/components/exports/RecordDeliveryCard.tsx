"use client";

import { useState } from "react";
import type { ExportRecordType } from "@/lib/exports/recordDocuments";

export function RecordDeliveryCard({
  title,
  description,
  recordType,
  recordId,
  pdfUrl,
  defaultTo,
  defaultSubject,
}: {
  title: string;
  description: string;
  recordType: ExportRecordType;
  recordId: string;
  pdfUrl: string;
  defaultTo?: string;
  defaultSubject: string;
}) {
  const [to, setTo] = useState(defaultTo || "");
  const [subject, setSubject] = useState(defaultSubject);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setIsSending(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/record-emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recordType,
          recordId,
          to,
          subject,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error || "Could not send email.");
        return;
      }

      setMessage("Email sent. You can resend it anytime from here.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not send email.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-zinc-600">{description}</p>
        </div>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-zinc-50"
        >
          Open PDF
        </a>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1.2fr_auto]">
        <label className="block">
          <span className="mb-2 block text-sm text-zinc-600">To</span>
          <input
            value={to}
            onChange={(event) => setTo(event.target.value)}
            placeholder="recipient@example.com"
            className="w-full rounded-2xl border px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-zinc-600">Subject</span>
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="w-full rounded-2xl border px-4 py-3"
          />
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || !to.trim() || !subject.trim()}
            className="w-full rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {isSending ? "Sending..." : "Send / Resend Email"}
          </button>
        </div>
      </div>

      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
