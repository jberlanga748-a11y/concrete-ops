export type AppRole = "owner" | "office_admin" | "foreman" | "employee";

export const adminRoles: AppRole[] = ["owner", "office_admin", "foreman"];
export const officeRoles: AppRole[] = ["owner", "office_admin"];

export function isForemanRole(role?: AppRole | null) {
  return role === "foreman";
}

export function isOfficeRole(role?: AppRole | null) {
  return role === "owner" || role === "office_admin";
}

export function getRoleHomePath(role?: AppRole | null) {
  if (role === "foreman") return "/dashboard/foreman";
  if (isOfficeRole(role)) return "/dashboard";
  return "/employee";
}
