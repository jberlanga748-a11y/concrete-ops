"use client";

import { useRouter } from "next/navigation";
import { ViewerDateTime } from "@/components/time/ViewerDateTime";
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
    <section className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Approvals</h2>
          <p className="mt-1 text-sm text-zinc-600">Send and manage proposal or change order approval status.</p>
        </div>
        <button onClick={handleSend} disabled={hasOpenApproval} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50">
          {hasOpenApproval ? "Approval Pending" : approvals.length > 0 ? "Send Again" : "Send Approval"}
        </button>
      </div>

      <ul className="mt-4 space-y-3 text-sm">
        {approvals.map((approval) => (
          <li key={approval.id} className="rounded-2xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{getTitle(approval)}</p>
                <p className="mt-1 text-zinc-600">
                  <span className="capitalize">{approval.approval_type}</span> · {approval.status} · Sent{" "}
                  <ViewerDateTime value={approval.sent_at} includeYear includeTimeZoneName={false} />
                </p>
                <p className="mt-1 text-zinc-500">
                  Viewed: <ViewerDateTime value={approval.viewed_at} includeYear includeTimeZoneName={false} /> · Decided:{" "}
                  <ViewerDateTime value={approval.decided_at} includeYear includeTimeZoneName={false} />
                </p>
              </div>
              {["sent", "viewed"].includes(approval.status) ? (
                <div className="flex flex-wrap gap-2">
                  {approval.status === "sent" ? (
                    <button onClick={() => handleStatusChange(approval.id, "viewed")} className="rounded-xl border px-3 py-2 text-xs font-medium">
                      Mark Viewed
                    </button>
                  ) : null}
                  <button onClick={() => handleStatusChange(approval.id, "approved")} className="rounded-xl border px-3 py-2 text-xs font-medium">
                    Approve
                  </button>
                  <button onClick={() => handleStatusChange(approval.id, "rejected")} className="rounded-xl border px-3 py-2 text-xs font-medium">
                    Reject
                  </button>
                </div>
              ) : null}
            </div>
          </li>
        ))}
        {approvals.length === 0 ? <li className="text-zinc-600">No approvals sent yet.</li> : null}
      </ul>
    </section>
  );
}
