export async function fetchAnthropicCompletion(
  apiKey: string,
  model: string,
  text: string,
  signal?: AbortSignal
): Promise<string> {
  if (!apiKey) {
    throw new Error("Anthropic API Key is missing.")
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: model || "claude-3-5-sonnet-latest",
      max_tokens: 50,
      temperature: 0.2,
      system: "You are a text autocomplete engine. Complete the user's input text naturally. Output ONLY the exact continuation. Do not wrap in quotes. Do not repeat the user's input. Do not output anything else. If no logical completion exists, respond with absolutely nothing.",
      messages: [
        {
          role: "user",
          content: text
        }
      ]
    }),
    signal
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text || ""
}
