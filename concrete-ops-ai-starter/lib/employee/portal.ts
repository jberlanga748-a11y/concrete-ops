import { redirect } from "next/navigation";
import type { AppRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const ADMIN_ROLES = new Set<AppRole>(["owner", "office_admin", "foreman"]);

type EmployeePortalAppUserRow = {
  id: string;
  company_id: string;
  role: AppRole;
  full_name: string;
};

type EmployeePortalEmployeeRow = {
  id: string;
  full_name: string;
  crew_name: string | null;
  job_title: string | null;
};

export type EmployeePortalContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  appUser: {
    id: string;
    companyId: string;
    role: AppRole;
    fullName: string;
  };
  employee: EmployeePortalEmployeeRow | null;
  assignedJobIds: string[];
  contextError: string | null;
};

export async function getEmployeePortalContext(nextPath = "/employee"): Promise<EmployeePortalContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${nextPath}`);
  }

  const { data: appUser, error: appUserError } = await supabase
    .from("users")
    .select("id, company_id, role, full_name")
    .eq("auth_user_id", user.id)
    .maybeSingle<EmployeePortalAppUserRow>();

  if (appUserError || !appUser) {
    redirect("/login");
  }

  if (ADMIN_ROLES.has(appUser.role)) {
    redirect("/dashboard");
  }

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("id, full_name, crew_name, job_title")
    .eq("company_id", appUser.company_id)
    .eq("user_id", appUser.id)
    .maybeSingle<EmployeePortalEmployeeRow>();

  let assignedJobIds: string[] = [];
  let assignmentsErrorMessage: string | null = null;

  if (employee) {
    const { data: assignments, error: assignmentsError } = await supabase
      .from("job_assignments")
      .select("job_id")
      .eq("company_id", appUser.company_id)
      .eq("employee_id", employee.id)
      .eq("is_active", true);

    if (assignmentsError) {
      assignmentsErrorMessage = assignmentsError.message;
    } else {
      assignedJobIds = Array.from(
        new Set((assignments ?? []).map((assignment: { job_id: string }) => assignment.job_id)),
      );
    }
  }

  return {
    supabase,
    appUser: {
      id: appUser.id,
      companyId: appUser.company_id,
      role: appUser.role,
      fullName: appUser.full_name,
    },
    employee: employee ?? null,
    assignedJobIds,
    contextError: employeeError?.message || assignmentsErrorMessage,
  };
}
