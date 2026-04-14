import { JobDetailHeader } from "@/components/jobs/JobDetailHeader";
import { getJobFiles, getJobTimeEntries, type JobFileRow, type JobTimeEntryRow } from "@/lib/db/queries";

function getUploader(users: JobFileRow["users"], employees: JobFileRow["employees"]) {
  if (users) {
    if (Array.isArray(users)) return users[0]?.full_name ?? "—";
    return users.full_name;
  }

  if (employees) {
    if (Array.isArray(employees)) return employees[0]?.full_name ?? "—";
    return employees.full_name;
  }

  return "—";
}

function getEmployeeName(employees: JobTimeEntryRow["employees"]) {
  if (!employees) return "—";
  if (Array.isArray(employees)) return employees[0]?.full_name ?? "—";
  return employees.full_name;
}

function getPhaseName(phases: JobTimeEntryRow["job_phases"]) {
  if (!phases) return "—";
  if (Array.isArray(phases)) return phases[0]?.name ?? "—";
  return phases.name;
}

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tag?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const selectedTag = query.tag?.trim() || "";

  const [{ data: timeEntries }, { data: files }] = await Promise.all([
    getJobTimeEntries(id),
    getJobFiles({ jobId: id, tag: selectedTag || undefined }),
  ]);

  const tags = Array.from(new Set((files ?? []).map((file) => file.tag)));
  const filesByTag = (files ?? []).reduce<Record<string, JobFileRow[]>>((acc, file) => {
    const key = file.tag;
    acc[key] = [...(acc[key] ?? []), file];
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <JobDetailHeader id={id} />

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Related Uploads</h2>
        <p className="mt-2 text-sm text-zinc-600">Grouped by tag. Shows uploader, date, tag, note, and storage path.</p>

        <form method="get" className="mt-4 flex flex-wrap gap-3">
          <select name="tag" defaultValue={selectedTag} className="rounded-xl border px-3 py-2 text-sm">
            <option value="">All tags</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
          <button type="submit" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white">Apply</button>
        </form>

        <div className="mt-5 space-y-4">
          {Object.entries(filesByTag).length === 0 ? (
            <p className="text-sm text-zinc-600">No uploads found for this job.</p>
          ) : (
            Object.entries(filesByTag).map(([tag, groupedFiles]) => (
              <div key={tag} className="overflow-hidden rounded-2xl border">
                <div className="bg-zinc-100 px-4 py-2 text-sm font-medium">{tag}</div>
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left">Uploaded At</th>
                      <th className="px-4 py-3 text-left">Uploader</th>
                      <th className="px-4 py-3 text-left">File</th>
                      <th className="px-4 py-3 text-left">Note</th>
                      <th className="px-4 py-3 text-left">Storage Path</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedFiles.map((file) => (
                      <tr key={file.id} className="border-t">
                        <td className="px-4 py-3">{file.created_at}</td>
                        <td className="px-4 py-3">{getUploader(file.users, file.employees)}</td>
                        <td className="px-4 py-3">{file.file_name}</td>
                        <td className="px-4 py-3">{file.note || "—"}</td>
                        <td className="max-w-xs truncate px-4 py-3">{file.storage_path}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <div className="bg-zinc-100 px-4 py-3">
          <h2 className="text-xl font-semibold">Time Entries</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left">Employee</th>
              <th className="px-4 py-3 text-left">Phase</th>
              <th className="px-4 py-3 text-left">Clock In</th>
              <th className="px-4 py-3 text-left">Clock Out</th>
              <th className="px-4 py-3 text-left">Hours</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {(timeEntries ?? []).map((entry) => (
              <tr key={entry.id} className="border-t">
                <td className="px-4 py-3">{getEmployeeName(entry.employees)}</td>
                <td className="px-4 py-3">{getPhaseName(entry.job_phases)}</td>
                <td className="px-4 py-3">{entry.clock_in_at}</td>
                <td className="px-4 py-3">{entry.clock_out_at || "—"}</td>
                <td className="px-4 py-3">{entry.total_hours || "—"}</td>
                <td className="px-4 py-3">{entry.status}</td>
              </tr>
            ))}
            {(timeEntries ?? []).length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-zinc-600" colSpan={6}>No time entries found for this job.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
