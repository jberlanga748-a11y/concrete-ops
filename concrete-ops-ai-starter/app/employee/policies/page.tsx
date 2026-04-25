import { PolicyAcknowledgmentButton } from "@/components/policies/PolicyAcknowledgmentButton";
import { EmptyState, ErrorPanel } from "@/components/ui/feedback";
import { OperationalCard, PageHeader, SectionHeader } from "@/components/ui/page-primitives";
import { getMyPolicyAcknowledgments, type PolicyDetailRow } from "@/lib/db/queries";
import { formatTimestamp } from "@/lib/time/formatting";

function getPolicy(policy: PolicyDetailRow[] | PolicyDetailRow | null) {
  if (!policy) return null;
  if (Array.isArray(policy)) return policy[0] ?? null;
  return policy;
}

export default async function EmployeePoliciesPage() {
  const { data: acknowledgments, error } = await getMyPolicyAcknowledgments();
  const activeAcknowledgments = (acknowledgments ?? []).filter((ack) => {
    const policy = getPolicy(ack.policies);
    return policy?.is_active;
  });

  return (
    <div>
      <PageHeader
        eyebrow="Employee Workflow"
        title="Policies"
        description="Read active company policies and acknowledge anything still waiting on your signature."
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
      {error ? (
        <ErrorPanel
          title="We couldn’t load your policies right now"
          description="The employee policy workspace is temporarily unavailable. Try refreshing the page or come back in a moment."
          actionHref="/employee/policies"
          actionLabel="Try again"
        />
      ) : (
      <div className="space-y-4">
        {activeAcknowledgments.map((ack) => {
          const policy = getPolicy(ack.policies);
          if (!policy) return null;

          return (
            <OperationalCard key={ack.id} className="p-4">
              <SectionHeader
                title={policy.title}
                description={[policy.category, policy.version_label, ack.status === "signed" ? `Signed ${formatTimestamp(ack.acknowledged_at)}` : "Awaiting acknowledgment"].filter(Boolean).join(" · ")}
                action={<PolicyAcknowledgmentButton policyId={policy.id} signed={ack.status === "signed"} />}
              />
              <div className="mt-4 whitespace-pre-wrap rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm font-medium leading-6 text-slate-700">
                {policy.content}
              </div>
            </OperationalCard>
          );
        })}

        {activeAcknowledgments.length === 0 ? (
          <EmptyState
            icon="file"
            title="You are caught up on policy acknowledgments"
            description="There are no active company policies waiting on your signature right now. New or updated policies will show up here automatically."
          />
        ) : null}
      </div>
      )}
      </div>
    </div>
  );
}
