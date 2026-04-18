import Link from "next/link";
import { requireOfficeUser } from "@/lib/auth/server";
import { getAuditLogs, type AuditLogRow } from "@/lib/db/queries";
import { formatTimestamp } from "@/lib/time/formatting";

function getActorUser(actorUser: AuditLogRow["actor_user"]) {
  if (!actorUser) return null;
  if (Array.isArray(actorUser)) return actorUser[0] ?? null;
  return actorUser;
}

function getActorEmployee(actorEmployee: AuditLogRow["actor_employee"]) {
  if (!actorEmployee) return null;
  if (Array.isArray(actorEmployee)) return actorEmployee[0] ?? null;
  return actorEmployee;
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams?: Promise<{ actionType?: string; targetTable?: string }>;
}) {
  await requireOfficeUser("/dashboard/audit-logs");

  const params = (await searchParams) ?? {};
  const actionType = params.actionType?.trim() || "";
  const targetTable = params.targetTable?.trim() || "";
  const { data: logs } = await getAuditLogs({
    actionType: actionType || undefined,
    targetTable: targetTable || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">Audit Logs</h1>
        <p className="mt-2 text-zinc-600">Track important app actions with actor, target record, and a short activity summary.</p>
      </div>

      <form method="get" className="flex flex-wrap gap-3 rounded-2xl border bg-white p-4">
        <input
          name="actionType"
          defaultValue={actionType}
          placeholder="Filter by action type"
          className="rounded-xl border px-3 py-2 text-sm"
        />
        <input
          name="targetTable"
          defaultValue={targetTable}
          placeholder="Filter by target table"
          className="rounded-xl border px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white">
          Apply filters
        </button>
      </form>

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100">
            <tr>
              <th className="px-4 py-3 text-left">When</th>
              <th className="px-4 py-3 text-left">Actor</th>
              <th className="px-4 py-3 text-left">Action</th>
              <th className="px-4 py-3 text-left">Target</th>
              <th className="px-4 py-3 text-left">Summary</th>
            </tr>
          </thead>
          <tbody>
            {(logs ?? []).map((log) => {
              const actorUser = getActorUser(log.actor_user);
              const actorEmployee = getActorEmployee(log.actor_employee);
              return (
                <tr key={log.id} className="border-t align-top">
                  <td className="px-4 py-4">{formatTimestamp(log.created_at)}</td>
                  <td className="px-4 py-4">
                    <div>
                      <p>{actorUser?.full_name || actorEmployee?.full_name || "System"}</p>
                      <p className="text-xs text-zinc-500">
                        {[actorUser?.role, actorUser?.email, actorEmployee?.job_title, actorEmployee?.crew_name].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">{log.action_type}</td>
                  <td className="px-4 py-4">
                    <div>
                      <p>{log.target_table}</p>
                      <p className="text-xs text-zinc-500">{log.target_id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">{log.summary}</td>
                </tr>
              );
            })}
            {(logs ?? []).length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-zinc-600" colSpan={5}>
                  No audit log entries found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Link href="/dashboard" className="text-sm underline">
        Back to Dashboard
      </Link>
    </div>
  );
}
