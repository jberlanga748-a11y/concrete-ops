"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3" />
      </div>
      <div>
        <label className="text-sm font-medium">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3" />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button disabled={loading} className="w-full rounded-2xl bg-zinc-900 px-5 py-3 text-white disabled:opacity-50">
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
