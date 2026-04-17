import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PROMPTS } from "@/lib/ai/prompts";
import { extractOpenAIErrorMessage, extractResponseText, safeParseJson } from "@/lib/ai/route-helpers";

const ChangeOrderRewriteRequestSchema = z.object({
  jobLabel: z.string().trim().max(180).optional(),
  dailyReportLabel: z.string().trim().max(180).optional(),
  title: z.string().trim().max(220).optional(),
  description: z.string().trim().min(10).max(6000),
});

const ChangeOrderRewriteResultSchema = z.object({
  description: z.string().trim().min(1).max(2400),
  customerSummary: z.string().trim().max(320).optional(),
});

function buildInputContext(payload: z.infer<typeof ChangeOrderRewriteRequestSchema>) {
  return JSON.stringify(
    {
      context: {
        jobLabel: payload.jobLabel ?? null,
        dailyReportLabel: payload.dailyReportLabel ?? null,
        title: payload.title ?? null,
      },
      notes: {
        description: payload.description,
      },
    },
    null,
    2,
  );
}

export async function POST(request: NextRequest) {
  const parsedBody = ChangeOrderRewriteRequestSchema.safeParse(await request.json().catch(() => null));

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
              text: PROMPTS.changeOrderRewrite,
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
          name: "change_order_rewrite",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["description"],
            properties: {
              description: {
                type: "string",
                description:
                  "Concise, factual, customer-safe change order description in plain business language.",
              },
              customerSummary: {
                type: "string",
                description: "Optional one-line customer-safe summary suitable for quick review.",
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

  const parsedResult = ChangeOrderRewriteResultSchema.safeParse(parsedJson.data);

  if (!parsedResult.success) {
    return NextResponse.json(
      {
        error: "AI returned an invalid response format.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    rewritten: parsedResult.data,
  });
}
