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
import { getPolicies } from "@/lib/db/queries";

export default async function PoliciesPage() {
  const { data: policies, error } = await getPolicies();
  const policyRows = policies ?? [];
  const latestPolicy = policyRows[0] ?? null;

  return (
    <div>
      <PageHeader
        eyebrow="Safety"
        title="Policies"
        description="Manage company policies and track who has acknowledged the current guidance."
        actions={
          <Link href="/dashboard/policies/new" className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800">
            New Policy
          </Link>
        }
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        {error ? (
          <ErrorPanel
            title="We couldn’t load policies right now"
            description="The policy library is temporarily unavailable. Try refreshing the page or come back in a moment."
            actionHref="/dashboard/policies"
            actionLabel="Try again"
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <TableShell
              toolbar={
                <TableToolbar
                  title="Policy library"
                  description="Keep policy title, category, version, and active status readable from one operational list."
                  countLabel={`${policyRows.length} polic${policyRows.length === 1 ? "y" : "ies"}`}
                />
              }
            >
              <DataTable>
                <TableHead>
                  <tr>
                    <TableHeadCell>Policy</TableHeadCell>
                    <TableHeadCell className="hidden md:table-cell">Category</TableHeadCell>
                    <TableHeadCell className="hidden lg:table-cell">Version</TableHeadCell>
                    <TableHeadCell>Status</TableHeadCell>
                    <TableHeadCell className="w-32">Action</TableHeadCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {policyRows.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="min-w-[18rem]">
                        <p className="font-black text-slate-950">{policy.title}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">{policy.category || "Uncategorized"}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{policy.category || "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{policy.version_label || "—"}</TableCell>
                      <TableCell>
                        <StatusChip tone={policy.is_active ? "success" : "warning"}>{policy.is_active ? "Active" : "Inactive"}</StatusChip>
                      </TableCell>
                      <TableCell>
                        <TableActionLink href={`/dashboard/policies/${policy.id}`} label="Open" />
                      </TableCell>
                    </TableRow>
                  ))}
                  {policyRows.length === 0 ? (
                    <TableEmptyRow colSpan={5}>
                      <EmptyState
                        icon="file"
                        title="No policies created yet"
                        description="Create the first policy so crews and staff have a current guidance record to acknowledge."
                        actionHref="/dashboard/policies/new"
                        actionLabel="Create policy"
                      />
                    </TableEmptyRow>
                  ) : null}
                </TableBody>
              </DataTable>
            </TableShell>

            <RecordPreview
              title={latestPolicy?.title}
              rows={[
                ["Category", latestPolicy?.category || "—"],
                ["Version", latestPolicy?.version_label || "—"],
                ["Status", latestPolicy ? (latestPolicy.is_active ? "Active" : "Inactive") : "—"],
                ["Record", latestPolicy ? "Policy library" : "No record selected"],
              ]}
              actions={
                latestPolicy ? (
                  <Link href={`/dashboard/policies/${latestPolicy.id}`} className="inline-flex rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">
                    Open Policy
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
