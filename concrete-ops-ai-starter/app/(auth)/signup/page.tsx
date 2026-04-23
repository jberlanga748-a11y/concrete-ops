import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/SignupForm";
import { resolveAppUser } from "@/lib/auth/app-user";
import { getRoleHomePath } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export default async function SignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { appUser } = await resolveAppUser(supabase, user);

    if (appUser) {
      redirect(getRoleHomePath(appUser.role));
    }
  }

  return (
    <main className="min-h-screen p-8 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">Concrete Ops</p>
        <h1 className="mt-3 text-3xl font-semibold">Create account</h1>
        <p className="mt-3 text-zinc-600">Create an employee account. New signups default to employee access.</p>
        <div className="mt-6">
          <SignupForm />
        </div>
      </div>
    </main>
  );
}
