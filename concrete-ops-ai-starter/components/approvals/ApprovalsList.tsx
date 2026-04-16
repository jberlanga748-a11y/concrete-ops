"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateApprovalStatus } from "@/lib/db/mutations";
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

function getRelatedHref(approval: ApprovalRow) {
  if (approval.approval_type === "proposal" && approval.proposal_id) return `/dashboard/proposals/${approval.proposal_id}`;
  if (approval.approval_type === "change_order" && approval.change_order_id) return `/dashboard/change-orders/${approval.change_order_id}`;
  return null;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
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
    <ul className="space-y-3">
      {approvals.map((approval) => {
        const relatedHref = getRelatedHref(approval);
        return (
          <li key={approval.id} className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-zinc-900">{getTitle(approval)}</p>
                <p className="mt-1 text-sm text-zinc-600">
                  {[approval.approval_type, approval.status, `Sent ${formatDateTime(approval.sent_at)}`].join(" · ")}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Viewed: {formatDateTime(approval.viewed_at)} · Decided: {formatDateTime(approval.decided_at)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {relatedHref ? (
                  <Link href={relatedHref} className="rounded-xl border px-3 py-2 text-xs font-medium">
                    Open Related
                  </Link>
                ) : null}
                {approval.status === "sent" ? (
                  <button onClick={() => handleStatusChange(approval.id, "viewed")} className="rounded-xl border px-3 py-2 text-xs font-medium">
                    Mark Viewed
                  </button>
                ) : null}
                {["sent", "viewed"].includes(approval.status) ? (
                  <>
                    <button onClick={() => handleStatusChange(approval.id, "approved")} className="rounded-xl border px-3 py-2 text-xs font-medium">
                      Approve
                    </button>
                    <button onClick={() => handleStatusChange(approval.id, "rejected")} className="rounded-xl border px-3 py-2 text-xs font-medium">
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
        <li className="rounded-2xl border bg-white p-6 text-zinc-600 shadow-sm">
          No approvals found.
        </li>
      ) : null}
    </ul>
  );
}
