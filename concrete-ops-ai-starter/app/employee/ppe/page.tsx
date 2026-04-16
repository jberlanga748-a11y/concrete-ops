import { getMyPPEItems, type PPEItemRow } from "@/lib/db/queries";

function getEmployee(employee: PPEItemRow["employees"]) {
  if (!employee) return null;
  if (Array.isArray(employee)) return employee[0] ?? null;
  return employee;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

export default async function EmployeePPEPage() {
  const { data: items } = await getMyPPEItems();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">My PPE</h1>
        <p className="mt-3 text-zinc-600">See what has been issued to you and what needs a fit check or replacement.</p>
      </div>

      <div className="space-y-4">
        {(items ?? []).map((item) => {
          const employee = getEmployee(item.employees);
          return (
            <section key={item.id} className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{item.item_name}</h2>
                  <p className="mt-1 text-sm text-zinc-600">
                    {[employee?.full_name, employee?.crew_name, formatLabel(item.status)].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${item.status === "issued" ? "bg-green-100 text-green-800" : item.status === "needs_replacement" ? "bg-amber-100 text-amber-800" : "bg-zinc-100 text-zinc-700"}`}>
                  {formatLabel(item.status)}
                </span>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border bg-zinc-50 p-4 text-sm text-zinc-700">
                  <p className="font-medium">Issued</p>
                  <p className="mt-1">{formatDate(item.issued_at)}</p>
                </div>
                <div className="rounded-2xl border bg-zinc-50 p-4 text-sm text-zinc-700">
                  <p className="font-medium">Replacement Due</p>
                  <p className="mt-1">{formatDate(item.replacement_due_at)}</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border bg-zinc-50 p-4 text-sm text-zinc-700">
                <p className="font-medium">Fit Notes</p>
                <p className="mt-1 whitespace-pre-wrap">{item.fit_notes || "—"}</p>
              </div>
            </section>
          );
        })}

        {(items ?? []).length === 0 ? (
          <div className="rounded-3xl border bg-white p-6 text-zinc-600 shadow-sm">
            No PPE items are assigned to you right now.
          </div>
        ) : null}
      </div>
    </div>
  );
}
