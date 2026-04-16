import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PROMPTS } from "@/lib/ai/prompts";

const DailyReportCleanupRequestSchema = z.object({
  jobLabel: z.string().trim().max(180).optional(),
  reportDate: z.string().trim().max(40).optional(),
  workCompleted: z.string().trim().min(10).max(6000),
  delaysIssues: z.string().trim().max(3000).optional().nullable(),
  materialsDeliveries: z.string().trim().max(3000).optional().nullable(),
  safetyNotes: z.string().trim().max(3000).optional().nullable(),
});

const DailyReportCleanupResultSchema = z.object({
  workCompleted: z.string().trim().min(1).max(2200),
  delaysIssues: z.string().trim().max(1200),
  materialsDeliveries: z.string().trim().max(1200),
  safetyNotes: z.string().trim().max(1200),
  officeSummary: z.string().trim().max(420).optional(),
});

function buildInputContext(payload: z.infer<typeof DailyReportCleanupRequestSchema>) {
  return JSON.stringify(
    {
      context: {
        jobLabel: payload.jobLabel ?? null,
        reportDate: payload.reportDate ?? null,
      },
      notes: {
        workCompleted: payload.workCompleted,
        delaysIssues: payload.delaysIssues ?? "",
        materialsDeliveries: payload.materialsDeliveries ?? "",
        safetyNotes: payload.safetyNotes ?? "",
      },
    },
    null,
    2,
  );
}

function extractResponseText(responseBody: unknown) {
  if (!responseBody || typeof responseBody !== "object") return null;

  const body = responseBody as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };

  if (typeof body.output_text === "string" && body.output_text.trim()) {
    return body.output_text;
  }

  const textParts: string[] = [];
  for (const item of body.output ?? []) {
    for (const contentItem of item.content ?? []) {
      if (contentItem?.type === "output_text" && typeof contentItem.text === "string") {
        textParts.push(contentItem.text);
      }
    }
  }

  const joined = textParts.join("\n").trim();
  return joined || null;
}

export async function POST(request: NextRequest) {
  const parsedBody = DailyReportCleanupRequestSchema.safeParse(await request.json().catch(() => null));

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Invalid request payload.",
        details: parsedBody.error.flatten(),
      },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "OpenAI is not configured. Set OPENAI_API_KEY.",
      },
      { status: 500 },
    );
  }

  const payload = parsedBody.data;
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
              text: PROMPTS.dailyReportCleanup,
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildInputContext(payload),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "daily_report_cleanup",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["workCompleted", "delaysIssues", "materialsDeliveries", "safetyNotes"],
            properties: {
              workCompleted: {
                type: "string",
                description: "Concise office-ready completion summary in plain language.",
              },
              delaysIssues: {
                type: "string",
                description: "Short delay/issues summary. Use 'None reported.' if no issues.",
              },
              materialsDeliveries: {
                type: "string",
                description: "Short deliveries/materials summary. Use 'No notable deliveries.' if none.",
              },
              safetyNotes: {
                type: "string",
                description: "Short safety summary. Use 'No safety incidents reported.' if none.",
              },
              officeSummary: {
                type: "string",
                description: "Optional one-line office handoff summary.",
              },
            },
          },
        },
      },
      max_output_tokens: 500,
    }),
  });

  const aiBody = await aiResponse.json().catch(() => null);

  if (!aiResponse.ok) {
    const errorMessage =
      aiBody && typeof aiBody === "object" && "error" in aiBody
        ? ((aiBody as { error?: { message?: string } }).error?.message ?? "OpenAI request failed.")
        : "OpenAI request failed.";

    return NextResponse.json({ error: errorMessage }, { status: 502 });
  }

  const rawText = extractResponseText(aiBody);
  if (!rawText) {
    return NextResponse.json(
      { error: "AI returned an empty response." },
      { status: 502 },
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawText);
  } catch {
    return NextResponse.json({ error: "AI response was not valid JSON." }, { status: 502 });
  }

  const parsedResult = DailyReportCleanupResultSchema.safeParse(parsedJson);

  if (!parsedResult.success) {
    return NextResponse.json(
      {
        error: "AI returned an invalid response format.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    cleaned: parsedResult.data,
  });
}
