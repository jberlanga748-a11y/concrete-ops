import { EmptyState, StatusChip } from "@/components/ui/feedback";
import { getMyPPEItems, type PPEItemRow } from "@/lib/db/queries";
import { formatDateOnly } from "@/lib/time/formatting";

function getEmployee(employee: PPEItemRow["employees"]) {
  if (!employee) return null;
  if (Array.isArray(employee)) return employee[0] ?? null;
  return employee;
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

export default async function EmployeePPEPage() {
  const { data: items } = await getMyPPEItems();
  const replacementCount = (items ?? []).filter((item) => item.status === "needs_replacement").length;
  const fitCheckCount = (items ?? []).filter((item) => item.status === "pending_fit_check").length;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">My PPE</h1>
        <p className="mt-3 text-zinc-600">See what has been issued to you and what needs a fit check or replacement.</p>
      </div>

      {(items ?? []).length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Issued Items</p>
            <p className="mt-3 text-3xl font-semibold text-zinc-950">{items?.length ?? 0}</p>
            <p className="mt-2 text-sm text-zinc-600">Current PPE records assigned to your account.</p>
          </div>
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Needs Replacement</p>
            <p className="mt-3 text-3xl font-semibold text-zinc-950">{replacementCount}</p>
            <p className="mt-2 text-sm text-zinc-600">Items that need office follow-up or reissue.</p>
          </div>
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Pending Fit Check</p>
            <p className="mt-3 text-3xl font-semibold text-zinc-950">{fitCheckCount}</p>
            <p className="mt-2 text-sm text-zinc-600">Items still waiting on sizing or fit confirmation.</p>
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        {(items ?? []).map((item) => {
          const employee = getEmployee(item.employees);
          return (
            <section key={item.id} className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{item.item_name}</h2>
                  <p className="mt-1 text-sm text-zinc-600">
                    {[employee?.full_name, employee?.crew_name, formatLabel(item.status)].filter(Boolean).join(" / ")}
                  </p>
                </div>
                <StatusChip tone={item.status === "issued" ? "success" : item.status === "needs_replacement" ? "warning" : "info"}>
                  {formatLabel(item.status)}
                </StatusChip>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border bg-zinc-50 p-4 text-sm text-zinc-700">
                  <p className="font-medium">Issued</p>
                  <p className="mt-1">{formatDateOnly(item.issued_at)}</p>
                </div>
                <div className="rounded-2xl border bg-zinc-50 p-4 text-sm text-zinc-700">
                  <p className="font-medium">Replacement Due</p>
                  <p className="mt-1">{formatDateOnly(item.replacement_due_at)}</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border bg-zinc-50 p-4 text-sm text-zinc-700">
                <p className="font-medium">Fit Notes</p>
                <p className="mt-1 whitespace-pre-wrap">{item.fit_notes || "-"}</p>
              </div>
            </section>
          );
        })}

        {(items ?? []).length === 0 ? (
          <EmptyState
            icon="alert"
            title="No PPE items are assigned yet"
            description="Once the office issues or records your PPE, it will show up here with replacement timing and fit notes."
          />
        ) : null}
      </div>
    </div>
  );
}
