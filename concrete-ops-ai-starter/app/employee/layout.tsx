import { redirect } from "next/navigation";
import { EmployeeShell } from "@/components/layout/EmployeeShell";
import { ErrorPanel } from "@/components/ui/feedback";
import { getProfileNotReadyRedirectPath, resolveAppUser } from "@/lib/auth/app-user";
import { getRoleHomePath } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/employee");
  }

  const { appUser, error: appUserError } = await resolveAppUser(supabase, user);

  if (appUserError) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10 sm:px-6">
        <ErrorPanel
          title="We couldn’t verify employee portal access right now"
          description="Your session is still signed in, but the employee portal couldn’t confirm your app profile. Try refreshing the page or come back in a moment."
          actionHref="/employee"
          actionLabel="Try again"
        />
      </div>
    );
  }

  if (!appUser) {
    redirect(getProfileNotReadyRedirectPath("/employee"));
  }

  if (getRoleHomePath(appUser.role) !== "/employee") {
    redirect(getRoleHomePath(appUser.role));
  }

  return <EmployeeShell>{children}</EmployeeShell>;
}
