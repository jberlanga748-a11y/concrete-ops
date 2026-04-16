import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import type { AppRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const ADMIN_ROLES = new Set(["owner", "office_admin", "foreman"]);

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const { data: appUser } = await supabase.from("users").select("role").eq("auth_user_id", user.id).maybeSingle<{ role: AppRole }>();

  if (appUser && !ADMIN_ROLES.has(appUser.role)) {
    redirect("/employee");
  }

  return <AppShell role={appUser?.role}>{children}</AppShell>;
}
