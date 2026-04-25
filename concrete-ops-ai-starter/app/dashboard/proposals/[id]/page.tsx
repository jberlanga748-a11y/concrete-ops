import Link from "next/link";
import { notFound } from "next/navigation";
import { ApprovalsCard } from "@/components/approvals/ApprovalsCard";
import { RecordDeliveryCard } from "@/components/exports/RecordDeliveryCard";
import { ProposalForm } from "@/components/proposals/ProposalForm";
import { KpiTile, PageHeader, RecordPreview } from "@/components/ui/page-primitives";
import {
  getApprovalsForEntity,
  getCustomerOptions,
  getDailyReportJobOptions,
  getProposalById,
  getProposalSections,
  type ProposalDetailRow,
} from "@/lib/db/queries";
import { formatTimestamp } from "@/lib/time/formatting";

function getCustomer(customer: ProposalDetailRow["customers"]) {
  if (!customer) return null;
  if (Array.isArray(customer)) return customer[0] ?? null;
  return customer;
}

function getJob(job: ProposalDetailRow["jobs"]) {
  if (!job) return null;
  if (Array.isArray(job)) return job[0] ?? null;
  return job;
}

function getCreator(user: ProposalDetailRow["users"]) {
  if (!user) return null;
  if (Array.isArray(user)) return user[0] ?? null;
  return user;
}

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ data: proposal }, { data: sections }, { data: approvals }, customerOptions, jobOptions] = await Promise.all([
    getProposalById(id),
    getProposalSections(id),
    getApprovalsForEntity({ approvalType: "proposal", relatedId: id }),
    getCustomerOptions(true),
    getDailyReportJobOptions(),
  ]);

  if (!proposal) notFound();

  const customer = getCustomer(proposal.customers);
  const job = getJob(proposal.jobs);
  const creator = getCreator(proposal.users);

  return (
    <div>
      <PageHeader
        eyebrow="Proposal"
        title={proposal.title}
        description={[proposal.status, customer?.name, job ? `${job.job_number} · ${job.name}` : null].filter(Boolean).join(" · ")}
        actions={
          <Link href="/dashboard/proposals" className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-blue-50">
            Back to Proposals
          </Link>
        }
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-4 md:grid-cols-2">
            <KpiTile label="Sections" value={String((sections ?? []).length)} helper="Customer-facing proposal sections." />
            <KpiTile label="Status" value={proposal.status} helper="Proposal workflow state." />
          </div>
          <RecordPreview
            title={customer?.name || "Customer"}
            rows={[
              ["Contact", [customer?.contact_name, customer?.phone, customer?.email].filter(Boolean).join(" · ") || "No contact details"],
              ["Job", job ? `${job.job_number} · ${job.name}` : "—"],
              ["Created", formatTimestamp(proposal.created_at)],
              ["Owner", creator?.full_name || "—"],
            ]}
          />
        </div>

        <RecordDeliveryCard
          title="PDF + Email"
          description="Open a clean proposal PDF or send it by email without leaving this screen."
          recordType="proposal"
          recordId={proposal.id}
          pdfUrl={`/api/proposals/${proposal.id}/pdf`}
          defaultTo={customer?.email || ""}
          defaultSubject={`${proposal.title} proposal`}
        />

        <ProposalForm proposal={proposal} sections={sections ?? []} customerOptions={customerOptions} jobOptions={jobOptions} />

        <ApprovalsCard approvalType="proposal" relatedId={proposal.id} approvals={approvals ?? []} />
      </div>
    </div>
  );
}
