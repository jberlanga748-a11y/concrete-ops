import { PolicyAcknowledgmentButton } from "@/components/policies/PolicyAcknowledgmentButton";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { getMyPolicyAcknowledgments, type PolicyDetailRow } from "@/lib/db/queries";

function getPolicy(policy: PolicyDetailRow[] | PolicyDetailRow | null) {
  if (!policy) return null;
  if (Array.isArray(policy)) return policy[0] ?? null;
  return policy;
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

export default async function EmployeePoliciesPage() {
  const { data: acknowledgments } = await getMyPolicyAcknowledgments();
  const activeAcknowledgments = (acknowledgments ?? []).filter((ack) => {
    const policy = getPolicy(ack.policies);
    return policy?.is_active;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Policies" description="Read active company policies and acknowledge anything still waiting on your signature." />

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
                    {[policy.category, policy.version_label, ack.status === "signed" ? `Signed ${formatDateTime(ack.acknowledged_at)}` : "Awaiting acknowledgment"].filter(Boolean).join(" · ")}
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
          <EmptyState title="No active policy acknowledgments" description="You’re all caught up for now. New policy acknowledgments will appear here automatically." />
        ) : null}
      </div>
    </div>
  );
}
