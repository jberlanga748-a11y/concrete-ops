import { PolicyAcknowledgmentButton } from "@/components/policies/PolicyAcknowledgmentButton";
import { EmptyState, ErrorPanel } from "@/components/ui/feedback";
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
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">Policies</h1>
        <p className="mt-3 text-zinc-600">Read active company policies and acknowledge anything still waiting on your signature.</p>
      </div>

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
            <section key={ack.id} className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{policy.title}</h2>
                  <p className="mt-1 text-sm text-zinc-600">
                    {[policy.category, policy.version_label, ack.status === "signed" ? `Signed ${formatTimestamp(ack.acknowledged_at)}` : "Awaiting acknowledgment"].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <PolicyAcknowledgmentButton policyId={policy.id} signed={ack.status === "signed"} />
              </div>
              <div className="mt-4 whitespace-pre-wrap rounded-2xl border bg-zinc-50 p-4 text-sm text-zinc-700">
                {policy.content}
              </div>
            </section>
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
  );
}
