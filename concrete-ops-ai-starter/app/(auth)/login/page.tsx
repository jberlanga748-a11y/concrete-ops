import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { AUTH_ROUTE_ERROR_MESSAGES, resolveAppUser } from "@/lib/auth/app-user";
import { getRoleHomePath } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }> | { error?: string };
}) {
  const params = (await searchParams) ?? {};
  let initialError = typeof params.error === "string" ? AUTH_ROUTE_ERROR_MESSAGES[params.error] ?? null : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { appUser } = await resolveAppUser(supabase, user);

    if (appUser) {
      redirect(getRoleHomePath(appUser.role));
    }

    initialError ??= AUTH_ROUTE_ERROR_MESSAGES.profile_not_ready;
  }

  return (
    <main className="min-h-screen p-8 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">Concrete Ops</p>
        <h1 className="mt-3 text-3xl font-semibold">Sign in</h1>
        <p className="mt-3 text-zinc-600">Sign in to the admin or employee portal.</p>
        {initialError ? (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
            {initialError}
          </p>
        ) : null}
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
