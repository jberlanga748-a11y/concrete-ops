import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PROMPTS } from "@/lib/ai/prompts";
import { extractOpenAIErrorMessage, extractResponseText, safeParseJson } from "@/lib/ai/route-helpers";
import { createClient } from "@/lib/supabase/server";

const AdminOpsCopilotRequestSchema = z.object({
  question: z.string().trim().min(5).max(500),
});

const AdminOpsCopilotResponseSchema = z.object({
  answer: z.string().trim().min(1).max(1200),
  confidence: z.enum(["high", "medium", "low"]),
  uncertaintyNote: z.string().trim().max(400).optional(),
  citations: z.array(
    z.object({
      entityType: z.enum(["job", "daily_report", "upload", "change_order"]),
      id: z.string().trim().min(1).max(120),
      label: z.string().trim().min(1).max(220),
      reason: z.string().trim().min(1).max(240),
    }),
  ).max(6),
});

type UserRole = "owner" | "office_admin" | "foreman" | "employee";

type JobSnapshotRow = {
  id: string;
  job_number: string;
  name: string;
  status: string;
  start_date: string | null;
  target_finish_date: string | null;
  created_at: string;
};

type DailyReportSnapshotRow = {
  id: string;
  job_id: string;
  report_date: string;
  work_completed: string;
  delays_issues: string | null;
  materials_deliveries: string | null;
  safety_notes: string | null;
  created_at: string;
  jobs: { job_number: string; name: string } | { job_number: string; name: string }[] | null;
};

type UploadSnapshotRow = {
  id: string;
  job_id: string;
  daily_report_id: string | null;
  file_name: string;
  tag: string;
  note: string | null;
  created_at: string;
  jobs: { job_number: string; name: string } | { job_number: string; name: string }[] | null;
};

type ChangeOrderSnapshotRow = {
  id: string;
  job_id: string;
  daily_report_id: string | null;
  title: string;
  description: string | null;
  status: string;
  direct_cost_total: number;
  markup_percent: number;
  total_amount: number;
  created_at: string;
  jobs: { job_number: string; name: string } | { job_number: string; name: string }[] | null;
  daily_reports: { report_date: string } | { report_date: string }[] | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function questionKeywords(question: string) {
  return Array.from(new Set(question.toLowerCase().match(/[a-z0-9][a-z0-9\-]{2,}/g) ?? [])).slice(0, 10);
}

function includesKeyword(text: string, keywords: string[]) {
  const lowered = text.toLowerCase();
  return keywords.some((keyword) => lowered.includes(keyword));
}

function buildGroundedSnapshot(input: {
  jobs: JobSnapshotRow[];
  reports: DailyReportSnapshotRow[];
  uploads: UploadSnapshotRow[];
  changeOrders: ChangeOrderSnapshotRow[];
  question: string;
}) {
  const keywords = questionKeywords(input.question);
  const hasKeyword = keywords.length > 0;

  const scopedJobs = hasKeyword
    ? input.jobs.filter((job) =>
      includesKeyword([job.job_number, job.name, job.status].join(" "), keywords),
    )
    : [];

  const scopedReports = hasKeyword
    ? input.reports.filter((report) => {
      const job = firstRelation(report.jobs);
      return includesKeyword(
        [
          report.report_date,
          report.work_completed,
          report.delays_issues ?? "",
          report.materials_deliveries ?? "",
          report.safety_notes ?? "",
          job ? `${job.job_number} ${job.name}` : "",
        ].join(" "),
        keywords,
      );
    })
    : [];

  const scopedUploads = hasKeyword
    ? input.uploads.filter((upload) => {
      const job = firstRelation(upload.jobs);
      return includesKeyword(
        [
          upload.file_name,
          upload.tag,
          upload.note ?? "",
          job ? `${job.job_number} ${job.name}` : "",
        ].join(" "),
        keywords,
      );
    })
    : [];

  const scopedChangeOrders = hasKeyword
    ? input.changeOrders.filter((changeOrder) => {
      const job = firstRelation(changeOrder.jobs);
      return includesKeyword(
        [
          changeOrder.title,
          changeOrder.description ?? "",
          changeOrder.status,
          job ? `${job.job_number} ${job.name}` : "",
        ].join(" "),
        keywords,
      );
    })
    : [];

  const fallbackJobs = input.jobs.slice(0, 10);
  const fallbackReports = input.reports.slice(0, 14);
  const fallbackUploads = input.uploads.slice(0, 14);
  const fallbackChangeOrders = input.changeOrders.slice(0, 14);

  return {
    question: input.question,
    keywordsUsed: keywords,
    coverageSummary: {
      jobsFetched: input.jobs.length,
      reportsFetched: input.reports.length,
      uploadsFetched: input.uploads.length,
      changeOrdersFetched: input.changeOrders.length,
      jobsMatched: scopedJobs.length,
      reportsMatched: scopedReports.length,
      uploadsMatched: scopedUploads.length,
      changeOrdersMatched: scopedChangeOrders.length,
    },
    jobs: (scopedJobs.length > 0 ? scopedJobs : fallbackJobs).map((job) => ({
      id: job.id,
      label: `${job.job_number} · ${job.name}`,
      status: job.status,
      startDate: job.start_date,
      targetFinishDate: job.target_finish_date,
      createdAt: job.created_at,
    })),
    dailyReports: (scopedReports.length > 0 ? scopedReports : fallbackReports).map((report) => {
      const job = firstRelation(report.jobs);
      return {
        id: report.id,
        jobId: report.job_id,
        jobLabel: job ? `${job.job_number} · ${job.name}` : "Unknown job",
        reportDate: report.report_date,
        workCompleted: report.work_completed,
        delaysIssues: report.delays_issues,
        materialsDeliveries: report.materials_deliveries,
        safetyNotes: report.safety_notes,
        createdAt: report.created_at,
      };
    }),
    uploads: (scopedUploads.length > 0 ? scopedUploads : fallbackUploads).map((upload) => {
      const job = firstRelation(upload.jobs);
      return {
        id: upload.id,
        jobId: upload.job_id,
        dailyReportId: upload.daily_report_id,
        jobLabel: job ? `${job.job_number} · ${job.name}` : "Unknown job",
        fileName: upload.file_name,
        tag: upload.tag,
        note: upload.note,
        createdAt: upload.created_at,
      };
    }),
    changeOrders: (scopedChangeOrders.length > 0 ? scopedChangeOrders : fallbackChangeOrders).map((changeOrder) => {
      const job = firstRelation(changeOrder.jobs);
      const report = firstRelation(changeOrder.daily_reports);
      return {
        id: changeOrder.id,
        jobId: changeOrder.job_id,
        dailyReportId: changeOrder.daily_report_id,
        jobLabel: job ? `${job.job_number} · ${job.name}` : "Unknown job",
        reportDate: report?.report_date ?? null,
        title: changeOrder.title,
        description: changeOrder.description,
        status: changeOrder.status,
        directCostTotal: changeOrder.direct_cost_total,
        markupPercent: changeOrder.markup_percent,
        totalAmount: changeOrder.total_amount,
        createdAt: changeOrder.created_at,
      };
    }),
    aggregates: {
      activeJobs: input.jobs.filter((job) => ["scheduled", "in_progress", "on_hold"].includes(job.status)).length,
      reportsLast7Days: input.reports.filter((report) => {
        const reportDate = new Date(`${report.report_date}T00:00:00Z`);
        return Date.now() - reportDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
      }).length,
      uploadsLast7Days: input.uploads.filter((upload) => {
        const created = new Date(upload.created_at);
        return Date.now() - created.getTime() <= 7 * 24 * 60 * 60 * 1000;
      }).length,
      openChangeOrders: input.changeOrders.filter((changeOrder) =>
        ["draft", "submitted"].includes(changeOrder.status),
      ).length,
    },
  };
}

function buildCitationValidationSets(groundedSnapshot: ReturnType<typeof buildGroundedSnapshot>) {
  return {
    job: new Set(groundedSnapshot.jobs.map((job) => job.id)),
    daily_report: new Set(groundedSnapshot.dailyReports.map((report) => report.id)),
    upload: new Set(groundedSnapshot.uploads.map((upload) => upload.id)),
    change_order: new Set(groundedSnapshot.changeOrders.map((changeOrder) => changeOrder.id)),
  };
}

export async function POST(request: NextRequest) {
  const parsedBody = AdminOpsCopilotRequestSchema.safeParse(await request.json().catch(() => null));

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Invalid request payload.",
        details: parsedBody.error.flatten(),
      },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: appUser } = await supabase
    .from("users")
    .select("id, company_id, role")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle<{ id: string; company_id: string; role: UserRole }>();

  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!["owner", "office_admin"].includes(appUser.role)) {
    return NextResponse.json({ error: "Admin Ops Copilot is only available to office users." }, { status: 403 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI is not configured. Set OPENAI_API_KEY." }, { status: 500 });
  }

  const [jobsResult, reportsResult, uploadsResult, changeOrdersResult] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, job_number, name, status, start_date, target_finish_date, created_at")
      .eq("company_id", appUser.company_id)
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("daily_reports")
      .select("id, job_id, report_date, work_completed, delays_issues, materials_deliveries, safety_notes, created_at, jobs(job_number, name)")
      .eq("company_id", appUser.company_id)
      .order("report_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("job_files")
      .select("id, job_id, daily_report_id, file_name, tag, note, created_at, jobs(job_number, name)")
      .eq("company_id", appUser.company_id)
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("change_orders")
      .select("id, job_id, daily_report_id, title, description, status, direct_cost_total, markup_percent, total_amount, created_at, jobs(job_number, name), daily_reports(report_date)")
      .eq("company_id", appUser.company_id)
      .order("created_at", { ascending: false })
      .limit(80),
  ]);

  const failedSources = [
    jobsResult.error ? "jobs" : null,
    reportsResult.error ? "daily_reports" : null,
    uploadsResult.error ? "job_files" : null,
    changeOrdersResult.error ? "change_orders" : null,
  ].filter((source): source is string => Boolean(source));

  if (failedSources.length > 0) {
    return NextResponse.json(
      {
        error: "Grounded data sources are unavailable. Admin Ops Copilot cannot answer safely right now.",
        details: {
          failedSources,
        },
      },
      { status: 502 },
    );
  }

  const groundedSnapshot = buildGroundedSnapshot({
    jobs: (jobsResult.data ?? []) as JobSnapshotRow[],
    reports: (reportsResult.data ?? []) as DailyReportSnapshotRow[],
    uploads: (uploadsResult.data ?? []) as UploadSnapshotRow[],
    changeOrders: (changeOrdersResult.data ?? []) as ChangeOrderSnapshotRow[],
    question: parsedBody.data.question,
  });

  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const aiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: PROMPTS.adminOpsCopilotGrounded,
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(
                {
                  question: parsedBody.data.question,
                  instructions: [
                    "Answer in 2-5 concise sentences.",
                    "Only use evidence in groundedSnapshot.",
                    "If evidence is missing or incomplete, confidence must be 'low' or 'medium' and uncertaintyNote must explain what is missing.",
                    "Citations must reference only IDs present in groundedSnapshot records.",
                  ],
                  groundedSnapshot,
                },
                null,
                2,
              ),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "admin_ops_copilot_answer",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["answer", "confidence", "citations"],
            properties: {
              answer: {
                type: "string",
                description: "Concise grounded answer for office admins. Keep practical and factual.",
              },
              confidence: {
                type: "string",
                enum: ["high", "medium", "low"],
              },
              uncertaintyNote: {
                type: "string",
                description: "Required in spirit whenever data is missing or ambiguous.",
              },
              citations: {
                type: "array",
                maxItems: 6,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["entityType", "id", "label", "reason"],
                  properties: {
                    entityType: {
                      type: "string",
                      enum: ["job", "daily_report", "upload", "change_order"],
                    },
                    id: { type: "string" },
                    label: { type: "string" },
                    reason: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      max_output_tokens: 700,
    }),
  });

  const aiBody = await aiResponse.json().catch(() => null);

  if (!aiResponse.ok) {
    return NextResponse.json({ error: extractOpenAIErrorMessage(aiBody) }, { status: 502 });
  }

  const rawText = extractResponseText(aiBody);
  if (!rawText) {
    return NextResponse.json({ error: "AI returned an empty response." }, { status: 502 });
  }

  const parsedJson = safeParseJson(rawText);
  if (!parsedJson.ok) {
    return NextResponse.json({ error: "AI returned an invalid JSON response." }, { status: 502 });
  }

  const parsedResult = AdminOpsCopilotResponseSchema.safeParse(parsedJson.data);
  if (!parsedResult.success) {
    return NextResponse.json({ error: "AI returned an invalid response format." }, { status: 502 });
  }

  const citationSets = buildCitationValidationSets(groundedSnapshot);
  const unresolvedCitations = parsedResult.data.citations.filter((citation) => {
    if (citation.entityType === "job") return !citationSets.job.has(citation.id);
    if (citation.entityType === "daily_report") return !citationSets.daily_report.has(citation.id);
    if (citation.entityType === "upload") return !citationSets.upload.has(citation.id);
    return !citationSets.change_order.has(citation.id);
  });

  if (unresolvedCitations.length > 0) {
    return NextResponse.json(
      {
        error: "AI returned citations that do not resolve to grounded records.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    answer: parsedResult.data,
  });
}
