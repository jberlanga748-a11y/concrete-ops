import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

const RESET_ERROR_MESSAGES: Record<string, string> = {
  exchange_failed: "That reset link is invalid or has expired. Request a new one to continue.",
  missing_code: "That reset link is incomplete. Request a new one to continue.",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }> | { error?: string };
}) {
  const params = (await searchParams) ?? {};
  const initialError = typeof params.error === "string" ? RESET_ERROR_MESSAGES[params.error] ?? null : null;

  return (
    <main className="min-h-screen p-8 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">Concrete Ops AI</p>
        <h1 className="mt-3 text-3xl font-semibold">Forgot password</h1>
        <p className="mt-3 text-zinc-600">Enter your email and we&apos;ll send a secure password reset link.</p>
        <div className="mt-6">
          <ForgotPasswordForm initialError={initialError} />
        </div>
      </div>
    </main>
  );
}
