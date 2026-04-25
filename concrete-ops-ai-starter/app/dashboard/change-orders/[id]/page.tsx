import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ApprovalsCard } from "@/components/approvals/ApprovalsCard";
import { DocumentList } from "@/components/documents/DocumentList";
import { RecordDeliveryCard } from "@/components/exports/RecordDeliveryCard";
import { EmptyState, StatusChip } from "@/components/ui/feedback";
import { KpiTile, OperationalCard, PageHeader, RecordPreview, SectionHeader } from "@/components/ui/page-primitives";
import {
  getChangeOrderById,
  getApprovalsForEntity,
  getDocumentsForEntity,
  getChangeOrderLineItems,
  type ChangeOrderDetailRow,
} from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";

function getJobLabel(jobs: ChangeOrderDetailRow["jobs"]) {
  if (!jobs) return "—";
  if (Array.isArray(jobs)) {
    const job = jobs[0];
    return job ? `${job.job_number} · ${job.name}` : "—";
  }
  return `${jobs.job_number} · ${jobs.name}`;
}

function getReportLabel(reports: ChangeOrderDetailRow["daily_reports"]) {
  if (!reports) return "—";
  if (Array.isArray(reports)) {
    const report = reports[0];
    return report ? `${report.report_date} (${report.id})` : "—";
  }
  return `${reports.report_date} (${reports.id})`;
}

function formatCurrency(value: number | string | null | undefined) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default async function ChangeOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { id } = params;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: appUser } = user
    ? await supabase.from("users").select("role").eq("auth_user_id", user.id).maybeSingle()
    : { data: null };
  const isForeman = appUser?.role === "foreman";

  const [{ data: changeOrder }, { data: lineItems }, { data: documents }, { data: approvals }] =
    await Promise.all([
      getChangeOrderById(id),
      getChangeOrderLineItems(id),
      getDocumentsForEntity("change_order", id),
      getApprovalsForEntity({ approvalType: "change_order", relatedId: id }),
    ]);

  if (!changeOrder) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="Change Order"
        title={changeOrder.title}
        description={getJobLabel(changeOrder.jobs)}
        actions={
          <>
            <Link href={`/dashboard/change-orders/${changeOrder.id}/edit`} className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-blue-50">
              Edit Change Order
            </Link>
            <Link href="/dashboard/change-orders" className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-blue-50">
              Back to Change Orders
            </Link>
          </>
        }
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-4 md:grid-cols-2">
            <KpiTile label="Status" value={changeOrder.status} helper="Current lifecycle state." />
            <KpiTile
              label={isForeman ? "Line items" : "Total Amount"}
              value={isForeman ? String((lineItems ?? []).length) : formatCurrency(changeOrder.total_amount)}
              helper={isForeman ? "Cost detail hidden for foreman view." : "Customer-facing change order total."}
            />
          </div>
          <RecordPreview
            title="Change order summary"
            rows={[
              ["Job", getJobLabel(changeOrder.jobs)],
              ["Report", getReportLabel(changeOrder.daily_reports)],
              ["Status", <StatusChip tone="info">{changeOrder.status}</StatusChip>],
              ["Description", changeOrder.description || "—"],
              ...(!isForeman
                ? ([
                    ["Direct cost", formatCurrency(changeOrder.direct_cost_total)],
                    ["Markup", `${changeOrder.markup_percent}%`],
                  ] as Array<[string, ReactNode]>)
                : []),
            ]}
          />
        </div>

        <OperationalCard className="p-4">
          <SectionHeader title="Linked Field Proof" description="Photos and documents connected to the change order." />
          <DocumentList documents={documents ?? []} emptyMessage="No linked field proof files." />
        </OperationalCard>

        <RecordDeliveryCard
          title="PDF + Email"
          description="Export a clean change order PDF or send/resend it by email."
          recordType="change_order"
          recordId={changeOrder.id}
          pdfUrl={`/api/change-orders/${changeOrder.id}/pdf`}
          defaultSubject={`${changeOrder.title} change order`}
        />

        <ApprovalsCard approvalType="change_order" relatedId={changeOrder.id} approvals={approvals ?? []} />

        <OperationalCard className="p-4">
          <SectionHeader title="Line Items" description="Cost rows attached to this change order." />
          <ul className="space-y-2 text-sm">
            {(lineItems ?? []).map((item) => (
              <li key={item.id} className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 font-bold text-slate-700">
                {item.description} · Qty {item.quantity} · Unit {formatCurrency(item.unit_cost)} · Total {formatCurrency(item.line_total)}
              </li>
            ))}

            {(lineItems ?? []).length === 0 ? (
              <li>
                <EmptyState icon="file" title="No line items yet" description="Add line items when the change order needs a cost breakdown." />
              </li>
            ) : null}
          </ul>
        </OperationalCard>
      </div>
    </div>
  );
}
