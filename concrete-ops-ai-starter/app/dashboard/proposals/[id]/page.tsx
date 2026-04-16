import Link from "next/link";
import { notFound } from "next/navigation";
import { ApprovalsCard } from "@/components/approvals/ApprovalsCard";
import { RecordDeliveryCard } from "@/components/exports/RecordDeliveryCard";
import { ProposalForm } from "@/components/proposals/ProposalForm";
import {
  getApprovalsForEntity,
  getCustomerOptions,
  getDailyReportJobOptions,
  getProposalById,
  getProposalSections,
  type ProposalDetailRow,
} from "@/lib/db/queries";

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
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">{proposal.title}</h1>
            <p className="mt-2 text-zinc-600">
              {[proposal.status, customer?.name, job ? `${job.job_number} · ${job.name}` : null].filter(Boolean).join(" · ")}
            </p>
          </div>
          <Link href="/dashboard/proposals" className="rounded-xl border px-4 py-2 text-sm">
            Back to Proposals
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Customer</h2>
          <p className="mt-2">{customer?.name || "—"}</p>
          <p className="mt-1 text-sm text-zinc-600">
            {[customer?.contact_name, customer?.phone, customer?.email].filter(Boolean).join(" · ") || "No contact details"}
          </p>
        </section>
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Sections</h2>
          <p className="mt-2 text-sm text-zinc-700">{(sections ?? []).length} section{(sections ?? []).length === 1 ? "" : "s"}</p>
        </section>
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Created</h2>
          <p className="mt-2 text-sm text-zinc-700">{formatDateTime(proposal.created_at)}</p>
          <p className="mt-1 text-sm text-zinc-600">{creator?.full_name || "—"}</p>
        </section>
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
  );
}
