import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: appUser } = await supabase
      .from("users")
      .select("role")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    redirect(appUser?.role === "owner" || appUser?.role === "office_admin" || appUser?.role === "foreman" ? "/dashboard" : "/employee");
  }

  return (
    <main className="min-h-screen p-8 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">Concrete Ops</p>
        <h1 className="mt-3 text-3xl font-semibold">Sign in</h1>
        <p className="mt-3 text-zinc-600">Sign in to the admin or employee portal.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
