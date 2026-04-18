import Link from "next/link";
import { EmptyState, ErrorPanel } from "@/components/ui/feedback";
import { getPolicies } from "@/lib/db/queries";

export default async function PoliciesPage() {
  const { data: policies, error } = await getPolicies();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Policies</h1>
            <p className="mt-2 text-zinc-600">Manage company policies and track who has acknowledged the current guidance.</p>
          </div>
          <Link href="/dashboard/policies/new" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white">
            New Policy
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        {error ? (
          <div className="p-4">
            <ErrorPanel
              title="We couldn’t load policies right now"
              description="The policy library is temporarily unavailable. Try refreshing the page or come back in a moment."
              actionHref="/dashboard/policies"
              actionLabel="Try again"
            />
          </div>
        ) : (policies ?? []).length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon="file"
              title="No policies created yet"
              description="Create the first policy so crews and staff have a current guidance record to acknowledge."
              actionHref="/dashboard/policies/new"
              actionLabel="Create policy"
            />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-100">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Version</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Open</th>
              </tr>
            </thead>
            <tbody>
              {(policies ?? []).map((policy) => (
                <tr key={policy.id} className="border-t">
                  <td className="px-4 py-4">{policy.title}</td>
                  <td className="px-4 py-4">{policy.category || "—"}</td>
                  <td className="px-4 py-4">{policy.version_label || "—"}</td>
                  <td className="px-4 py-4">{policy.is_active ? "Active" : "Inactive"}</td>
                  <td className="px-4 py-4">
                    <Link href={`/dashboard/policies/${policy.id}`} className="underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
