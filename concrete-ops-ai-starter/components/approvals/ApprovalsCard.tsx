"use client";

import { useRouter } from "next/navigation";
import { ViewerDateTime } from "@/components/time/ViewerDateTime";
import { OperationalCard, SectionHeader } from "@/components/ui/page-primitives";
import { createApproval, updateApprovalStatus } from "@/lib/db/mutations";
import type { ApprovalRow } from "@/lib/db/queries";

function getTitle(approval: ApprovalRow) {
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
export function ApprovalsCard({
  approvalType,
  relatedId,
  approvals,
}: {
  approvalType: "proposal" | "change_order";
  relatedId: string;
  approvals: ApprovalRow[];
}) {
  const router = useRouter();
  const latestApproval = approvals[0] ?? null;
  const hasOpenApproval = latestApproval ? ["sent", "viewed"].includes(latestApproval.status) : false;

  async function handleSend() {
    await createApproval({ approvalType, relatedId });
    router.refresh();
  }

  async function handleStatusChange(approvalId: string, status: "viewed" | "approved" | "rejected") {
    await updateApprovalStatus({ approvalId, status });
    router.refresh();
  }

  return (
    <OperationalCard className="p-4">
      <SectionHeader
        title="Approvals"
        description="Send and manage proposal or change order approval status."
        action={
        <button type="button" onClick={handleSend} disabled={hasOpenApproval} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-black text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800 disabled:opacity-50">
          {hasOpenApproval ? "Approval Pending" : approvals.length > 0 ? "Send Again" : "Send Approval"}
        </button>
        }
      />

      <ul className="mt-4 space-y-3 text-sm">
        {approvals.map((approval) => (
          <li key={approval.id} className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-black text-slate-950">{getTitle(approval)}</p>
                <p className="mt-1 font-bold text-slate-500">
                  <span className="capitalize">{approval.approval_type}</span> · {approval.status} · Sent{" "}
                  <ViewerDateTime value={approval.sent_at} includeYear includeTimeZoneName={false} />
                </p>
                <p className="mt-1 font-medium text-slate-500">
                  Viewed: <ViewerDateTime value={approval.viewed_at} includeYear includeTimeZoneName={false} /> · Decided:{" "}
                  <ViewerDateTime value={approval.decided_at} includeYear includeTimeZoneName={false} />
                </p>
              </div>
              {["sent", "viewed"].includes(approval.status) ? (
                <div className="flex flex-wrap gap-2">
                  {approval.status === "sent" ? (
                    <button type="button" onClick={() => handleStatusChange(approval.id, "viewed")} className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-blue-50">
                      Mark Viewed
                    </button>
                  ) : null}
                  <button type="button" onClick={() => handleStatusChange(approval.id, "approved")} className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-blue-50">
                    Approve
                  </button>
                  <button type="button" onClick={() => handleStatusChange(approval.id, "rejected")} className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-blue-50">
                    Reject
                  </button>
                </div>
              ) : null}
            </div>
          </li>
        ))}
        {approvals.length === 0 ? <li className="rounded-xl border border-dashed border-blue-200 bg-blue-50 p-4 font-medium text-slate-600">No approvals sent yet.</li> : null}
      </ul>
    </OperationalCard>
  );
}
