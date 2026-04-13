import { NextRequest, NextResponse } from "next/server";
import { PROMPTS } from "@/lib/ai/prompts";

export async function POST(request: NextRequest) {
  const body = await request.json();

  return NextResponse.json({
    message: "Wire this route to the OpenAI Responses API.",
    prompt: PROMPTS.changeOrderRewrite,
    input: body,
  });
}
