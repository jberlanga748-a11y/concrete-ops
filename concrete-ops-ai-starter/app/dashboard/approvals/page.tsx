import Link from "next/link";
import { ApprovalsList } from "@/components/approvals/ApprovalsList";
import { requireOfficeUser } from "@/lib/auth/server";
import {
  getApprovals,
  getApprovalStatusOptions,
  getApprovalTypeOptions,
} from "@/lib/db/queries";

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams?: Promise<{ approvalType?: string; status?: string }>;
}) {
  await requireOfficeUser("/dashboard/approvals");

  const params = (await searchParams) ?? {};
  const approvalType = params.approvalType?.trim() || "";
  const status = params.status?.trim() || "";
  const [{ data: approvals }, approvalTypes, approvalStatuses] = await Promise.all([
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

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Approvals</h1>
            <p className="mt-2 text-zinc-600">Track proposal and change order approvals with simple sent, viewed, approved, and rejected states.</p>
          </div>
          <Link href="/dashboard" className="rounded-xl border px-4 py-2 text-sm">
            Back to Dashboard
          </Link>
        </div>
      </div>

      <form method="get" className="flex flex-wrap gap-3 rounded-2xl border bg-white p-4">
        <select
          name="approvalType"
          defaultValue={approvalType}
          className="rounded-xl border px-3 py-2 text-sm"
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
          className="rounded-xl border px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {approvalStatuses.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button type="submit" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white">
          Apply filters
        </button>
      </form>

      <ApprovalsList approvals={approvals ?? []} />
    </div>
  );
}
