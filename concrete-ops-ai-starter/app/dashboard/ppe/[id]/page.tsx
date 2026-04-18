import Link from "next/link";
import { notFound } from "next/navigation";
import { PPEItemForm } from "@/components/ppe/PPEItemForm";
import { getEmployeeOptions, getPPEItemById, type PPEDetailRow } from "@/lib/db/queries";
import { formatDateOnly } from "@/lib/time/formatting";

function getEmployee(employee: PPEDetailRow["employees"]) {
  if (!employee) return null;
  if (Array.isArray(employee)) return employee[0] ?? null;
  return employee;
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

export default async function PPEDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ data: item }, employeeOptions] = await Promise.all([
    getPPEItemById(id),
    getEmployeeOptions(true),
  ]);

  if (!item) notFound();

  const employee = getEmployee(item.employees);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">{item.item_name}</h1>
            <p className="mt-2 text-zinc-600">
              {[employee?.full_name, formatLabel(item.status)].filter(Boolean).join(" · ")}
            </p>
          </div>
          <Link href="/dashboard/ppe" className="rounded-xl border px-4 py-2 text-sm">
            Back to PPE
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Employee</h2>
          <p className="mt-2">{employee?.full_name || "—"}</p>
          <p className="mt-1 text-sm text-zinc-600">{[employee?.job_title, employee?.crew_name].filter(Boolean).join(" · ") || "—"}</p>
        </section>
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Issued</h2>
          <p className="mt-2 text-sm text-zinc-700">{formatDateOnly(item.issued_at)}</p>
        </section>
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Replacement Due</h2>
          <p className="mt-2 text-sm text-zinc-700">{formatDateOnly(item.replacement_due_at)}</p>
        </section>
      </div>

      <PPEItemForm employeeOptions={employeeOptions} item={item} />
    </div>
  );
}
