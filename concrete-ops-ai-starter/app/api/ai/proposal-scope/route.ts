import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PROMPTS } from "@/lib/ai/prompts";
import { extractOpenAIErrorMessage, extractResponseText, safeParseJson } from "@/lib/ai/route-helpers";

const ProposalScopeRequestSchema = z.object({
  customerLabel: z.string().trim().max(180).optional(),
  jobLabel: z.string().trim().max(180).optional(),
  proposalTitle: z.string().trim().max(220).optional(),
  notes: z.string().trim().max(3000).optional().nullable(),
  sectionHeading: z.string().trim().max(180).optional(),
  roughScopeText: z.string().trim().min(10).max(6000),
});

const ProposalScopeResultSchema = z.object({
  heading: z.string().trim().max(160).optional(),
  content: z.string().trim().min(1).max(2600),
  customerSummary: z.string().trim().max(320).optional(),
});

function buildInputContext(payload: z.infer<typeof ProposalScopeRequestSchema>) {
  return JSON.stringify(
    {
      context: {
        customerLabel: payload.customerLabel ?? null,
        jobLabel: payload.jobLabel ?? null,
        proposalTitle: payload.proposalTitle ?? null,
        notes: payload.notes ?? null,
      },
      section: {
        heading: payload.sectionHeading ?? null,
        roughScopeText: payload.roughScopeText,
      },
    },
    null,
    2,
  );
}

export async function POST(request: NextRequest) {
  const parsedBody = ProposalScopeRequestSchema.safeParse(await request.json().catch(() => null));

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
              text: PROMPTS.proposalScope,
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
          name: "proposal_scope_rewrite",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["content"],
            properties: {
              heading: {
                type: "string",
                description: "Optional concise customer-facing heading for this scope section.",
              },
              content: {
                type: "string",
                description: "Concise, factual, customer-facing proposal scope language with no invented details.",
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

  const parsedResult = ProposalScopeResultSchema.safeParse(parsedJson.data);

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
