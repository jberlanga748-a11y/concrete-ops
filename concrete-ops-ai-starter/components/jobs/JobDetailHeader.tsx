export function JobDetailHeader({ id }: { id: string }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-950/5">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">Job Detail</p>
      <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{id}</h1>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
        Connect job reports, time entries, documents, and costing here.
      </p>
    </div>
  );
}
