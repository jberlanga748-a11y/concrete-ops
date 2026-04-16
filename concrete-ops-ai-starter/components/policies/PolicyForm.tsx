"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPolicy, updatePolicy } from "@/lib/db/mutations";
import type { PolicyDetailRow } from "@/lib/db/queries";

export function PolicyForm({
  policy,
}: {
  policy?: PolicyDetailRow | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(policy?.title ?? "");
  const [category, setCategory] = useState(policy?.category ?? "");
  const [versionLabel, setVersionLabel] = useState(policy?.version_label ?? "");
  const [content, setContent] = useState(policy?.content ?? "");
  const [isActive, setIsActive] = useState(policy?.is_active ?? true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) {
      setMessageType("error");
      setMessage("Title and policy content are required.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const result = policy
      ? await updatePolicy(policy.id, { title, category, versionLabel, content, isActive })
      : await createPolicy({ title, category, versionLabel, content, isActive });

    if (result.error || !result.data) {
      setMessageType("error");
      setMessage(result.error || "Failed to save policy.");
      setLoading(false);
      return;
    }

    setMessageType("success");
    setMessage(policy ? "Policy updated." : "Policy created.");
    setLoading(false);
    router.push(`/dashboard/policies/${result.data.id}`);
    router.refresh();
  }

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm text-zinc-600">Title *</p>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-2xl border px-4 py-3" placeholder="Example: PPE and Site Safety Policy" />
          </div>
          <div>
            <p className="mb-2 text-sm text-zinc-600">Category</p>
            <input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-2xl border px-4 py-3" placeholder="Safety, Handbook, Equipment, HR" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm text-zinc-600">Version label</p>
            <input value={versionLabel} onChange={(e) => setVersionLabel(e.target.value)} className="w-full rounded-2xl border px-4 py-3" placeholder="v1.0, 2026 Spring, Rev A" />
          </div>
          <label className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active policy
          </label>
        </div>

        <div>
          <p className="mb-2 text-sm text-zinc-600">Content *</p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-72 w-full rounded-2xl border px-4 py-3"
            placeholder="Write the policy text employees and admins should read and acknowledge."
          />
        </div>

        <button onClick={handleSubmit} disabled={loading} className="rounded-2xl bg-zinc-900 px-5 py-3 text-white disabled:opacity-50">
          {loading ? "Saving..." : policy ? "Save Policy" : "Create Policy"}
        </button>

        {message ? (
          <p className={`text-sm ${messageType === "error" ? "text-red-600" : messageType === "success" ? "text-green-700" : "text-zinc-600"}`}>{message}</p>
        ) : (
          <p className="text-sm text-zinc-500">Keep policies readable and practical so acknowledgment is straightforward for crews and staff.</p>
        )}
      </div>
    </div>
  );
}
