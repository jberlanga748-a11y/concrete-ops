export async function callOpenAI(endpoint: string, body: unknown) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status}`);
  }

  return response.json();
}
