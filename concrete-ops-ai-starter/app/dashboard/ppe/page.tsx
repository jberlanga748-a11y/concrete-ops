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
import { getPPEItems, type PPEItemRow } from "@/lib/db/queries";
import { formatDateOnly } from "@/lib/time/formatting";

function getEmployee(employee: PPEItemRow["employees"]) {
  if (!employee) return null;
  if (Array.isArray(employee)) return employee[0] ?? null;
  return employee;
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

export default async function PPEPage() {
  const { data: items, error } = await getPPEItems();
  const itemRows = items ?? [];
  const latestItem = itemRows[0] ?? null;
  const latestEmployee = latestItem ? getEmployee(latestItem.employees) : null;

  return (
    <div>
      <PageHeader
        eyebrow="Safety"
        title="PPE Tracking"
        description="Track issued PPE, fit checks, and replacement timing across the crew."
        actions={
          <Link href="/dashboard/ppe/new" className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800">
            New PPE Item
          </Link>
        }
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        {error ? (
          <ErrorPanel
            title="We couldn’t load PPE tracking right now"
            description="The PPE log is temporarily unavailable. Try refreshing the page or come back in a moment."
            actionHref="/dashboard/ppe"
            actionLabel="Try again"
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <TableShell
              toolbar={
                <TableToolbar
                  title="PPE log"
                  description="Issued equipment, status, dates, and employee ownership stay visible in one dense safety board."
                  countLabel={`${itemRows.length} item${itemRows.length === 1 ? "" : "s"}`}
                />
              }
            >
              <DataTable>
                <TableHead>
                  <tr>
                    <TableHeadCell>Employee</TableHeadCell>
                    <TableHeadCell>Item</TableHeadCell>
                    <TableHeadCell>Status</TableHeadCell>
                    <TableHeadCell className="hidden md:table-cell">Issued</TableHeadCell>
                    <TableHeadCell className="hidden lg:table-cell">Replacement Due</TableHeadCell>
                    <TableHeadCell className="w-32">Action</TableHeadCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {itemRows.map((item) => {
                    const employee = getEmployee(item.employees);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="min-w-[14rem]">
                          <p className="font-black text-slate-950">{employee?.full_name || "Employee"}</p>
                          <p className="mt-1 text-xs font-bold text-slate-500">{[employee?.job_title, employee?.crew_name].filter(Boolean).join(" · ") || "—"}</p>
                        </TableCell>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell>
                          <StatusChip tone={item.status === "issued" ? "success" : item.status === "needs_replacement" ? "warning" : "info"}>
                            {formatLabel(item.status)}
                          </StatusChip>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{formatDateOnly(item.issued_at)}</TableCell>
                        <TableCell className="hidden lg:table-cell">{formatDateOnly(item.replacement_due_at)}</TableCell>
                        <TableCell>
                          <TableActionLink href={`/dashboard/ppe/${item.id}`} label="Open" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {itemRows.length === 0 ? (
                    <TableEmptyRow colSpan={6}>
                      <EmptyState
                        icon="file"
                        title="No PPE items tracked yet"
                        description="Log the first issued item so replacement timing and fit-check follow-up stay visible for the crew."
                        actionHref="/dashboard/ppe/new"
                        actionLabel="Add PPE item"
                      />
                    </TableEmptyRow>
                  ) : null}
                </TableBody>
              </DataTable>
            </TableShell>

            <RecordPreview
              title={latestItem?.item_name}
              rows={[
                ["Employee", latestEmployee?.full_name || "—"],
                ["Status", latestItem ? formatLabel(latestItem.status) : "—"],
                ["Issued", latestItem ? formatDateOnly(latestItem.issued_at) : "—"],
                ["Due", latestItem ? formatDateOnly(latestItem.replacement_due_at) : "—"],
              ]}
              actions={
                latestItem ? (
                  <Link href={`/dashboard/ppe/${latestItem.id}`} className="inline-flex rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">
                    Open PPE Item
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
