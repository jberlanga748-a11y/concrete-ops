import { AppRole } from "@/lib/auth/roles";

export function canAccess(role: AppRole, allowed: AppRole[]): boolean {
  return allowed.includes(role);
}
