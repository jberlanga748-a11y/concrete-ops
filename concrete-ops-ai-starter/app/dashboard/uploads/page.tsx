import Link from "next/link";
import { ViewerDateTime } from "@/components/time/ViewerDateTime";
import { EmptyState, ErrorPanel, StatusChip } from "@/components/ui/feedback";
import { FilterBar, PageHeader, RecordPreview } from "@/components/ui/page-primitives";
import {
  DataTable,
  TableActionLink,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeadCell,
  TableRow,
  TableShell,
  TableToolbar,
} from "@/components/ui/table";
import { getCurrentAppUserContext } from "@/lib/auth/server";
import { isForemanRole } from "@/lib/auth/roles";
import { getDailyReportOptions, getDailyReportJobOptions, getDocuments, type DocumentRow } from "@/lib/db/queries";
import { formatDateOnly } from "@/lib/time/formatting";

function getJobLabel(jobs: DocumentRow["jobs"]) {
  if (!jobs) return "—";
  if (Array.isArray(jobs)) {
    const job = jobs[0];
    return job ? `${job.job_number} · ${job.name}` : "—";
  }

  return `${jobs.job_number} · ${jobs.name}`;
}

function getReportDate(dailyReports: DocumentRow["daily_reports"]) {
  if (!dailyReports) return "—";
  if (Array.isArray(dailyReports)) return dailyReports[0]?.report_date ?? "—";
  return dailyReports.report_date;
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

export default async function UploadsPage({
  searchParams,
}: {
  searchParams?: { jobId?: string; dailyReportId?: string; tag?: string };
} = {}) {
  const params = searchParams ?? {};
  const selectedJobId = params.jobId?.trim() || "";
  const selectedDailyReportId = params.dailyReportId?.trim() || "";
  const selectedTag = params.tag?.trim() || "";

  const appUser = await getCurrentAppUserContext();
  const isForeman = isForemanRole(appUser?.role);

  const [{ data: files, error }, jobOptions, dailyReportOptions] = await Promise.all([
    getDocuments({
      jobId: selectedJobId || undefined,
      dailyReportId: selectedDailyReportId || undefined,
      tag: selectedTag || undefined,
    }),
    getDailyReportJobOptions(),
    getDailyReportOptions(selectedJobId || undefined),
  ]);
  const description = isForeman
    ? "Field-visible photo and document record tied to jobs and reports."
    : "Office-managed photo and document record tied to jobs and reports.";
  const emptyDescription = isForeman
    ? "No uploads match this view yet. Clear the filters or add field proof so the shared record stays current."
    : "No uploads match this view yet. Clear the filters or add a file so the shared project record stays complete.";
  const uploadRows = files ?? [];
  const latestUpload = uploadRows[0] ?? null;
  const selectedJobLabel = jobOptions.find((job) => job.id === selectedJobId)?.label ?? "All jobs";
  const selectedReportLabel = dailyReportOptions.find((report) => report.id === selectedDailyReportId)?.label ?? "All reports";

  return (
    <div>
      <PageHeader
        eyebrow="Field Ops"
        title="Uploads"
        description={description}
        actions={
          <Link href="/dashboard/uploads/new" className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800">
            New Upload
          </Link>
        }
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8">
        {error ? (
          <ErrorPanel
            title="We couldn’t load uploads right now"
            description="The upload record is temporarily unavailable. Try refreshing the page or come back in a moment."
            actionHref="/dashboard/uploads"
            actionLabel="Try again"
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <div className="min-w-0">
              <TableShell
                toolbar={
                  <TableToolbar
                    title="Upload record"
                    description="Photos, tickets, documents, and field proof stay connected to job and daily-report context."
                    countLabel={`${uploadRows.length} upload${uploadRows.length === 1 ? "" : "s"}`}
                  />
                }
                filters={
                  <FilterBar>
                    <form method="get" className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px_auto] md:items-center">
                      <select name="jobId" defaultValue={selectedJobId} aria-label="Job" className="h-10 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500">
                        <option value="">All jobs</option>
                        {jobOptions.map((job) => (
                          <option key={job.id} value={job.id}>
                            {job.label}
                          </option>
                        ))}
                      </select>
                      <select name="dailyReportId" defaultValue={selectedDailyReportId} aria-label="Daily report" className="h-10 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500">
                        <option value="">All reports</option>
                        {dailyReportOptions.map((report) => (
                          <option key={report.id} value={report.id}>
                            {report.label}
                          </option>
                        ))}
                      </select>
                      <select name="tag" defaultValue={selectedTag} aria-label="Tag" className="h-10 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500">
                        <option value="">All tags</option>
                        <option value="progress">Progress</option>
                        <option value="issue">Issue</option>
                        <option value="safety">Safety</option>
                        <option value="delivery">Delivery</option>
                        <option value="damage">Damage</option>
                        <option value="change_order_support">Change Order Support</option>
                      </select>
                      <button type="submit" className="h-10 rounded-xl bg-blue-700 px-4 text-sm font-black text-white hover:bg-blue-800">
                        Apply
                      </button>
                    </form>
                  </FilterBar>
                }
              >
                <DataTable>
                  <TableHead>
                    <tr>
                      <TableHeadCell>File</TableHeadCell>
                      <TableHeadCell className="hidden md:table-cell">Job</TableHeadCell>
                      <TableHeadCell className="hidden xl:table-cell">Report</TableHeadCell>
                      <TableHeadCell>Tag</TableHeadCell>
                      <TableHeadCell className="hidden lg:table-cell">Uploader</TableHeadCell>
                      <TableHeadCell className="hidden sm:table-cell">Uploaded</TableHeadCell>
                      <TableHeadCell className="w-32">Action</TableHeadCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {uploadRows.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell className="min-w-[18rem]">
                          <p className="font-black text-slate-950">{file.file_name}</p>
                          <p className="mt-1 text-xs font-bold text-slate-500">{formatFileSize(file.file_size_bytes)} · {file.note || "No note"}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{getJobLabel(file.jobs)}</TableCell>
                        <TableCell className="hidden xl:table-cell">{formatDateOnly(getReportDate(file.daily_reports))}</TableCell>
                        <TableCell>
                          <StatusChip tone="info">{file.tag}</StatusChip>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{getUploader(file.users, file.employees)}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <ViewerDateTime value={file.created_at} includeYear includeTimeZoneName={false} />
                        </TableCell>
                        <TableCell>
                          <TableActionLink href={`/api/documents/${file.id}`} label="Open" />
                        </TableCell>
                      </TableRow>
                    ))}
                    {uploadRows.length === 0 ? (
                      <TableEmptyRow colSpan={7}>
                        <EmptyState
                          icon="file"
                          title="No uploads match this view"
                          description={emptyDescription}
                          actionHref="/dashboard/uploads/new"
                          actionLabel="New Upload"
                        />
                      </TableEmptyRow>
                    ) : null}
                  </TableBody>
                </DataTable>
              </TableShell>
            </div>

            <RecordPreview
              title={latestUpload?.file_name}
              rows={[
                ["Job", latestUpload ? getJobLabel(latestUpload.jobs) : selectedJobLabel],
                ["Report", latestUpload ? formatDateOnly(getReportDate(latestUpload.daily_reports)) : selectedReportLabel],
                ["Tag", latestUpload?.tag ?? (selectedTag || "All tags")],
                ["Uploader", latestUpload ? getUploader(latestUpload.users, latestUpload.employees) : "—"],
              ]}
              actions={
                latestUpload ? (
                  <Link href={`/api/documents/${latestUpload.id}`} className="inline-flex rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">
                    Open Upload
                  </Link>
                ) : null
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
