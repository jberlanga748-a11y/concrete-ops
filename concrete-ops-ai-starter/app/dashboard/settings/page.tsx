import { ErrorPanel } from "@/components/ui/feedback";
import { UserManagementPanel } from "@/components/settings/UserManagementPanel";
import { requireOfficeUser } from "@/lib/auth/server";
import { getEmployeeUserLinkOptions, getManagedUsers } from "@/lib/db/queries";

export default async function SettingsPage() {
  await requireOfficeUser();
  const [
    { data: users, error: usersError },
    { data: employeeOptions, error: employeeOptionsError },
  ] = await Promise.all([
    getManagedUsers(),
    getEmployeeUserLinkOptions(),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="mt-3 text-zinc-600">Manage user access, role assignment, and employee linking from one place.</p>
      </div>

      {usersError || employeeOptionsError ? (
        <ErrorPanel
          title="We couldn’t load user settings right now"
          description="The user management workspace is temporarily unavailable. Try refreshing the page or come back in a moment."
          actionHref="/dashboard/settings"
          actionLabel="Try again"
        />
      ) : (
        <UserManagementPanel
          users={users ?? []}
          employeeOptions={employeeOptions ?? []}
          invitesEnabled={Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)}
        />
      )}
    </div>
  );
}
