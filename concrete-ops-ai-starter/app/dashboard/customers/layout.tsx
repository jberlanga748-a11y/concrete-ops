import { requireOfficeUser } from "@/lib/auth/server";

export default async function CustomersLayout({ children }: { children: React.ReactNode }) {
  await requireOfficeUser();
  return children;
}
