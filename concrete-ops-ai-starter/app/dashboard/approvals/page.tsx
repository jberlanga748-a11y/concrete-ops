import Link from "next/link";
import { CheckCircle2Icon, EyeIcon, SendIcon } from "lucide-react";
import { ApprovalsList } from "@/components/approvals/ApprovalsList";
import { EmptyState, ErrorPanel } from "@/components/ui/feedback";
import { KpiTile, OperationalCard, PageHeader, RecordPreview, SectionHeader } from "@/components/ui/page-primitives";
import { requireOfficeUser } from "@/lib/auth/server";
import {
  getApprovals,
  getApprovalStatusOptions,
  getApprovalTypeOptions,
  type ApprovalRow,
} from "@/lib/db/queries";
import { formatTimestampDateOnly } from "@/lib/time/formatting";

function getApprovalTitle(approval: ApprovalRow) {
  if (approval.proposals) {
    const proposal = Array.isArray(approval.proposals) ? approval.proposals[0] : approval.proposals;
    if (proposal) return proposal.title;
  }
  if (approval.change_orders) {
    const changeOrder = Array.isArray(approval.change_orders) ? approval.change_orders[0] : approval.change_orders;
    if (changeOrder) return changeOrder.title;
  }
  return "Approval";
}

function getRelatedHref(approval: ApprovalRow) {
  if (approval.approval_type === "proposal" && approval.proposal_id) return `/dashboard/proposals/${approval.proposal_id}`;
  if (approval.approval_type === "change_order" && approval.change_order_id) return `/dashboard/change-orders/${approval.change_order_id}`;
  return null;
}

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams?: Promise<{ approvalType?: string; status?: string }>;
}) {
  await requireOfficeUser("/dashboard/approvals");

  const params = (await searchParams) ?? {};
  const approvalType = params.approvalType?.trim() || "";
  const status = params.status?.trim() || "";
  const [{ data: approvals, error }, approvalTypes, approvalStatuses] = await Promise.all([
    getApprovals({
      approvalType: approvalType === "proposal" || approvalType === "change_order" ? approvalType : undefined,
      status:
        status === "sent" || status === "viewed" || status === "approved" || status === "rejected"
          ? status
          : undefined,
    }),
    getApprovalTypeOptions(),
    getApprovalStatusOptions(),
  ]);
  const approvalRows = approvals ?? [];
  const pendingCount = approvalRows.filter((approval) => ["sent", "viewed"].includes(approval.status)).length;
  const viewedCount = approvalRows.filter((approval) => approval.status === "viewed").length;
  const approvedCount = approvalRows.filter((approval) => approval.status === "approved").length;
  const latestApproval = approvalRows[0] ?? null;

  return (
    <div>
      <PageHeader
        eyebrow="Office"
        title="Approvals"
        description="Track proposal and change order decisions as an operational queue with sent, viewed, approved, and rejected states visible at a glance."
        actions={
          <Link href="/dashboard" className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-blue-50">
            Back to Dashboard
          </Link>
        }
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <KpiTile label="Pending decisions" value={pendingCount.toString()} helper="Sent or viewed approvals" icon={<SendIcon className="h-4 w-4" />} />
          <KpiTile label="Viewed" value={viewedCount.toString()} helper="Customers have opened them" icon={<EyeIcon className="h-4 w-4" />} />
          <KpiTile label="Approved" value={approvedCount.toString()} helper="Accepted in current view" icon={<CheckCircle2Icon className="h-4 w-4" />} />
        </div>

        <OperationalCard className="p-4">
          <SectionHeader title="Approval filters" description="Keep proposal and change-order decisions in one queue while narrowing by type or status." />
          <form method="get" className="flex flex-wrap gap-3">
            <select
              name="approvalType"
              defaultValue={approvalType}
              className="min-h-10 rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="">All types</option>
              {approvalTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              name="status"
              defaultValue={status}
              className="min-h-10 rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="">All statuses</option>
              {approvalStatuses.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button type="submit" className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-black text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800">
              Apply filters
            </button>
          </form>
        </OperationalCard>

        {error ? (
          <ErrorPanel
            title="We couldn’t load approvals right now"
            description="The approvals queue is temporarily unavailable. Try refreshing the page or come back in a moment."
            actionHref="/dashboard/approvals"
            actionLabel="Try again"
          />
        ) : approvalRows.length === 0 ? (
          <EmptyState
            icon="file"
            title="No approvals found"
            description="Approvals will show up here once proposals or change orders are sent out for review."
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <ApprovalsList approvals={approvalRows} />
            <RecordPreview
              title={latestApproval ? getApprovalTitle(latestApproval) : undefined}
              rows={[
                ["Type", latestApproval ? latestApproval.approval_type.replace("_", " ") : "—"],
                ["Status", latestApproval?.status ?? "—"],
                ["Sent", latestApproval ? formatTimestampDateOnly(latestApproval.sent_at) : "—"],
                ["Decision", latestApproval ? formatTimestampDateOnly(latestApproval.decided_at) : "—"],
              ]}
              actions={
                latestApproval && getRelatedHref(latestApproval) ? (
                  <Link href={getRelatedHref(latestApproval) ?? "/dashboard/approvals"} className="inline-flex rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">
                    Open Related
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
