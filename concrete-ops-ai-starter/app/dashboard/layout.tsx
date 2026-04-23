import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorPanel } from "@/components/ui/feedback";
import { getProfileNotReadyRedirectPath, resolveAppUser } from "@/lib/auth/app-user";
import { getRoleHomePath } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const { appUser, error: appUserError } = await resolveAppUser(supabase, user);

  if (appUserError) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10 sm:px-6">
        <ErrorPanel
          title="We couldn’t verify dashboard access right now"
          description="Your session is still signed in, but the dashboard shell couldn’t confirm your app profile. Try refreshing the page or come back in a moment."
          actionHref="/dashboard"
          actionLabel="Try again"
        />
      </div>
    );
  }

  if (!appUser) {
    redirect(getProfileNotReadyRedirectPath("/dashboard"));
  }

  if (getRoleHomePath(appUser.role) === "/employee") {
    redirect(getRoleHomePath(appUser.role));
  }

  return <AppShell role={appUser.role}>{children}</AppShell>;
}
