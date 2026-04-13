export function JobDetailHeader({ id }: { id: string }) {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">Job Detail</p>
      <h1 className="mt-3 text-3xl font-semibold">{id}</h1>
      <p className="mt-3 text-zinc-600">Connect job reports, time entries, documents, and costing here.</p>
    </div>
  );
}
