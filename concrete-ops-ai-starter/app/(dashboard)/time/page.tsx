import { EmployeeClockCard } from "@/components/time/EmployeeClockCard";
import { AdminLaborTable } from "@/components/time/AdminLaborTable";
import { getJobTimeEntries } from "@/lib/db/queries";

export default async function TimePage() {
  const demoJobId = process.env.NEXT_PUBLIC_DEMO_JOB_ID ?? "";
  const { data } = demoJobId ? await getJobTimeEntries(demoJobId) : { data: [] as any[] };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">Time & Labor</h1>
        <p className="mt-3 text-zinc-600">First live workflow: employee clock-in writes here, admin reads the same time entries.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <EmployeeClockCard />
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Admin Labor Mirror</h2>
          <AdminLaborTable entries={data ?? []} />
        </div>
      </div>
    </div>
  );
}
