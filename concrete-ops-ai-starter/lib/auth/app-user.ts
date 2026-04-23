import { createClient as createAdminClient, type SupabaseClient, type User as AuthUser } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/auth/roles";
import { getEnv } from "@/lib/env";

const APP_USER_SELECT = "id, role, company_id, email, status, full_name";

export const AUTH_ROUTE_ERROR_MESSAGES: Record<string, string> = {
  profile_not_ready:
    "Your account is signed in, but it is not linked to an app user in this environment yet. For demo QA, rerun the demo seed after creating the auth users or enable the service-role auto-link path on the deploy.",
};

export type AppUserRecord = {
  id: string;
  role: AppRole;
  company_id: string;
  email: string;
  status: string | null;
  full_name: string | null;
};

export type ResolvedAppUser = {
  appUser: AppUserRecord | null;
  error: string | null;
};

async function getLinkedAppUser(supabase: SupabaseClient, authUserId: string): Promise<ResolvedAppUser> {
  const { data: appUser, error } = await supabase
    .from("users")
    .select(APP_USER_SELECT)
    .eq("auth_user_id", authUserId)
    .maybeSingle<AppUserRecord>();

  return {
    appUser: appUser ?? null,
    error: error?.message ?? null,
  };
}

export async function resolveAppUser(
  supabase: SupabaseClient,
  authUser: Pick<AuthUser, "id" | "email">,
): Promise<ResolvedAppUser> {
  const linkedAppUser = await getLinkedAppUser(supabase, authUser.id);
  if (linkedAppUser.appUser || linkedAppUser.error || !authUser.email) {
    return linkedAppUser;
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return linkedAppUser;
  }

  const env = getEnv();
  const adminClient = createAdminClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: invitedUser, error: invitedUserError } = await adminClient
    .from("users")
    .select(APP_USER_SELECT)
    .is("auth_user_id", null)
    .ilike("email", authUser.email)
    .maybeSingle<AppUserRecord>();

  if (invitedUserError) {
    return { appUser: null, error: invitedUserError.message };
  }

  if (!invitedUser) {
    return linkedAppUser;
  }

  const { error: linkUserError } = await adminClient
    .from("users")
    .update({
      auth_user_id: authUser.id,
      status: "active",
      last_login_at: new Date().toISOString(),
    })
    .eq("id", invitedUser.id);

  if (linkUserError) {
    return { appUser: null, error: linkUserError.message };
  }

  const { error: linkEmployeeError } = await adminClient
    .from("employees")
    .update({ user_id: invitedUser.id })
    .eq("company_id", invitedUser.company_id)
    .is("user_id", null)
    .ilike("email", authUser.email);

  if (linkEmployeeError) {
    return { appUser: null, error: linkEmployeeError.message };
  }

  return {
    appUser: {
      ...invitedUser,
      status: "active",
    },
    error: null,
  };
}

export function getProfileNotReadyRedirectPath(nextPath?: string) {
  const searchParams = new URLSearchParams({ error: "profile_not_ready" });

  if (nextPath && nextPath.startsWith("/") && nextPath !== "/login") {
    searchParams.set("next", nextPath);
  }

  return `/login?${searchParams.toString()}`;
}
