import Link from "next/link";
import { notFound } from "next/navigation";
import { PolicyForm } from "@/components/policies/PolicyForm";
import { getPolicyAcknowledgments, getPolicyById, type PolicyAcknowledgmentRow } from "@/lib/db/queries";

function getEmployee(ack: PolicyAcknowledgmentRow["employees"]) {
  if (!ack) return null;
  if (Array.isArray(ack)) return ack[0] ?? null;
  return ack;
}

function getUser(user: PolicyAcknowledgmentRow["users"]) {
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

export default async function PolicyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ data: policy }, { data: acknowledgments }] = await Promise.all([
    getPolicyById(id),
    getPolicyAcknowledgments(id),
  ]);

  if (!policy) notFound();

  const signedCount = (acknowledgments ?? []).filter((ack) => ack.status === "signed").length;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">{policy.title}</h1>
            <p className="mt-2 text-zinc-600">
              {[policy.category, policy.version_label, policy.is_active ? "Active" : "Inactive"].filter(Boolean).join(" · ")}
            </p>
          </div>
          <Link href="/dashboard/policies" className="rounded-xl border px-4 py-2 text-sm">
            Back to Policies
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Acknowledgments</h2>
          <p className="mt-2 text-sm text-zinc-700">
            {signedCount} of {(acknowledgments ?? []).length} signed
          </p>
        </section>

        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Last Updated</h2>
          <p className="mt-2 text-sm text-zinc-700">{formatDateTime(policy.updated_at)}</p>
        </section>
      </div>

      <PolicyForm policy={policy} />

      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Acknowledgment Tracking</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {(acknowledgments ?? []).map((ack) => {
            const employee = getEmployee(ack.employees);
            const user = getUser(ack.users);
            return (
              <li key={ack.id} className="rounded-2xl border p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{employee?.full_name || user?.full_name || user?.email || "Assigned user"}</p>
                    <p className="mt-1 text-zinc-600">
                      {[employee?.job_title, employee?.crew_name, user?.role, user?.email].filter(Boolean).join(" · ") || "No extra details"}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${ack.status === "signed" ? "bg-green-100 text-green-800" : "bg-zinc-100 text-zinc-600"}`}>
                    {ack.status}
                  </span>
                </div>
                <p className="mt-2 text-zinc-500">Acknowledged: {formatDateTime(ack.acknowledged_at)}</p>
              </li>
            );
          })}
          {(acknowledgments ?? []).length === 0 ? <li className="text-zinc-600">No acknowledgment rows yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}
