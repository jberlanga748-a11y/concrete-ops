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

export type EmployeeUploadAccess = {
  appUserId: string;
  companyId: string;
  role: AppRole;
  employeeId: string;
  assignedJobIds: string[];
};

export async function getEmployeeUploadAccess() {
  const supabase = await createClient();
  return getEmployeeUploadAccessFromClient(supabase);
}

export async function getEmployeeUploadAccessFromClient(supabase: ServerSupabaseClient) {
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
    } satisfies EmployeeUploadAccess,
  };
}
