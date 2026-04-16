import { getChangeOrderById, getChangeOrderLineItems, getDailyReportById, getDailyReportCrewEntries, getProposalById, getProposalSections, type ChangeOrderDetailRow, type DailyReportCrewEntryRow, type DailyReportDetailRow, type ProposalDetailRow } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import { createSimplePdf } from "@/lib/pdf/simplePdf";

export type ExportRecordType = "proposal" | "change_order" | "daily_report";

type ExportDocument = {
  fileName: string;
  title: string;
  subject: string;
  defaultTo: string;
  lines: string[];
};

function getSingle<T>(value: T[] | T | null | undefined) {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function getCurrentRole() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" as const };
  }

  const { data: appUser } = await supabase
    .from("users")
    .select("role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return { role: appUser?.role ?? null };
}

function getProposalCustomer(proposal: ProposalDetailRow["customers"]) {
  return getSingle(proposal);
}

function getProposalJob(proposal: ProposalDetailRow["jobs"]) {
  return getSingle(proposal);
}

function getProposalUser(user: ProposalDetailRow["users"]) {
  return getSingle(user);
}

async function getProposalDocument(id: string): Promise<ExportDocument | null> {
  const [{ data: proposal }, { data: sections }] = await Promise.all([
    getProposalById(id),
    getProposalSections(id),
  ]);

  if (!proposal) return null;

  const customer = getProposalCustomer(proposal.customers);
  const job = getProposalJob(proposal.jobs);
  const creator = getProposalUser(proposal.users);
  const title = `Proposal: ${proposal.title}`;

  return {
    fileName: `${slugify(proposal.title || "proposal") || "proposal"}.pdf`,
    title,
    subject: `${proposal.title} proposal`,
    defaultTo: customer?.email || "",
    lines: [
      `Status: ${proposal.status}`,
      `Customer: ${customer?.name || "—"}`,
      `Customer Contact: ${[customer?.contact_name, customer?.phone, customer?.email].filter(Boolean).join(" · ") || "—"}`,
      `Job: ${job ? `${job.job_number} · ${job.name}` : "—"}`,
      `Created: ${formatDateTime(proposal.created_at)}`,
      `Created By: ${creator?.full_name || "—"}`,
      "",
      "Notes",
      proposal.notes || "—",
      "",
      "Sections",
      ...(sections?.length
        ? sections.flatMap((section, index) => [
            `${index + 1}. ${section.section_type.toUpperCase()}${section.heading ? ` - ${section.heading}` : ""}`,
            section.content || "—",
            "",
          ])
        : ["No sections added yet."]),
    ],
  };
}

function getChangeOrderJob(jobs: ChangeOrderDetailRow["jobs"]) {
  return getSingle(jobs);
}

function getChangeOrderReport(reports: ChangeOrderDetailRow["daily_reports"]) {
  return getSingle(reports);
}

async function getChangeOrderDocument(id: string): Promise<ExportDocument | null> {
  const [{ data: changeOrder }, { data: lineItems }, roleResult] = await Promise.all([
    getChangeOrderById(id),
    getChangeOrderLineItems(id),
    getCurrentRole(),
  ]);

  if (!changeOrder || "error" in roleResult) return null;

  const job = getChangeOrderJob(changeOrder.jobs);
  const report = getChangeOrderReport(changeOrder.daily_reports);
  const isForeman = roleResult.role === "foreman";
  const title = `Change Order: ${changeOrder.title}`;

  return {
    fileName: `${slugify(changeOrder.title || "change-order") || "change-order"}.pdf`,
    title,
    subject: `${changeOrder.title} change order`,
    defaultTo: "",
    lines: [
      `Status: ${changeOrder.status}`,
      `Job: ${job ? `${job.job_number} · ${job.name}` : "—"}`,
      `Daily Report: ${report ? `${report.report_date} (${report.id})` : "—"}`,
      `Created: ${formatDateTime(changeOrder.created_at)}`,
      `Description: ${changeOrder.description || "—"}`,
      ...(!isForeman
        ? [
            `Direct Cost Total: ${changeOrder.direct_cost_total}`,
            `Markup Percent: ${changeOrder.markup_percent}`,
            `Total Amount: ${changeOrder.total_amount}`,
          ]
        : []),
      "",
      "Line Items",
      ...(lineItems?.length
        ? lineItems.flatMap((item, index) => [
            `${index + 1}. ${item.description}`,
            `Qty ${item.quantity} · Unit ${item.unit_cost}${!isForeman ? ` · Total ${item.line_total}` : ""}`,
            "",
          ])
        : ["No line items yet."]),
    ],
  };
}

function getDailyReportJob(jobs: DailyReportDetailRow["jobs"]) {
  return getSingle(jobs);
}

function getDailyReportUser(users: DailyReportDetailRow["users"]) {
  return getSingle(users);
}

function getCrewEmployee(entry: DailyReportCrewEntryRow["employees"]) {
  return getSingle(entry);
}

async function getDailyReportDocument(id: string): Promise<ExportDocument | null> {
  const [{ data: report }, { data: crewEntries }] = await Promise.all([
    getDailyReportById(id),
    getDailyReportCrewEntries(id),
  ]);

  if (!report) return null;

  const job = getDailyReportJob(report.jobs);
  const submitter = getDailyReportUser(report.users);
  const title = `Daily Report: ${job ? `${job.job_number} · ${job.name}` : report.report_date}`;

  return {
    fileName: `${slugify(`${job?.job_number || "daily-report"}-${report.report_date}`)}.pdf`,
    title,
    subject: `Daily report ${report.report_date}`,
    defaultTo: "",
    lines: [
      `Report Date: ${formatDate(report.report_date)}`,
      `Job: ${job ? `${job.job_number} · ${job.name}` : "—"}`,
      `Submitted By: ${submitter?.full_name || "—"}`,
      "",
      "Work Completed",
      report.work_completed || "—",
      "",
      "Delays / Issues",
      report.delays_issues || "—",
      "",
      "Materials / Deliveries",
      report.materials_deliveries || "—",
      "",
      "Safety Notes",
      report.safety_notes || "—",
      "",
      "Crew Entries",
      ...(crewEntries?.length
        ? crewEntries.flatMap((entry, index) => {
            const employee = getCrewEmployee(entry.employees);
            return [
              `${index + 1}. ${employee?.full_name || "Employee"} · ${entry.hours} hrs`,
              [employee?.job_title, employee?.crew_name].filter(Boolean).join(" · ") || "—",
              entry.notes || "—",
              "",
            ];
          })
        : ["No crew entries added."]),
    ],
  };
}

export async function getExportDocument(recordType: ExportRecordType, id: string) {
  if (recordType === "proposal") return getProposalDocument(id);
  if (recordType === "change_order") return getChangeOrderDocument(id);
  return getDailyReportDocument(id);
}

export async function buildExportPdf(recordType: ExportRecordType, id: string) {
  const document = await getExportDocument(recordType, id);
  if (!document) return null;

  return {
    ...document,
    pdf: createSimplePdf({
      title: document.title,
      lines: document.lines,
    }),
  };
}
