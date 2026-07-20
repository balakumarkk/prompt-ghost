import { Storage } from "@plasmohq/storage"
import { fetchCompletion } from "./utils/llm/llmClient"

const storage = new Storage()
const activeRequests = new Map<number, AbortController>()

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_COMPLETION") {
    console.log("[Background] Received GET_COMPLETION message. Text prefix:", JSON.stringify(message.text));
    const tabId = sender.tab?.id
    if (tabId === undefined) {
      console.warn("[Background] No active tab ID found");
      sendResponse({ error: "No active tab ID found" })
      return true
    }

    // Immediately abort any running request for this tab
    const existingController = activeRequests.get(tabId)
    if (existingController) {
      try {
        console.log("[Background] Aborting previous request for tab:", tabId);
        existingController.abort()
      } catch (err) {
        console.warn("[Background] Error aborting previous request:", err)
      }
      activeRequests.delete(tabId)
    }

    const controller = new AbortController()
    activeRequests.set(tabId, controller)

    // Run async IIFE because addListener handler needs to return true for async sendResponse
    ;(async () => {
      try {
        const enabled = (await storage.get<boolean>("pg_enabled")) ?? true
        console.log("[Background] Enabled state:", enabled);
        if (!enabled) {
          sendResponse({ completion: "" })
          return
        }

        const provider = (await storage.get<string>("pg_provider")) || "openai"
        const apiKey = (await storage.get<string>("pg_api_key")) || ""
        const baseUrl = (await storage.get<string>("pg_base_url")) || ""
        let selectedModel = (await storage.get<string>("pg_model")) || ""
        const customModel = (await storage.get<string>("pg_custom_model")) || ""

        if (selectedModel === "llama-3.1-70b-versatile") {
          console.log("[Background] Migrating decommissioned model llama-3.1-70b-versatile to llama-3.3-70b-versatile");
          selectedModel = "llama-3.3-70b-versatile"
          await storage.set("pg_model", "llama-3.3-70b-versatile")
        }

        console.log("[Background] Provider:", provider, "Model:", selectedModel, "Custom Model:", customModel, "Has API Key:", !!apiKey);

        if (!apiKey) {
          console.warn("[Background] API Key is missing. Cannot proceed.");
          sendResponse({ error: "API Key required. Please configure it in the popup." })
          return
        }

        const modelName = selectedModel === "custom" ? customModel : selectedModel
        console.log("[Background] Fetching completion via client for model:", modelName, "base URL:", baseUrl);

        const completion = await fetchCompletion(
          provider,
          apiKey,
          modelName,
          baseUrl,
          message.text,
          controller.signal
        )

        console.log("[Background] Completion fetched successfully:", JSON.stringify(completion));
        sendResponse({ completion })
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("[Background] Request was aborted silently");
          // Silent response for aborted requests
          sendResponse({ completion: "", aborted: true })
        } else {
          console.error("[Background] Error in background completion:", error)
          sendResponse({ error: error.message || String(error) })
        }
      } finally {
        // Clean up the controller if it matches the current one in the map
        if (activeRequests.get(tabId) === controller) {
          activeRequests.delete(tabId)
        }
      }
    })()

    return true // Keep channel open for async sendResponse
  }
})
