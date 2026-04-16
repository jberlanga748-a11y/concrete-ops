export function extractResponseText(responseBody: unknown) {
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

export function extractOpenAIErrorMessage(responseBody: unknown) {
  if (responseBody && typeof responseBody === "object" && "error" in responseBody) {
    return ((responseBody as { error?: { message?: string } }).error?.message ?? "OpenAI request failed.");
  }

  return "OpenAI request failed.";
}

export function safeParseJson(rawText: string): { ok: true; data: unknown } | { ok: false } {
  try {
    return { ok: true, data: JSON.parse(rawText) };
  } catch {
    return { ok: false };
  }
}
