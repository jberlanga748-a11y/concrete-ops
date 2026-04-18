import { requireOfficeUser } from "@/lib/auth/server";

export default async function EmployeesLayout({ children }: { children: React.ReactNode }) {
  await requireOfficeUser();
  return children;
}
