import Link from "next/link";
import { notFound } from "next/navigation";
import { ToolboxTalkAttendeesCard } from "@/components/toolbox-talks/ToolboxTalkAttendeesCard";
import { getToolboxTalkAttendeeOptions, getToolboxTalkAttendees, getToolboxTalkById, type ToolboxTalkDetailRow } from "@/lib/db/queries";
import { formatDateOnly } from "@/lib/time/formatting";

function getForeman(foreman: ToolboxTalkDetailRow["foreman_employee"]) {
  if (!foreman) return null;
  if (Array.isArray(foreman)) return foreman[0] ?? null;
  return foreman;
}

export default async function ToolboxTalkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ data: talk }, { data: attendees }, attendeeOptions] = await Promise.all([
    getToolboxTalkById(id),
    getToolboxTalkAttendees(id),
    getToolboxTalkAttendeeOptions(),
  ]);

  if (!talk) notFound();

  const foreman = getForeman(talk.foreman_employee);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">{talk.topic}</h1>
            <p className="mt-2 text-zinc-600">{formatDateOnly(talk.talk_date)}</p>
          </div>
          <div className="flex gap-3">
            <Link href={`/dashboard/toolbox-talks/${talk.id}/edit`} className="rounded-xl border px-4 py-2 text-sm">
              Edit Toolbox Talk
            </Link>
            <Link href="/dashboard/toolbox-talks" className="rounded-xl border px-4 py-2 text-sm">
              Back to Toolbox Talks
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Foreman</h2>
          <p className="mt-2">{foreman?.full_name || "—"}</p>
          <p className="mt-1 text-sm text-zinc-600">
            {[foreman?.job_title, foreman?.crew_name].filter(Boolean).join(" · ") || "No foreman assigned"}
          </p>
        </section>

        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Attendance</h2>
          <p className="mt-2 text-sm text-zinc-700">{(attendees ?? []).length} attendee{(attendees ?? []).length === 1 ? "" : "s"} logged</p>
        </section>
      </div>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Notes</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{talk.notes || "—"}</p>
      </section>

      <ToolboxTalkAttendeesCard toolboxTalkId={talk.id} attendees={attendees ?? []} attendeeOptions={attendeeOptions} />
    </div>
  );
}
