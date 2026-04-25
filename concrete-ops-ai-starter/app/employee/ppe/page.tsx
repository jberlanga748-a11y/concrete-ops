import { EmptyState, ErrorPanel, StatusChip } from "@/components/ui/feedback";
import { KpiTile, OperationalCard, PageHeader, SectionHeader } from "@/components/ui/page-primitives";
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
  const { data: items, error } = await getMyPPEItems();
  const replacementCount = (items ?? []).filter((item) => item.status === "needs_replacement").length;
  const fitCheckCount = (items ?? []).filter((item) => item.status === "pending_fit_check").length;

  return (
    <div>
      <PageHeader
        eyebrow="Employee Workflow"
        title="My PPE"
        description="See what has been issued to you and what needs a fit check or replacement."
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
      {error ? (
        <ErrorPanel
          title="We couldn’t load your PPE records right now"
          description="The employee PPE workspace is temporarily unavailable. Try refreshing the page or come back in a moment."
          actionHref="/employee/ppe"
          actionLabel="Try again"
        />
      ) : (items ?? []).length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3">
          <KpiTile label="Issued Items" value={String(items?.length ?? 0)} helper="Current PPE records assigned to your account." />
          <KpiTile label="Needs Replacement" value={String(replacementCount)} helper="Items that need office follow-up or reissue." />
          <KpiTile label="Pending Fit Check" value={String(fitCheckCount)} helper="Items still waiting on sizing or fit confirmation." />
        </div>
      ) : null}

      <div className="space-y-4">
        {(items ?? []).map((item) => {
          const employee = getEmployee(item.employees);
          return (
            <OperationalCard key={item.id} className="p-4">
              <SectionHeader
                title={item.item_name}
                description={[employee?.full_name, employee?.crew_name, formatLabel(item.status)].filter(Boolean).join(" / ")}
                action={
                  <StatusChip tone={item.status === "issued" ? "success" : item.status === "needs_replacement" ? "warning" : "info"}>
                  {formatLabel(item.status)}
                  </StatusChip>
                }
              />

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm font-bold text-slate-700">
                  <p className="font-black text-slate-950">Issued</p>
                  <p className="mt-1">{formatDateOnly(item.issued_at)}</p>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm font-bold text-slate-700">
                  <p className="font-black text-slate-950">Replacement Due</p>
                  <p className="mt-1">{formatDateOnly(item.replacement_due_at)}</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm font-bold text-slate-700">
                <p className="font-black text-slate-950">Fit Notes</p>
                <p className="mt-1 whitespace-pre-wrap">{item.fit_notes || "-"}</p>
              </div>
            </OperationalCard>
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
    </div>
  );
}
