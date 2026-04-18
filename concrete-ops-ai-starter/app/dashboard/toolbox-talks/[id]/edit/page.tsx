import Link from "next/link";
import { notFound } from "next/navigation";
import { ToolboxTalkForm } from "@/components/toolbox-talks/ToolboxTalkForm";
import { getEmployeeOptions, getToolboxTalkById } from "@/lib/db/queries";

export default async function EditToolboxTalkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ data: talk }, foremanOptions] = await Promise.all([
    getToolboxTalkById(id),
    getEmployeeOptions(true),
  ]);

  if (!talk) notFound();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Update Toolbox Talk</h1>
            <p className="mt-2 text-zinc-600">Adjust the talk topic, date, foreman, or notes without overwriting signed attendance.</p>
          </div>
          <Link href={`/dashboard/toolbox-talks/${talk.id}`} className="rounded-xl border px-4 py-2 text-sm">
            Back to Talk
          </Link>
        </div>
      </div>

      <ToolboxTalkForm toolboxTalkId={talk.id} foremanOptions={foremanOptions} initialValues={talk} />
    </div>
  );
}
