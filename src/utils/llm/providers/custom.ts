export async function fetchCustomCompletion(
  apiKey: string,
  model: string,
  baseUrl: string,
  text: string,
  signal?: AbortSignal
): Promise<string> {
  let endpoint = baseUrl || "http://localhost:11434/v1"
  if (!endpoint.endsWith("/chat/completions")) {
    endpoint = endpoint.replace(/\/+$/, "") + "/chat/completions"
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  }
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: model || "default",
      messages: [
        {
          role: "system",
          content: "You are a text autocomplete engine. Complete the user's input text naturally. Output ONLY the exact continuation. Do not wrap in quotes. Do not repeat the user's input. Do not output anything else. If no logical completion exists, respond with absolutely nothing."
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.2,
      max_tokens: 50
    }),
    signal
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Custom provider API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ""
}
