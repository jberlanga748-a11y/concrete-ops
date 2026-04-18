import { EmployeeSetupState } from "@/components/employee/EmployeePortalStates";
import { EmptyState, ErrorPanel } from "@/components/ui/feedback";
import { getMyPPEItems, type PPEItemRow } from "@/lib/db/queries";
import { getEmployeePortalContext } from "@/lib/employee/portal";
import { formatDateOnly } from "@/lib/time/formatting";

function getEmployee(employee: PPEItemRow["employees"]) {
  if (!employee) return null;
  if (Array.isArray(employee)) return employee[0] ?? null;
  return employee;
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function PPEItemCard({ item }: { item: PPEItemRow }) {
  const employee = getEmployee(item.employees);

  return (
    <section className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{item.item_name}</h2>
          <p className="mt-1 text-sm text-zinc-600">
            {[employee?.full_name, employee?.crew_name, formatLabel(item.status)].filter(Boolean).join(" · ")}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${
            item.status === "issued"
              ? "bg-green-100 text-green-800"
              : item.status === "needs_replacement"
                ? "bg-amber-100 text-amber-800"
                : "bg-zinc-100 text-zinc-700"
          }`}
        >
          {formatLabel(item.status)}
        </span>
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
        <p className="mt-1 whitespace-pre-wrap">{item.fit_notes || "—"}</p>
      </div>
    </section>
  );
}

export default async function EmployeePPEPage() {
  const { employee, contextError } = await getEmployeePortalContext("/employee/ppe");
  const { data: items, error } = await getMyPPEItems();
  const allItems = items ?? [];
  const attentionItems = allItems.filter((item) => item.status !== "issued");
  const issuedItems = allItems.filter((item) => item.status === "issued");

  if (!employee) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold">My PPE</h1>
          <p className="mt-3 text-zinc-600">See what has been issued to you and what needs a fit check or replacement.</p>
        </div>

        {contextError ? (
          <ErrorPanel
            title="We couldn’t load your employee setup"
            description="Your PPE workspace could not confirm the employee record linked to this login right now. Try again, and if the issue keeps showing up, let the office know."
            actionHref="/employee/ppe"
            actionLabel="Try again"
          />
        ) : (
          <EmployeeSetupState actionHref="/employee" actionLabel="Back to portal home" />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">My PPE</h1>
        <p className="mt-3 text-zinc-600">
          See what has been issued to you and what needs a fit check or replacement. {attentionItems.length} item
          {attentionItems.length === 1 ? "" : "s"} currently need attention.
        </p>
      </div>

      {contextError || error ? (
        <ErrorPanel
          title="We couldn’t load your PPE details"
          description="Issued gear details are temporarily unavailable right now. Try refreshing this page, and if the problem continues, let the office know."
          actionHref="/employee/ppe"
          actionLabel="Try again"
        />
      ) : null}

      {allItems.length === 0 ? (
        <EmptyState
          icon="shield"
          title="No PPE items are assigned to you right now"
          description="Once the office issues or logs your PPE, it will show up here with fit notes and replacement timing."
          actionHref="/employee"
          actionLabel="Back to portal home"
        />
      ) : (
        <div className="space-y-6">
          {attentionItems.length > 0 ? (
            <section className="space-y-4">
              <div className="rounded-3xl border bg-amber-50 p-5 shadow-sm">
                <h2 className="text-xl font-semibold text-zinc-950">Needs attention</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-700">
                  These items still need a replacement or fit check. If anything here looks wrong, let the office know.
                </p>
              </div>

              {attentionItems.map((item) => (
                <PPEItemCard key={item.id} item={item} />
              ))}
            </section>
          ) : null}

          {issuedItems.length > 0 ? (
            <section className="space-y-4">
              <div className="rounded-3xl border bg-white p-5 shadow-sm">
                <h2 className="text-xl font-semibold text-zinc-950">Issued and in good standing</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  These PPE items are recorded as issued and currently do not need a replacement or fit check.
                </p>
              </div>

              {issuedItems.map((item) => (
                <PPEItemCard key={item.id} item={item} />
              ))}
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
