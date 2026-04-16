type JsonRequestResult<T> = {
  response: Response;
  data: T | null;
};

export async function postJson<T>(url: string, payload: unknown): Promise<JsonRequestResult<T>> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as T | null;
  return { response, data };
}
