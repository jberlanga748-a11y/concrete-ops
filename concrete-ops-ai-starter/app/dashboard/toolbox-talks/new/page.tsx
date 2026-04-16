import Link from "next/link";
import { ToolboxTalkForm } from "@/components/toolbox-talks/ToolboxTalkForm";
import { getEmployeeOptions, getToolboxTalkAttendeeOptions } from "@/lib/db/queries";

export default async function NewToolboxTalkPage() {
  const [foremanOptions, attendeeOptions] = await Promise.all([
    getEmployeeOptions(),
    getToolboxTalkAttendeeOptions(),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">New Toolbox Talk</h1>
            <p className="mt-2 text-zinc-600">Capture today’s safety topic and get attendance rolling quickly from the field.</p>
          </div>
          <Link href="/dashboard/toolbox-talks" className="rounded-xl border px-4 py-2 text-sm">
            Back to Toolbox Talks
          </Link>
        </div>
      </div>

      <ToolboxTalkForm foremanOptions={foremanOptions} attendeeOptions={attendeeOptions} />
    </div>
  );
}
