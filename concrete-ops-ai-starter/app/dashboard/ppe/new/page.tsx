import Link from "next/link";
import { PPEItemForm } from "@/components/ppe/PPEItemForm";
import { getEmployeeOptions } from "@/lib/db/queries";

export default async function NewPPEItemPage() {
  const employeeOptions = await getEmployeeOptions();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">New PPE Item</h1>
            <p className="mt-2 text-zinc-600">Log issued PPE and flag anything that still needs a fit check or replacement.</p>
          </div>
          <Link href="/dashboard/ppe" className="rounded-xl border px-4 py-2 text-sm">
            Back to PPE
          </Link>
        </div>
      </div>

      <PPEItemForm employeeOptions={employeeOptions} />
    </div>
  );
}
