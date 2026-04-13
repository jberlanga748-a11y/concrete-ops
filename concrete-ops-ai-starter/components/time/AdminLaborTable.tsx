type TimeEntry = {
  id: string;
  clock_in_at: string;
  clock_out_at: string | null;
  total_hours: number | null;
  status: string;
  employees?: { full_name: string } | null;
  job_phases?: { name: string } | null;
};

export function AdminLaborTable({ entries }: { entries: TimeEntry[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-zinc-100">
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
          {entries.map((entry) => (
            <tr key={entry.id} className="border-t">
              <td className="px-4 py-4">{entry.employees?.full_name ?? "—"}</td>
              <td className="px-4 py-4">{entry.job_phases?.name ?? "—"}</td>
              <td className="px-4 py-4">{entry.clock_in_at}</td>
              <td className="px-4 py-4">{entry.clock_out_at ?? "—"}</td>
              <td className="px-4 py-4">{entry.total_hours ?? "—"}</td>
              <td className="px-4 py-4">{entry.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
