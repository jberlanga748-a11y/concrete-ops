import Link from "next/link";
import { EmptyState, ErrorPanel, StatusChip } from "@/components/ui/feedback";
import { PageHeader, RecordPreview } from "@/components/ui/page-primitives";
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

export default async function ToolboxTalksPage() {
  const { data: talks, error } = await getToolboxTalks();
  const talkRows = talks ?? [];
  const latestTalk = talkRows[0] ?? null;

  return (
    <div>
      <PageHeader
        eyebrow="Safety"
        title="Toolbox Talks"
        description="Review safety topics, attendance ownership, and the most recent talk history without losing the shared field context."
        actions={
          <Link href="/dashboard/toolbox-talks/new" className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800">
            New Talk
          </Link>
        }
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        {error ? (
          <ErrorPanel
            title="We couldn’t load toolbox talks right now"
            description="The toolbox-talk log is temporarily unavailable. Try refreshing the page or come back in a moment."
            actionHref="/dashboard/toolbox-talks"
            actionLabel="Try again"
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <TableShell
              toolbar={
                <TableToolbar
                  title="Toolbox-talk board"
                  description="Keep topic, foreman, date, and record action visible for safety follow-up."
                  countLabel={`${talkRows.length} talk${talkRows.length === 1 ? "" : "s"}`}
                />
              }
            >
              <DataTable>
                <TableHead>
                  <tr>
                    <TableHeadCell>Talk</TableHeadCell>
                    <TableHeadCell className="hidden md:table-cell">Foreman</TableHeadCell>
                    <TableHeadCell className="hidden lg:table-cell">Date</TableHeadCell>
                    <TableHeadCell>Status</TableHeadCell>
                    <TableHeadCell className="w-32">Action</TableHeadCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {talkRows.map((talk) => (
                    <TableRow key={talk.id}>
                      <TableCell className="min-w-[18rem]">
                        <p className="font-black text-slate-950">{talk.topic}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">{formatDateOnly(talk.talk_date)}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{getForemanLabel(talk.foreman_employee)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{formatDateOnly(talk.talk_date)}</TableCell>
                      <TableCell>
                        <StatusChip tone="info">Safety talk</StatusChip>
                      </TableCell>
                      <TableCell>
                        <TableActionLink href={`/dashboard/toolbox-talks/${talk.id}`} label="Open" />
                      </TableCell>
                    </TableRow>
                  ))}
                  {talkRows.length === 0 ? (
                    <TableEmptyRow colSpan={5}>
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

            <RecordPreview
              title={latestTalk?.topic}
              rows={[
                ["Foreman", latestTalk ? getForemanLabel(latestTalk.foreman_employee) : "—"],
                ["Date", latestTalk ? formatDateOnly(latestTalk.talk_date) : "—"],
                ["Status", latestTalk ? "Safety talk" : "—"],
                ["Record", latestTalk ? "Toolbox talk" : "No record selected"],
              ]}
              actions={
                latestTalk ? (
                  <Link href={`/dashboard/toolbox-talks/${latestTalk.id}`} className="inline-flex rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">
                    Open Talk
                  </Link>
                ) : null
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
