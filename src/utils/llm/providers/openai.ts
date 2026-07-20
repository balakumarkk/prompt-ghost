export async function fetchOpenAICompletion(
  apiKey: string,
  model: string,
  text: string,
  signal?: AbortSignal
): Promise<string> {
  if (!apiKey) {
    throw new Error("OpenAI API Key is missing.")
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || "gpt-4o-mini",
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
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ""
}
