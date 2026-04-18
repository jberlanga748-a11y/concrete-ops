import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen p-8 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">Concrete Ops</p>
        <h1 className="mt-3 text-3xl font-semibold">Reset password</h1>
        <p className="mt-3 text-zinc-600">
          {user
            ? "Choose a new password for your account."
            : "This reset link is missing or has expired. Request a fresh password reset email to continue."}
        </p>
        <div className="mt-6">
          {user ? (
            <ResetPasswordForm />
          ) : (
            <p className="text-sm text-zinc-600">
              <Link href="/forgot-password" className="underline">
                Request a new reset link
              </Link>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
