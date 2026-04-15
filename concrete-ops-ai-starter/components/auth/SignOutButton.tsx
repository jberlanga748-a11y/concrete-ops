"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export function SignOutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSignOut() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        setError("Could not sign out. Please try again.");
        return;
      }

      router.push("/login");
      router.refresh();
    } catch {
      setError("Could not sign out. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={loading}
        className={className ?? "rounded-xl border px-3 py-2 text-sm disabled:opacity-50"}
      >
        {loading ? "Signing out..." : "Sign out"}
      </button>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
