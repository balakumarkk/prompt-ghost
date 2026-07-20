import { Storage } from "@plasmohq/storage"
import {
  showTextareaSuggestion,
  clearTextareaSuggestion,
  acceptTextareaSuggestion
} from "./textareaOverlay"
import {
  showContentEditableSuggestion,
  clearContentEditableSuggestion,
  acceptContentEditableSuggestion,
  getContentEditableTextUpToCaret
} from "./contenteditableGhost"

const storage = new Storage()

let activeSuggestion = ""
let activeTarget: HTMLElement | null = null
let debounceTimer: any = null
let prefixAtRequest = ""

function isTextarea(el: HTMLElement): el is HTMLTextAreaElement {
  return el.tagName.toLowerCase() === "textarea"
}

function isContentEditable(el: HTMLElement): boolean {
  return el.isContentEditable
}

export function initGhostController() {
  document.addEventListener("input", handleInput, true)
  document.addEventListener("keydown", handleKeydown, true)
  document.addEventListener("focus", handleFocus, true)
  document.addEventListener("blur", handleBlur, true)
  document.addEventListener("click", handleClick, true)
}

function clearCurrentSuggestion() {
  console.log("[GhostController] clearing current suggestion. Active target was:", activeTarget);
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }

  if (activeTarget) {
    if (isTextarea(activeTarget)) {
      clearTextareaSuggestion(activeTarget as HTMLTextAreaElement)
    } else {
      clearContentEditableSuggestion(activeTarget)
    }
  }

  activeSuggestion = ""
  activeTarget = null
  prefixAtRequest = ""
}

async function handleInput(e: Event) {
  const target = e.target as HTMLElement
  if (!target) return

  const isTA = isTextarea(target)
  const isCE = isContentEditable(target)
  console.log("[GhostController] handleInput triggered. isTextarea:", isTA, "isContentEditable:", isCE);
  if (!isTA && !isCE) return

  // Clear immediately on user typing or deleting
  clearCurrentSuggestion()

  // Reset debounce timer
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(async () => {
    try {
      console.log("[GhostController] Debounce fired. Checking settings...");
      const enabled = (await storage.get<boolean>("pg_enabled")) ?? true
      console.log("[GhostController] pg_enabled state:", enabled);
      if (!enabled) return

      const apiKey = await storage.get<string>("pg_api_key")
      console.log("[GhostController] pg_api_key exists:", !!apiKey);
      if (!apiKey) return

      let textPrefix = ""
      if (isTA) {
        const ta = target as HTMLTextAreaElement
        textPrefix = ta.value.substring(0, ta.selectionStart)
      } else {
        textPrefix = getContentEditableTextUpToCaret(target)
      }

      console.log("[GhostController] textPrefix calculated:", JSON.stringify(textPrefix));
      if (!textPrefix || textPrefix.trim().length === 0) {
        console.log("[GhostController] Empty prefix, skipping request.");
        return
      }

      prefixAtRequest = textPrefix
      activeTarget = target

      console.log("[GhostController] Sending GET_COMPLETION message to background...");
      chrome.runtime.sendMessage(
        { type: "GET_COMPLETION", text: textPrefix },
        (response) => {
          console.log("[GhostController] Response received from background:", response);
          if (chrome.runtime.lastError) {
            console.error("[GhostController] runtime.lastError:", chrome.runtime.lastError);
          }

          // Verify the tab still has target active and text prefix hasn't changed since dispatch
          if (document.activeElement !== target) {
            console.log("[GhostController] activeElement changed, skipping. Active:", document.activeElement, "target:", target);
            return
          }

          let currentPrefix = ""
          if (isTA) {
            const ta = target as HTMLTextAreaElement
            currentPrefix = ta.value.substring(0, ta.selectionStart)
          } else {
            currentPrefix = getContentEditableTextUpToCaret(target)
          }

          if (currentPrefix !== prefixAtRequest) {
            console.log("[GhostController] Prefix changed. Expected:", JSON.stringify(prefixAtRequest), "Got:", JSON.stringify(currentPrefix));
            return
          }

          if (response && response.completion) {
            activeSuggestion = response.completion
            console.log("[GhostController] Displaying completion suggestion:", JSON.stringify(response.completion));
            if (isTA) {
              showTextareaSuggestion(target as HTMLTextAreaElement, response.completion)
            } else {
              showContentEditableSuggestion(target, response.completion)
            }
          } else if (response && response.error) {
            console.error("[GhostController] Background completion returned error:", response.error);
          } else {
            console.log("[GhostController] No completion returned in response");
          }
        }
      )
    } catch (err) {
      console.error("[GhostController] Error fetching autocompletion:", err)
    }
  }, 450)
}

function handleKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement
  if (!target) return

  if (e.key === "Tab" && activeSuggestion && activeTarget === target) {
    e.preventDefault()
    e.stopPropagation()

    const isTA = isTextarea(target)
    if (isTA) {
      acceptTextareaSuggestion(target as HTMLTextAreaElement, activeSuggestion)
    } else {
      acceptContentEditableSuggestion(target, activeSuggestion)
    }

    clearCurrentSuggestion()
  } else if (activeSuggestion) {
    // Clear suggestions immediately if any other key is pressed
    clearCurrentSuggestion()
  }
}

function handleFocus(e: FocusEvent) {
  // Clear any dangling suggestions when changing active inputs
  clearCurrentSuggestion()
}

function handleBlur(e: FocusEvent) {
  // Clean suggestion markup when leaving the active input
  clearCurrentSuggestion()
}

function handleClick(e: MouseEvent) {
  // Clear suggestion if mouse repositioning happens
  clearCurrentSuggestion()
}
