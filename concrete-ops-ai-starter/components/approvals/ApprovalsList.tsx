"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ViewerDateTime } from "@/components/time/ViewerDateTime";
import { StatusChip } from "@/components/ui/feedback";
import { updateApprovalStatus } from "@/lib/db/mutations";
import type { ApprovalRow } from "@/lib/db/queries";

export function getApprovalTitle(approval: ApprovalRow) {
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

export function getApprovalRelatedHref(approval: ApprovalRow) {
  if (approval.approval_type === "proposal" && approval.proposal_id) return `/dashboard/proposals/${approval.proposal_id}`;
  if (approval.approval_type === "change_order" && approval.change_order_id) return `/dashboard/change-orders/${approval.change_order_id}`;
  return null;
}

function getApprovalStatusTone(status: string): "neutral" | "success" | "info" | "error" | "warning" {
  if (status === "approved") return "success";
  if (status === "rejected") return "error";
  if (status === "viewed") return "warning";
  if (status === "sent") return "info";
  return "neutral";
}

export function ApprovalsList({
  approvals,
}: {
  approvals: ApprovalRow[];
}) {
  const router = useRouter();

  async function handleStatusChange(approvalId: string, status: "viewed" | "approved" | "rejected") {
    await updateApprovalStatus({ approvalId, status });
    router.refresh();
  }

  return (
    <ul className="divide-y divide-blue-50 rounded-2xl border border-blue-100 bg-white shadow-sm shadow-blue-950/5">
      {approvals.map((approval) => {
        const relatedHref = getApprovalRelatedHref(approval);
        return (
          <li key={approval.id} className="p-4 transition-colors hover:bg-blue-50/50">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-widest text-blue-700">{approval.approval_type.replace("_", " ")}</p>
                <p className="mt-1 font-black text-slate-950">{getApprovalTitle(approval)}</p>
                <p className="mt-1 text-sm font-bold text-slate-500">
                  Sent{" "}
                  <ViewerDateTime value={approval.sent_at} includeYear includeTimeZoneName={false} />
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Viewed: <ViewerDateTime value={approval.viewed_at} includeYear includeTimeZoneName={false} /> · Decided:{" "}
                  <ViewerDateTime value={approval.decided_at} includeYear includeTimeZoneName={false} />
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip tone={getApprovalStatusTone(approval.status)}>{approval.status}</StatusChip>
                {relatedHref ? (
                  <Link href={relatedHref} className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-blue-50">
                    Open Related
                  </Link>
                ) : null}
                {approval.status === "sent" ? (
                  <button onClick={() => handleStatusChange(approval.id, "viewed")} className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-blue-50">
                    Mark Viewed
                  </button>
                ) : null}
                {["sent", "viewed"].includes(approval.status) ? (
                  <>
                    <button onClick={() => handleStatusChange(approval.id, "approved")} className="rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">
                      Approve
                    </button>
                    <button onClick={() => handleStatusChange(approval.id, "rejected")} className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-100">
                      Reject
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
      {approvals.length === 0 ? (
        <li className="p-6 text-sm font-bold text-slate-600">
          No approvals found.
        </li>
      ) : null}
    </ul>
  );
}
