import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getChangeOrderById,
  getChangeOrderFiles,
  getChangeOrderLineItems,
  type ChangeOrderDetailRow,
  type ChangeOrderFileRow,
} from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";

function getJobLabel(jobs: ChangeOrderDetailRow["jobs"]) {
  if (!jobs) return "—";
  if (Array.isArray(jobs)) {
    const job = jobs[0];
    return job ? `${job.job_number} · ${job.name}` : "—";
  }
  return `${jobs.job_number} · ${jobs.name}`;
}

function getReportLabel(reports: ChangeOrderDetailRow["daily_reports"]) {
  if (!reports) return "—";
  if (Array.isArray(reports)) {
    const report = reports[0];
    return report ? `${report.report_date} (${report.id})` : "—";
  }
  return `${reports.report_date} (${reports.id})`;
}

function getProofFile(file: ChangeOrderFileRow["job_files"]) {
  if (!file) return null;
  if (Array.isArray(file)) return file[0] ?? null;
  return file;
}

export default async function ChangeOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { id } = params;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: appUser } = user
    ? await supabase.from("users").select("role").eq("auth_user_id", user.id).maybeSingle()
    : { data: null };
  const isForeman = appUser?.role === "foreman";

  const [{ data: changeOrder }, { data: lineItems }, { data: proofFiles }] =
    await Promise.all([
      getChangeOrderById(id),
      getChangeOrderLineItems(id),
      getChangeOrderFiles(id),
    ]);

  if (!changeOrder) notFound();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">{changeOrder.title}</h1>
            <p className="mt-2 text-zinc-600">{getJobLabel(changeOrder.jobs)}</p>
          </div>
          <Link
            href="/dashboard/change-orders"
            className="rounded-xl border px-4 py-2 text-sm hover:bg-zinc-50"
          >
            Back to Change Orders
          </Link>
        </div>
      </div>

      <div className="space-y-3 rounded-3xl border bg-white p-6 shadow-sm">
        <p>
          <span className="font-medium">Status:</span> {changeOrder.status}
        </p>
        <p>
          <span className="font-medium">Linked Daily Report:</span>{" "}
          {getReportLabel(changeOrder.daily_reports)}
        </p>
        <p>
          <span className="font-medium">Description:</span>{" "}
          {changeOrder.description || "—"}
        </p>
        {!isForeman ? (
          <p>
            <span className="font-medium">Direct Cost Total:</span>{" "}
            {changeOrder.direct_cost_total}
          </p>
        ) : null}
        {!isForeman ? (
          <p>
            <span className="font-medium">Markup Percent:</span>{" "}
            {changeOrder.markup_percent}
          </p>
        ) : null}
        {!isForeman ? (
          <p>
            <span className="font-medium">Total Amount:</span> {changeOrder.total_amount}
          </p>
        ) : null}
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Linked Field Proof</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {(proofFiles ?? []).map((proof) => {
            const file = getProofFile(proof.job_files);
            if (!file) return null;

            return (
              <li key={proof.id} className="rounded-2xl border p-3">
                <p className="font-medium">{file.file_name}</p>
                <p className="text-zinc-600">Tag: {file.tag}</p>
                <p className="text-zinc-600">Note: {file.note || "—"}</p>
                <p className="text-zinc-500">Uploaded: {file.created_at}</p>
                <p className="text-zinc-500">Storage Path: {file.storage_path}</p>
              </li>
            );
          })}

          {(proofFiles ?? []).length === 0 ? (
            <li className="text-zinc-600">No linked field proof files.</li>
          ) : null}
        </ul>
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Line Items</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {(lineItems ?? []).map((item) => (
            <li key={item.id} className="rounded-2xl border p-3">
              {item.description} · Qty {item.quantity} · Unit {item.unit_cost} · Total{" "}
              {item.line_total}
            </li>
          ))}

          {(lineItems ?? []).length === 0 ? (
            <li className="text-zinc-600">No line items yet.</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
