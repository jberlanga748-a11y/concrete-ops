import { redirect } from "next/navigation";
import type { AppRole } from "@/lib/auth/roles";
import { getRoleHomePath, isOfficeRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export type AppUserContext = {
  id: string;
  companyId: string;
  role: AppRole;
  email: string;
  fullName: string;
};

export async function getCurrentAppUserContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: appUser } = await supabase
    .from("users")
    .select("id, company_id, role, email, full_name")
    .eq("auth_user_id", user.id)
    .maybeSingle<{
      id: string;
      company_id: string;
      role: AppRole;
      email: string;
      full_name: string;
    }>();

  if (!appUser) return null;

  return {
    id: appUser.id,
    companyId: appUser.company_id,
    role: appUser.role,
    email: appUser.email,
    fullName: appUser.full_name,
  } satisfies AppUserContext;
}

export async function requireOfficeUser(nextPath = "/dashboard/settings") {
  const appUser = await getCurrentAppUserContext();

  if (!appUser) {
    redirect(`/login?next=${nextPath}`);
  }

  if (!isOfficeRole(appUser.role)) {
    redirect(getRoleHomePath(appUser.role));
  }

  return appUser;
}

export async function requireForemanUser() {
  const appUser = await getCurrentAppUserContext();

  if (!appUser) {
    redirect("/login?next=/dashboard/foreman");
  }

  if (appUser.role !== "foreman") {
    redirect(getRoleHomePath(appUser.role));
  }

  return appUser;
}
