import { redirect } from "next/navigation";
import { EmployeeShell } from "@/components/layout/EmployeeShell";
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

  const { data: appUser } = await supabase.from("users").select("role").eq("auth_user_id", user.id).maybeSingle<{ role: AppRole }>();

  if (!appUser) {
    redirect("/login");
  }

  if (ADMIN_ROLES.has(appUser.role)) {
    redirect(getRoleHomePath(appUser.role));
  }

  return <EmployeeShell>{children}</EmployeeShell>;
}
