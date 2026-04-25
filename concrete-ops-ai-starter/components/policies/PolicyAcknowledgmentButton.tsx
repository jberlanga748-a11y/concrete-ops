"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signMyPolicyAcknowledgment } from "@/lib/db/mutations";

export function PolicyAcknowledgmentButton({
  policyId,
  signed,
}: {
  policyId: string;
  signed: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSign() {
    setLoading(true);
    setMessage(null);

    const result = await signMyPolicyAcknowledgment(policyId);
    if (result.error) {
      setMessage(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.refresh();
  }

  if (signed) {
    return <p className="text-sm font-bold text-emerald-700">Acknowledged.</p>;
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={handleSign} disabled={loading} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-black text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800 disabled:opacity-50">
        {loading ? "Signing..." : "Acknowledge Policy"}
      </button>
      {message ? <p className="text-sm text-red-600">{message}</p> : null}
    </div>
  );
}
