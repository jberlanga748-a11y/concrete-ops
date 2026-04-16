import { UserManagementPanel } from "@/components/settings/UserManagementPanel";
import { requireOfficeUser } from "@/lib/auth/server";
import { getEmployeeUserLinkOptions, getManagedUsers } from "@/lib/db/queries";

export default async function SettingsPage() {
  await requireOfficeUser();
  const [{ data: users }, employeeOptions] = await Promise.all([
    getManagedUsers(),
    getEmployeeUserLinkOptions(),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="mt-3 text-zinc-600">Manage user access, role assignment, and employee linking from one place.</p>
      </div>

      <UserManagementPanel
        users={users ?? []}
        employeeOptions={employeeOptions}
        invitesEnabled={Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)}
      />
    </div>
  );
}
