import Link from "next/link";
import { EmptyState, ErrorPanel } from "@/components/ui/feedback";
import { FilterBar, PageHeader } from "@/components/ui/page-primitives";
import {
  DataTable,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeadCell,
  TableRow,
  TableShell,
  TableToolbar,
} from "@/components/ui/table";
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
  const { data: logs, error } = await getAuditLogs({
    actionType: actionType || undefined,
    targetTable: targetTable || undefined,
  });
  const logRows = logs ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Audit Logs"
        description="Track important app actions with actor, target record, and a short activity summary."
        actions={
          <Link href="/dashboard" className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-blue-50">
            Back to Dashboard
          </Link>
        }
      />

      <div className="px-5 sm:px-6 lg:px-8">
        {error ? (
          <ErrorPanel
            title="We couldn’t load audit logs right now"
            description="The audit log is temporarily unavailable. Try refreshing the page or come back in a moment."
            actionHref="/dashboard/audit-logs"
            actionLabel="Try again"
          />
        ) : (
          <TableShell
            toolbar={
              <TableToolbar
                title="Audit log"
                description="Actor, action, target, and summary stay visible in one dense administrative table."
                countLabel={`${logRows.length} event${logRows.length === 1 ? "" : "s"}`}
              />
            }
            filters={
              <FilterBar>
                <form method="get" className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center">
                  <input
                    name="actionType"
                    defaultValue={actionType}
                    placeholder="Filter by action type"
                    className="h-10 rounded-xl border border-blue-100 bg-white px-3 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500"
                  />
                  <input
                    name="targetTable"
                    defaultValue={targetTable}
                    placeholder="Filter by target table"
                    className="h-10 rounded-xl border border-blue-100 bg-white px-3 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500"
                  />
                  <button type="submit" className="h-10 rounded-xl bg-blue-700 px-4 text-sm font-black text-white hover:bg-blue-800">
                    Apply
                  </button>
                </form>
              </FilterBar>
            }
          >
            <DataTable>
              <TableHead>
                <tr>
                  <TableHeadCell>When</TableHeadCell>
                  <TableHeadCell>Actor</TableHeadCell>
                  <TableHeadCell>Action</TableHeadCell>
                  <TableHeadCell className="hidden lg:table-cell">Target</TableHeadCell>
                  <TableHeadCell>Summary</TableHeadCell>
                </tr>
              </TableHead>
              <TableBody>
                {logRows.map((log) => {
                  const actorUser = getActorUser(log.actor_user);
                  const actorEmployee = getActorEmployee(log.actor_employee);
                  return (
                    <TableRow key={log.id}>
                      <TableCell>{formatTimestamp(log.created_at)}</TableCell>
                      <TableCell className="min-w-[14rem]">
                        <p className="font-black text-slate-950">{actorUser?.full_name || actorEmployee?.full_name || "System"}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {[actorUser?.role, actorUser?.email, actorEmployee?.job_title, actorEmployee?.crew_name].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </TableCell>
                      <TableCell>{log.action_type}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <p className="font-bold text-slate-700">{log.target_table}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">{log.target_id}</p>
                      </TableCell>
                      <TableCell>{log.summary}</TableCell>
                    </TableRow>
                  );
                })}
                {logRows.length === 0 ? (
                  <TableEmptyRow colSpan={5}>
                    <EmptyState
                      icon="table"
                      title="No audit log entries found"
                      description="Important app actions will appear here once the workspace starts recording activity against tracked records."
                    />
                  </TableEmptyRow>
                ) : null}
              </TableBody>
            </DataTable>
          </TableShell>
        )}
      </div>
    </div>
  );
}
