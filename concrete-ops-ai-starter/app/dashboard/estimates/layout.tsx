import { requireOfficeUser } from "@/lib/auth/server";

export default async function EstimatesLayout({ children }: { children: React.ReactNode }) {
  await requireOfficeUser();
  return children;
}
