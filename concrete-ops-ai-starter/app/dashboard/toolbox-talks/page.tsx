import Link from "next/link";
import { getToolboxTalks, type ToolboxTalkListRow } from "@/lib/db/queries";

function getForemanLabel(foreman: ToolboxTalkListRow["foreman_employee"]) {
  if (!foreman) return "—";
  if (Array.isArray(foreman)) return foreman[0]?.full_name ?? "—";
  return foreman.full_name;
}

export default async function ToolboxTalksPage() {
  const { data: talks } = await getToolboxTalks();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Toolbox Talks</h1>
            <p className="mt-2 text-zinc-600">Field-friendly safety talks with simple attendance tracking for foremen and office admins.</p>
          </div>
          <Link href="/dashboard/toolbox-talks/new" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white">
            New Toolbox Talk
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Topic</th>
              <th className="px-4 py-3 text-left">Foreman</th>
              <th className="px-4 py-3 text-left">Open</th>
            </tr>
          </thead>
          <tbody>
            {(talks ?? []).map((talk) => (
              <tr key={talk.id} className="border-t">
                <td className="px-4 py-4">{talk.talk_date}</td>
                <td className="px-4 py-4">{talk.topic}</td>
                <td className="px-4 py-4">{getForemanLabel(talk.foreman_employee)}</td>
                <td className="px-4 py-4">
                  <Link href={`/dashboard/toolbox-talks/${talk.id}`} className="underline">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {(talks ?? []).length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-zinc-600" colSpan={4}>
                  No toolbox talks logged yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
