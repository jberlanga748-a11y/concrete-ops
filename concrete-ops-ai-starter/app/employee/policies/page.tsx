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
  const pendingAcknowledgments = activeAcknowledgments.filter((ack) => ack.status !== "signed");
  const signedAcknowledgments = activeAcknowledgments.filter((ack) => ack.status === "signed");

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">Policies</h1>
        <p className="mt-3 text-zinc-600">
          Read active company policies and acknowledge anything still waiting on your signature. You currently have{" "}
          {pendingAcknowledgments.length} item{pendingAcknowledgments.length === 1 ? "" : "s"} awaiting acknowledgment.
        </p>
      </div>

      {error ? (
        <ErrorPanel
          title="We couldn’t load your policy acknowledgments"
          description="Policy records are temporarily unavailable right now. Try refreshing this page, and if that does not help, let the office know."
          actionHref="/employee/policies"
          actionLabel="Try again"
        />
      ) : null}

      {activeAcknowledgments.length === 0 ? (
        <EmptyState
          icon="shield"
          title="No active policy acknowledgments are waiting on you"
          description="You are caught up on active company policies right now. Any new or updated policy acknowledgments will show up here automatically."
          actionHref="/employee"
          actionLabel="Back to portal home"
        />
      ) : (
        <div className="space-y-6">
          {pendingAcknowledgments.length > 0 ? (
            <section className="space-y-4">
              <div className="rounded-3xl border bg-orange-50 p-5 shadow-sm">
                <h2 className="text-xl font-semibold text-zinc-950">Awaiting your acknowledgment</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-700">
                  Review these items and sign them so your compliance record stays current.
                </p>
              </div>

              {pendingAcknowledgments.map((ack) => {
                const policy = getPolicy(ack.policies);
                if (!policy) return null;

                return (
                  <section key={ack.id} className="rounded-3xl border bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-semibold">{policy.title}</h2>
                        <p className="mt-1 text-sm text-zinc-600">
                          {[policy.category, policy.version_label, "Awaiting acknowledgment"].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <PolicyAcknowledgmentButton policyId={policy.id} signed={false} />
                    </div>
                    <div className="mt-4 whitespace-pre-wrap rounded-2xl border bg-zinc-50 p-4 text-sm text-zinc-700">
                      {policy.content}
                    </div>
                  </section>
                );
              })}
            </section>
          ) : null}

          {signedAcknowledgments.length > 0 ? (
            <section className="space-y-4">
              <div className="rounded-3xl border bg-white p-5 shadow-sm">
                <h2 className="text-xl font-semibold text-zinc-950">Already acknowledged</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  These active policy acknowledgments are already complete and remain visible here for reference.
                </p>
              </div>

              {signedAcknowledgments.map((ack) => {
                const policy = getPolicy(ack.policies);
                if (!policy) return null;

                return (
                  <section key={ack.id} className="rounded-3xl border bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-semibold">{policy.title}</h2>
                        <p className="mt-1 text-sm text-zinc-600">
                          {[policy.category, policy.version_label, `Signed ${formatTimestamp(ack.acknowledged_at)}`]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <PolicyAcknowledgmentButton policyId={policy.id} signed />
                    </div>
                    <div className="mt-4 whitespace-pre-wrap rounded-2xl border bg-zinc-50 p-4 text-sm text-zinc-700">
                      {policy.content}
                    </div>
                  </section>
                );
              })}
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
