"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ViewerDateTime } from "@/components/time/ViewerDateTime";
import { inviteAppUser, resendAppUserInvite, updateManagedUser } from "@/lib/db/mutations";
import type { EmployeeUserLinkOption, ManagedUserRow } from "@/lib/db/queries";
import type { AppRole, UserStatus } from "@/lib/db/schema";

const managedRoleOptions: { value: Exclude<AppRole, "owner">; label: string }[] = [
  { value: "office_admin", label: "Office Admin" },
  { value: "foreman", label: "Foreman" },
  { value: "employee", label: "Employee" },
];

const statusOptions: { value: UserStatus; label: string }[] = [
  { value: "invited", label: "Invited" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

function ManagedUserCard({
  user,
  employeeOptions,
  invitesEnabled,
}: {
  user: ManagedUserRow;
  employeeOptions: EmployeeUserLinkOption[];
  invitesEnabled: boolean;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(user.full_name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [role, setRole] = useState<AppRole>(user.role);
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [employeeId, setEmployeeId] = useState(user.linkedEmployee?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const isOwnerRecord = user.role === "owner";

  async function handleSave() {
    setIsSaving(true);
    setMessage(null);

    const result = await updateManagedUser(user.id, {
      fullName,
      phone,
      role,
      status,
      employeeId: employeeId || undefined,
    });

    if (result.error) {
      setMessage(result.error);
      setIsSaving(false);
      return;
    }

    setMessage("User updated.");
    setIsSaving(false);
    router.refresh();
  }

  async function handleResend() {
    setIsResending(true);
    setMessage(null);

    const result = await resendAppUserInvite(user.id);
    if (result.error) {
      setMessage(result.error);
      setIsResending(false);
      return;
    }

    setMessage("Invite resent.");
    setIsResending(false);
  }

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-zinc-900">{user.email}</p>
          <p className="mt-1 text-sm text-zinc-600">
            Created <ViewerDateTime value={user.created_at} includeYear includeTimeZoneName={false} /> · Last login{" "}
            <ViewerDateTime value={user.last_login_at} includeYear includeTimeZoneName={false} />
          </p>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs uppercase tracking-wide text-zinc-600">
          {user.status}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <input
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="rounded-2xl border px-4 py-3"
          placeholder="Full name"
        />
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="rounded-2xl border px-4 py-3"
          placeholder="Phone"
        />
        {isOwnerRecord ? (
          <div className="rounded-2xl border bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            Owner access is managed outside this UI.
          </div>
        ) : (
          <select value={role} onChange={(event) => setRole(event.target.value as AppRole)} className="rounded-2xl border px-4 py-3">
            {managedRoleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
        <select value={status} onChange={(event) => setStatus(event.target.value as UserStatus)} className="rounded-2xl border px-4 py-3">
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3">
        <select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} className="w-full rounded-2xl border px-4 py-3">
          <option value="">No employee link</option>
          {employeeOptions.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm text-white disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save User"}
        </button>
        {invitesEnabled ? (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="rounded-2xl border px-4 py-3 text-sm disabled:opacity-50"
          >
            {isResending ? "Resending..." : "Resend Invite"}
          </button>
        ) : null}
        {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
      </div>
    </div>
  );
}

export function UserManagementPanel({
  users,
  employeeOptions,
  invitesEnabled,
}: {
  users: ManagedUserRow[];
  employeeOptions: EmployeeUserLinkOption[];
  invitesEnabled: boolean;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Exclude<AppRole, "owner">>("employee");
  const [employeeId, setEmployeeId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  async function handleInvite() {
    setIsInviting(true);
    setMessage(null);

    const result = await inviteAppUser({
      fullName,
      email,
      phone,
      role,
      employeeId: employeeId || undefined,
    });

    if (result.error) {
      setMessage(result.error);
      setIsInviting(false);
      return;
    }

    setFullName("");
    setEmail("");
    setPhone("");
    setRole("employee");
    setEmployeeId("");
    setMessage("Invite created.");
    setIsInviting(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Invite User</h2>
            <p className="mt-1 text-sm text-zinc-600">Create a real app user, assign employee, foreman, or office admin access, and optionally link the user to an employee record.</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${invitesEnabled ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {invitesEnabled ? "Invites configured" : "Invites not configured"}
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="rounded-2xl border px-4 py-3" placeholder="Full name" />
          <input value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-2xl border px-4 py-3" placeholder="Email" />
          <input value={phone} onChange={(event) => setPhone(event.target.value)} className="rounded-2xl border px-4 py-3" placeholder="Phone" />
          <select value={role} onChange={(event) => setRole(event.target.value as Exclude<AppRole, "owner">)} className="rounded-2xl border px-4 py-3">
            {managedRoleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3">
          <select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} className="w-full rounded-2xl border px-4 py-3">
            <option value="">Link to employee later</option>
            {employeeOptions.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={handleInvite} disabled={isInviting || !fullName.trim() || !email.trim()} className="rounded-2xl bg-zinc-900 px-5 py-3 text-white disabled:opacity-50">
            {isInviting ? "Inviting..." : "Create Invite"}
          </button>
          {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
        </div>
      </section>

      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold">User Access</h2>
          <p className="mt-1 text-sm text-zinc-600">Adjust role, status, and employee linking for existing users.</p>
        </div>

        <div className="mt-4 space-y-3">
          {users.map((user) => (
            <ManagedUserCard key={user.id} user={user} employeeOptions={employeeOptions} invitesEnabled={invitesEnabled} />
          ))}

          {users.length === 0 ? <p className="text-sm text-zinc-600">No users created yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
