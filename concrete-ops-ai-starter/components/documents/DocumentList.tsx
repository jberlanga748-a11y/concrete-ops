import Link from "next/link";
import type { DocumentRow } from "@/lib/db/queries";
import { formatDateOnly, formatTimestamp } from "@/lib/time/formatting";

function getJobLabel(jobs: DocumentRow["jobs"]) {
  if (!jobs) return "—";
  if (Array.isArray(jobs)) {
    const job = jobs[0];
    return job ? `${job.job_number} · ${job.name}` : "—";
  }

  return `${jobs.job_number} · ${jobs.name}`;
}

function getReportLabel(dailyReports: DocumentRow["daily_reports"]) {
  if (!dailyReports) return "—";
  if (Array.isArray(dailyReports)) return formatDateOnly(dailyReports[0]?.report_date);
  return formatDateOnly(dailyReports.report_date);
}

function getUploader(users: DocumentRow["users"], employees: DocumentRow["employees"]) {
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

function formatFileSize(bytes: number | null | undefined) {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getLinkedLabels(document: DocumentRow) {
  const labels: string[] = [];

  for (const link of document.document_links ?? []) {
    if (link.link_type === "change_order") labels.push("Change Order");
    if (link.link_type === "incident") labels.push("Incident");
  }

  if (document.job_id) labels.unshift("Job");
  if (document.daily_report_id) labels.push("Daily Report");

  return Array.from(new Set(labels));
}

export function DocumentList({
  documents,
  emptyMessage,
}: {
  documents: DocumentRow[];
  emptyMessage: string;
}) {
  return (
    <ul className="space-y-3 text-sm">
      {documents.map((document) => (
        <li key={document.id} className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-black text-slate-950">{document.file_name}</p>
              <p className="mt-1 font-bold text-slate-500">
                {[`Tag: ${document.tag}`, `Type: ${document.file_type}`, `Size: ${formatFileSize(document.file_size_bytes)}`].join(" · ")}
              </p>
              <p className="mt-1 font-bold text-slate-500">
                {[getJobLabel(document.jobs), getReportLabel(document.daily_reports)].filter((value) => value !== "—").join(" · ") || "No linked job context"}
              </p>
              <p className="mt-1 font-medium text-slate-500">
                {[`Uploaded by ${getUploader(document.users, document.employees)}`, formatTimestamp(document.created_at)].join(" · ")}
              </p>
              <p className="mt-2 font-medium text-slate-700">{document.note || "—"}</p>
              <p className="mt-2 text-xs font-black uppercase tracking-widest text-blue-700">
                {getLinkedLabels(document).join(" · ") || "Document"}
              </p>
            </div>

            <Link href={`/api/documents/${document.id}`} className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-blue-50">
              Open File
            </Link>
          </div>
        </li>
      ))}

      {documents.length === 0 ? <li className="rounded-xl border border-dashed border-blue-200 bg-blue-50 p-4 font-medium text-slate-600">{emptyMessage}</li> : null}
    </ul>
  );
}
