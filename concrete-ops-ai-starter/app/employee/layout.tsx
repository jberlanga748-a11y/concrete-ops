import { redirect } from "next/navigation";
import { EmployeeShell } from "@/components/layout/EmployeeShell";
import { ErrorPanel } from "@/components/ui/feedback";
import type { AppRole } from "@/lib/auth/roles";
import { getRoleHomePath } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const ADMIN_ROLES = new Set(["owner", "office_admin", "foreman"]);

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/employee");
  }

  const { data: appUser, error: appUserError } = await supabase
    .from("users")
    .select("role")
    .eq("auth_user_id", user.id)
    .maybeSingle<{ role: AppRole }>();

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
    redirect("/login");
  }

  if (ADMIN_ROLES.has(appUser.role)) {
    redirect(getRoleHomePath(appUser.role));
  }

  return <EmployeeShell>{children}</EmployeeShell>;
}
