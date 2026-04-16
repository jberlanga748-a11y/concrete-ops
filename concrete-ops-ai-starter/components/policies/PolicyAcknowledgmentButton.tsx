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
    return <p className="text-sm text-green-700">Acknowledged.</p>;
  }

  return (
    <div className="space-y-2">
      <button onClick={handleSign} disabled={loading} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50">
        {loading ? "Signing..." : "Acknowledge Policy"}
      </button>
      {message ? <p className="text-sm text-red-600">{message}</p> : null}
    </div>
  );
}
