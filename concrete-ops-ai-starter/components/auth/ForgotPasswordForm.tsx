"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

const REQUEST_SENT_MESSAGE = "If that email is registered, a password reset link is on its way.";
const REQUEST_FAILED_MESSAGE = "We couldn't send the reset email. Check your Supabase Auth redirect URLs and try again.";

function getRecoveryRedirectUrl() {
  const redirectUrl = new URL("/auth/callback", window.location.origin);
  redirectUrl.searchParams.set("next", "/reset-password");
  return redirectUrl.toString();
}

export function ForgotPasswordForm({ initialError = null }: { initialError?: string | null }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: getRecoveryRedirectUrl(),
      });

      if (resetError) {
        setError(REQUEST_FAILED_MESSAGE);
        return;
      }

      setMessage(REQUEST_SENT_MESSAGE);
    } catch {
      setError(REQUEST_FAILED_MESSAGE);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="forgot-password-email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="forgot-password-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-2xl border px-4 py-3"
          placeholder="you@example.com"
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
      <button disabled={loading} className="w-full rounded-2xl bg-zinc-900 px-5 py-3 text-white disabled:opacity-50">
        {loading ? "Sending reset link..." : "Send reset link"}
      </button>
      <p className="text-sm text-zinc-600">
        Remember your password?{" "}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
