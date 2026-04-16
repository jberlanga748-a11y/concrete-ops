import { DemoSetupWizard } from "@/components/setup/DemoSetupWizard";
import { requireOwnerUser } from "@/lib/auth/server";
import { getDemoSetupStatus } from "@/lib/demo/setup";

export default async function SetupPage() {
  await requireOwnerUser();
  const status = await getDemoSetupStatus();

  return <DemoSetupWizard initialStatus={status} />;
}
