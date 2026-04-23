import Link from "next/link";
import { EmptyState, ErrorPanel, StatusChip } from "@/components/ui/feedback";
import {
  DataTable,
  TableActionLink,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeadCell,
  TableRow,
  TableShell,
  TableToolbar,
} from "@/components/ui/table";
import { getToolboxTalks, type ToolboxTalkListRow } from "@/lib/db/queries";
import { formatDateOnly } from "@/lib/time/formatting";

function getForemanLabel(foreman: ToolboxTalkListRow["foreman_employee"]) {
  if (!foreman) return "—";
  if (Array.isArray(foreman)) return foreman[0]?.full_name ?? "—";
  return foreman.full_name;
}

function BoardStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="bg-white/92 px-5 py-4">
      <p className="font-app-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <p className="mt-3 text-[1.45rem] font-semibold tracking-[-0.05em] text-zinc-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{detail}</p>
    </div>
  );
}

function BoardFocusItem({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[20px] border border-white bg-white/92 px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
      <p className="font-app-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-zinc-950">{value}</p>
      <p className="mt-1 text-xs leading-5 text-zinc-600">{detail}</p>
    </div>
  );
}

export default async function ToolboxTalksPage() {
  const { data: talks, error } = await getToolboxTalks();
  const talkRows = talks ?? [];
  const uniqueForemen = new Set(talkRows.map((talk) => getForemanLabel(talk.foreman_employee)).filter((name) => name !== "—")).size;
  const latestTalk = talkRows[0] ?? null;

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-zinc-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(245,247,248,0.92))] p-6 shadow-[0_20px_48px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)] xl:items-start">
          <div className="min-w-0">
            <p className="font-app-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Safety Workflow</p>
            <h1 className="mt-4 text-[clamp(2rem,3vw,3.35rem)] font-semibold tracking-[-0.06em] text-[#101828]">
              Keep safety talks readable, current, and easy to follow up on.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-600 sm:text-base">
              Review the toolbox-talk log from a calmer office board, then move straight into the attendance or documentation record that still needs attention.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/dashboard/toolbox-talks/new"
                className="inline-flex items-center justify-center rounded-[22px] bg-[#101828] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1b2432]"
              >
                New toolbox talk
              </Link>
              {latestTalk ? (
                <Link
                  href={`/dashboard/toolbox-talks/${latestTalk.id}`}
                  className="inline-flex items-center justify-center rounded-[22px] border border-zinc-200 bg-white px-5 py-3.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
                >
                  Open latest talk
                </Link>
              ) : null}
            </div>
          </div>

          <div className="rounded-[30px] border border-[#d7e2ec] bg-[linear-gradient(135deg,#f4f8fb_0%,#ffffff_100%)] p-6 shadow-[0_20px_42px_rgba(15,23,42,0.06)]">
            <p className="font-app-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Board focus</p>
            <h2 className="mt-3 text-[1.3rem] font-semibold tracking-[-0.04em] text-zinc-950">Use the board as the safety follow-up layer.</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-600">
              Keep attendance and topic history readable from the office side so the next safety check-in starts from a trustworthy shared record.
            </p>
            <p className="mt-3 text-sm font-medium text-zinc-900">
              {latestTalk ? `${latestTalk.topic} · ${getForemanLabel(latestTalk.foreman_employee)}` : "Create the first safety talk to start the shared attendance record."}
            </p>

            <div className="mt-5 grid gap-3">
              <BoardFocusItem
                label="Latest topic"
                value={latestTalk?.topic ?? "No talk in view"}
                detail={latestTalk ? "Start the next attendance review from the newest documented safety topic." : "Create the first talk to start the safety record."}
              />
              <BoardFocusItem
                label="Foreman lead"
                value={latestTalk ? getForemanLabel(latestTalk.foreman_employee) : "No foreman recorded yet"}
                detail="Keep crew ownership visible whenever the office follows up on attendance."
              />
              <BoardFocusItem
                label="Most recent date"
                value={latestTalk ? formatDateOnly(latestTalk.talk_date) : "No recent talk yet"}
                detail="The board should make the freshest safety conversation obvious before you open a record."
              />
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-[28px] border border-white/85 bg-white/88 shadow-[0_18px_38px_rgba(15,23,42,0.05)]">
          <div className="grid gap-px bg-zinc-200/80 xl:grid-cols-3">
            <BoardStat
              label="Talks in view"
              value={talkRows.length}
              detail="Safety talks currently visible on the board."
            />
            <BoardStat
              label="Foremen represented"
              value={uniqueForemen}
              detail="Crew leaders contributing to the shared safety log."
            />
            <BoardStat
              label="Latest talk"
              value={latestTalk ? formatDateOnly(latestTalk.talk_date) : "—"}
              detail="Most recent toolbox-talk date visible in this view."
            />
          </div>
        </div>
      </section>

      {error ? (
        <ErrorPanel
          title="We couldn’t load toolbox talks right now"
          description="The toolbox-talk log is temporarily unavailable. Try refreshing the page or come back in a moment."
          actionHref="/dashboard/toolbox-talks"
          actionLabel="Try again"
        />
      ) : (
        <TableShell
          toolbar={
            <TableToolbar
              title="Toolbox-talk board"
              description="Review safety topics, attendance ownership, and the most recent talk history without losing the shared field context."
              countLabel={`${talkRows.length} talk${talkRows.length === 1 ? "" : "s"}`}
              actions={
                <Link
                  href="/dashboard/toolbox-talks/new"
                  className="inline-flex items-center justify-center rounded-[20px] border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:border-orange-300 hover:bg-orange-50"
                >
                  Add talk
                </Link>
              }
            >
              <div className="rounded-[24px] border border-white bg-white/88 p-5 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
                <p className="font-app-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Board orientation</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3 sm:divide-x sm:divide-zinc-200">
                  <div className="sm:pr-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Crew coverage</p>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.04em] text-zinc-950">{uniqueForemen}</p>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">Foremen currently represented in the shared safety record.</p>
                  </div>
                  <div className="sm:px-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Most recent talk</p>
                    <p className="mt-2 text-sm font-semibold tracking-[-0.03em] text-zinc-950">
                      {latestTalk ? formatDateOnly(latestTalk.talk_date) : "No recent talk yet."}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">Start from the newest attendance record before you dig deeper.</p>
                  </div>
                  <div className="sm:pl-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Safety posture</p>
                    <p className="mt-2 text-sm font-semibold tracking-[-0.03em] text-zinc-950">
                      {talkRows.length > 0 ? "Review the board for attendance and topic follow-up." : "No toolbox-talk activity yet."}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">Keep the log tight so safety follow-up never starts from stale paperwork.</p>
                  </div>
                </div>
              </div>
            </TableToolbar>
          }
        >
          <DataTable>
            <TableHead>
              <tr>
                <TableHeadCell>Talk</TableHeadCell>
                <TableHeadCell className="hidden md:table-cell">Foreman</TableHeadCell>
                <TableHeadCell className="hidden lg:table-cell">Date</TableHeadCell>
                <TableHeadCell className="w-40">Actions</TableHeadCell>
              </tr>
            </TableHead>
            <TableBody>
              {talkRows.map((talk) => (
                <TableRow key={talk.id}>
                  <TableCell className="min-w-[18rem]">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-app-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                            {formatDateOnly(talk.talk_date)}
                          </p>
                          <p className="mt-2 text-base font-semibold tracking-[-0.03em] text-zinc-950">{talk.topic}</p>
                        </div>
                        <StatusChip tone="info">Safety talk</StatusChip>
                      </div>

                      <div className="grid gap-2 text-xs text-zinc-600 md:hidden">
                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-3 py-2">
                          <p className="font-app-mono uppercase tracking-[0.16em] text-zinc-500">Foreman</p>
                          <p className="mt-1 text-sm font-medium text-zinc-900">{getForemanLabel(talk.foreman_employee)}</p>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="font-medium text-zinc-900">{getForemanLabel(talk.foreman_employee)}</p>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <p className="font-medium text-zinc-900">{formatDateOnly(talk.talk_date)}</p>
                  </TableCell>
                  <TableCell>
                    <TableActionLink href={`/dashboard/toolbox-talks/${talk.id}`} label="Open record" />
                  </TableCell>
                </TableRow>
              ))}
              {talkRows.length === 0 ? (
                <TableEmptyRow colSpan={4}>
                  <EmptyState
                    icon="users"
                    title="No toolbox talks logged yet"
                    description="Start the first safety talk so the crew has a clean attendance trail and the shared safety log stays current."
                    actionHref="/dashboard/toolbox-talks/new"
                    actionLabel="Create toolbox talk"
                  />
                </TableEmptyRow>
              ) : null}
            </TableBody>
          </DataTable>
        </TableShell>
      )}
    </div>
  );
}
