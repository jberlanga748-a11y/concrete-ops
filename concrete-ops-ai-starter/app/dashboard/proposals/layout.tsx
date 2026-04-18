import { requireOfficeUser } from "@/lib/auth/server";

export default async function ProposalsLayout({ children }: { children: React.ReactNode }) {
  await requireOfficeUser();
  return children;
}
