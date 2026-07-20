import { fetchOpenAICompletion } from "./providers/openai"
import { fetchGroqCompletion } from "./providers/groq"
import { fetchAnthropicCompletion } from "./providers/anthropic"
import { fetchCustomCompletion } from "./providers/custom"

export async function fetchCompletion(
  provider: string,
  apiKey: string,
  model: string,
  baseUrl: string,
  text: string,
  signal?: AbortSignal
): Promise<string> {
  const p = provider ? provider.toLowerCase() : "openai"
  switch (p) {
    case "openai":
      return fetchOpenAICompletion(apiKey, model, text, signal)
    case "groq":
      return fetchGroqCompletion(apiKey, model, text, signal)
    case "anthropic":
      return fetchAnthropicCompletion(apiKey, model, text, signal)
    case "custom":
      return fetchCustomCompletion(apiKey, model, baseUrl, text, signal)
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}
