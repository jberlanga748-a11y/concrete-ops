import { redirect } from "next/navigation";
import { getProfileNotReadyRedirectPath, resolveAppUser } from "@/lib/auth/app-user";
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

type CurrentAppUserState =
  | { state: "signed_out" }
  | { state: "unlinked" }
  | { state: "ready"; appUser: AppUserContext };

async function getCurrentAppUserState(): Promise<CurrentAppUserState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { state: "signed_out" };
  }

  const { appUser } = await resolveAppUser(supabase, user);

  if (!appUser) {
    return { state: "unlinked" };
  }

  return {
    state: "ready",
    appUser: {
      id: appUser.id,
      companyId: appUser.company_id,
      role: appUser.role,
      email: appUser.email,
      fullName: appUser.full_name ?? appUser.email,
    } satisfies AppUserContext,
  };
}

export async function getCurrentAppUserContext() {
  const currentAppUser = await getCurrentAppUserState();
  return currentAppUser.state === "ready" ? currentAppUser.appUser : null;
}

export async function requireOfficeUser(nextPath = "/dashboard/settings") {
  const currentAppUser = await getCurrentAppUserState();

  if (currentAppUser.state === "signed_out") {
    redirect(`/login?next=${nextPath}`);
  }

  if (currentAppUser.state === "unlinked") {
    redirect(getProfileNotReadyRedirectPath(nextPath));
  }

  const { appUser } = currentAppUser;

  if (!isOfficeRole(appUser.role)) {
    redirect(getRoleHomePath(appUser.role));
  }

  return appUser;
}

export async function requireForemanUser() {
  const currentAppUser = await getCurrentAppUserState();

  if (currentAppUser.state === "signed_out") {
    redirect("/login?next=/dashboard/foreman");
  }

  if (currentAppUser.state === "unlinked") {
    redirect(getProfileNotReadyRedirectPath("/dashboard/foreman"));
  }

  const { appUser } = currentAppUser;

  if (appUser.role !== "foreman") {
    redirect(getRoleHomePath(appUser.role));
  }

  return appUser;
}
