import type { AppRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type EmployeeUploadAppUser = {
  id: string;
  company_id: string;
  role: AppRole;
};

type EmployeeUploadAssignment = {
  job_id: string;
};

export type UploadAccess = {
  appUserId: string;
  companyId: string;
  role: AppRole;
  employeeId: string | null;
  assignedJobIds: string[];
  scope: "office" | "employee";
};

export type EmployeeUploadAccess = {
  appUserId: string;
  companyId: string;
  role: AppRole;
  employeeId: string;
  assignedJobIds: string[];
};

type UploadAccessResult =
  | { data: UploadAccess; error?: undefined }
  | { data?: undefined; error: string };

type EmployeeUploadAccessResult =
  | { data: EmployeeUploadAccess; error?: undefined }
  | { data?: undefined; error: string };

function isOfficeUploadRole(role?: AppRole | null) {
  return role === "owner" || role === "office_admin";
}

async function getUploadAppUserFromClient(
  supabase: ServerSupabaseClient,
): Promise<{ data: EmployeeUploadAppUser; error?: undefined } | { data?: undefined; error: string }> {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { error: "Unauthorized" };
  }

  const { data: appUser, error: appUserError } = await supabase
    .from("users")
    .select("id, company_id, role")
    .eq("auth_user_id", authData.user.id)
    .single<EmployeeUploadAppUser>();

  if (appUserError || !appUser) {
    return { error: "Could not resolve app user." };
  }

  return { data: appUser };
}

export async function getUploadAccess(): Promise<UploadAccessResult> {
  const supabase = await createClient();
  return getUploadAccessFromClient(supabase);
}

export async function getEmployeeUploadAccess(): Promise<EmployeeUploadAccessResult> {
  const supabase = await createClient();
  return getEmployeeUploadAccessFromClient(supabase);
}

export async function getUploadAccessFromClient(supabase: ServerSupabaseClient): Promise<UploadAccessResult> {
  const appUserResult = await getUploadAppUserFromClient(supabase);
  if (appUserResult.error || !appUserResult.data) {
    return { error: appUserResult.error || "Could not resolve app user." };
  }

  const appUser = appUserResult.data;

  if (isOfficeUploadRole(appUser.role)) {
    return {
      data: {
        appUserId: appUser.id,
        companyId: appUser.company_id,
        role: appUser.role,
        employeeId: null,
        assignedJobIds: [],
        scope: "office",
      } satisfies UploadAccess,
    };
  }

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("id")
    .eq("company_id", appUser.company_id)
    .eq("user_id", appUser.id)
    .maybeSingle<{ id: string }>();

  if (employeeError) {
    return { error: employeeError.message };
  }

  if (!employee) {
    return { error: "No employee record is linked to your user." };
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from("job_assignments")
    .select("job_id")
    .eq("company_id", appUser.company_id)
    .eq("employee_id", employee.id)
    .eq("is_active", true);

  if (assignmentsError) {
    return { error: assignmentsError.message };
  }

  const assignedJobIds = Array.from(
    new Set((assignments ?? []).map((assignment: EmployeeUploadAssignment) => assignment.job_id)),
  );

  return {
    data: {
      appUserId: appUser.id,
      companyId: appUser.company_id,
      role: appUser.role,
      employeeId: employee.id,
      assignedJobIds,
      scope: "employee",
    } satisfies UploadAccess,
  };
}

export async function getEmployeeUploadAccessFromClient(
  supabase: ServerSupabaseClient,
): Promise<EmployeeUploadAccessResult> {
  const accessResult = await getUploadAccessFromClient(supabase);

  if (accessResult.error || !accessResult.data) {
    return { error: accessResult.error || "Could not resolve upload access." };
  }

  if (accessResult.data.scope !== "employee" || !accessResult.data.employeeId) {
    return { error: "No employee record is linked to your user." };
  }

  return {
    data: {
      appUserId: accessResult.data.appUserId,
      companyId: accessResult.data.companyId,
      role: accessResult.data.role,
      employeeId: accessResult.data.employeeId,
      assignedJobIds: accessResult.data.assignedJobIds,
    } satisfies EmployeeUploadAccess,
  };
}
