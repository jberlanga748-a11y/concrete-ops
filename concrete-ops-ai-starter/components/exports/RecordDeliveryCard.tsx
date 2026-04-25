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
    <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-950/5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-sm font-medium leading-5 text-slate-500">{description}</p>
        </div>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-blue-50"
        >
          Open PDF
        </a>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1.2fr_auto]">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">To</span>
          <input
            value={to}
            onChange={(event) => setTo(event.target.value)}
            placeholder="recipient@example.com"
            className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">Subject</span>
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500"
          />
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || !to.trim() || !subject.trim()}
            className="w-full rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800 disabled:opacity-50"
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
